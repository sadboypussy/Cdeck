mod fft;
mod loopback;

use fft::{
    aggregate_bands, apply_transient, is_silent, magnitudes_from_fft, AudioBandsPayload, FFT_SIZE,
    NUM_BANDS,
};
use loopback::capture_loop;
use realfft::RealFftPlanner;
use rustfft::num_complex::Complex;
use std::sync::mpsc;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use wasapi::initialize_mta;

const EMIT_INTERVAL_MS: u64 = 33;

pub fn start(app: AppHandle) {
    thread::Builder::new()
        .name("cyber-deck-audio".into())
        .spawn(move || audio_engine(app))
        .ok();
}

fn audio_engine(app: AppHandle) {
    let _ = initialize_mta();

    loop {
        let (tx, rx) = mpsc::sync_channel::<Vec<f32>>(8);

        let capture_handle: JoinHandle<()> = match thread::Builder::new()
            .name("wasapi-loopback".into())
            .spawn({
                let capture_tx = tx.clone();
                move || {
                    if let Err(e) = capture_loop(capture_tx, 1024) {
                        eprintln!("[audio] capture ended: {e}");
                    }
                }
            }) {
            Ok(h) => h,
            Err(e) => {
                eprintln!("[audio] failed to spawn capture: {e}");
                thread::sleep(Duration::from_secs(2));
                continue;
            }
        };

        run_analysis_loop(&app, rx, capture_handle);
        thread::sleep(Duration::from_secs(2));
    }
}

fn run_analysis_loop(
    app: &AppHandle,
    rx: mpsc::Receiver<Vec<f32>>,
    capture_handle: JoinHandle<()>,
) {
    let mut planner = RealFftPlanner::<f32>::new();
    let r2c = planner.plan_fft_forward(FFT_SIZE);
    let mut indata = vec![0.0f32; FFT_SIZE];
    let mut outdata = vec![Complex::<f32>::new(0.0, 0.0); FFT_SIZE / 2 + 1];
    let mut sample_buf: Vec<f32> = Vec::with_capacity(FFT_SIZE * 4);
    let mut prev_bands = [0.0f32; NUM_BANDS];
    let mut last_emit = Instant::now();
    let mut silent_since: Option<Instant> = None;
    let sample_rate = 48000u32;

    while !capture_handle.is_finished() {
        while let Ok(chunk) = rx.try_recv() {
            sample_buf.extend(chunk);
            if sample_buf.len() > FFT_SIZE * 8 {
                sample_buf.drain(0..sample_buf.len() - FFT_SIZE * 4);
            }
        }

        if sample_buf.len() >= FFT_SIZE
            && last_emit.elapsed().as_millis() >= EMIT_INTERVAL_MS as u128
        {
            indata.copy_from_slice(&sample_buf[sample_buf.len() - FFT_SIZE..]);
            if r2c.process(&mut indata, &mut outdata).is_ok() {
                let magnitudes = magnitudes_from_fft(&outdata);
                let mut bands = aggregate_bands(&magnitudes, sample_rate);
                apply_transient(prev_bands[1], &mut bands);
                prev_bands = bands;

                let energy: f32 = bands.iter().take(5).sum::<f32>() / 5.0;
                if energy > 0.08 {
                    silent_since = None;
                } else if silent_since.is_none() {
                    silent_since = Some(Instant::now());
                }

                let payload = AudioBandsPayload {
                    bands,
                    silent: is_silent(&bands, silent_since),
                };
                let _ = app.emit("audio-bands", &payload);
            }
            last_emit = Instant::now();
        }

        thread::sleep(Duration::from_millis(8));
    }
}
