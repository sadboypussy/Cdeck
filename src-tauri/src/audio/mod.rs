mod device;
mod fft;
mod loopback;

use device::watch_default_device;
use fft::{
    aggregate_bands, apply_transient, filter_pollution, is_silent, magnitudes_from_fft,
    smooth_bands_asymmetric, AudioBandsPayload, FFT_SIZE, NUM_BANDS, SILENCE_MS,
    TRANSIENT_THRESHOLD,
};
use loopback::capture_loop;
use realfft::RealFftPlanner;
use rustfft::num_complex::Complex;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc;
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use wasapi::initialize_mta;

const EMIT_INTERVAL_MS: u64 = 16;

pub fn start(app: AppHandle) {
    thread::Builder::new()
        .name("cyber-deck-audio".into())
        .spawn(move || audio_engine(app))
        .ok();
}

fn audio_engine(app: AppHandle) {
    let _ = initialize_mta();

    loop {
        if let Err(e) = run_session(&app) {
            eprintln!("[audio] session ended: {e}");
        }
        thread::sleep(Duration::from_millis(500));
    }
}

fn run_session(app: &AppHandle) -> Result<(), String> {
    let stop = Arc::new(AtomicBool::new(false));
    let sample_rate = Arc::new(AtomicU32::new(48000));
    let (device_tx, device_rx) = mpsc::channel();

    let stop_watch = stop.clone();
    let watcher = thread::Builder::new()
        .name("audio-device-watch".into())
        .spawn(move || watch_default_device(&stop_watch, device_tx))
        .map_err(|e| e.to_string())?;

    let (sample_tx, sample_rx) = mpsc::sync_channel::<Vec<f32>>(8);
    let stop_capture = stop.clone();
    let rate_capture = sample_rate.clone();
    let capture = thread::Builder::new()
        .name("wasapi-loopback".into())
        .spawn(move || capture_loop(sample_tx, 1024, stop_capture, rate_capture))
        .map_err(|e| e.to_string())?;

    run_analysis_loop(app, sample_rx, device_rx, &capture, stop.clone(), sample_rate)?;

    stop.store(true, Ordering::Relaxed);
    match capture.join() {
        Ok(Ok(())) => {}
        Ok(Err(e)) => eprintln!("[audio] capture error: {e}"),
        Err(_) => return Err("capture join failed".to_string()),
    }
    watcher.join().map_err(|_| "watcher join failed".to_string())?;
    Ok(())
}

fn run_analysis_loop(
    app: &AppHandle,
    rx: mpsc::Receiver<Vec<f32>>,
    device_rx: mpsc::Receiver<()>,
    capture_handle: &JoinHandle<Result<(), String>>,
    stop: Arc<AtomicBool>,
    sample_rate: Arc<AtomicU32>,
) -> Result<(), String> {
    let mut planner = RealFftPlanner::<f32>::new();
    let r2c = planner.plan_fft_forward(FFT_SIZE);
    let mut indata = vec![0.0f32; FFT_SIZE];
    let mut outdata = vec![Complex::<f32>::new(0.0, 0.0); FFT_SIZE / 2 + 1];
    let mut sample_buf: Vec<f32> = Vec::with_capacity(FFT_SIZE * 4);
    let mut prev_bands = [0.0f32; NUM_BANDS];
    let mut smoothed = [0.0f32; NUM_BANDS];
    let mut last_emit = Instant::now();
    let mut silent_since: Option<Instant> = None;

    while !capture_handle.is_finished() {
        if device_rx.try_recv().is_ok() {
            eprintln!("[audio] default output device changed — reconnecting");
            stop.store(true, Ordering::Relaxed);
            break;
        }

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
                let rate = sample_rate.load(Ordering::Relaxed).max(8000);
                let magnitudes = magnitudes_from_fft(&outdata);
                let mut bands = aggregate_bands(&magnitudes, rate);
                filter_pollution(&mut bands);
                apply_transient(prev_bands[1], &mut bands, TRANSIENT_THRESHOLD);
                prev_bands = bands;

                let energy: f32 = bands.iter().take(5).sum::<f32>() / 5.0;
                let silent_flag = is_silent(energy, &mut silent_since, SILENCE_MS);
                if silent_flag {
                    smooth_bands_asymmetric(&mut smoothed, &bands, 0.28, 0.14);
                } else {
                    smooth_bands_asymmetric(&mut smoothed, &bands, 0.78, 0.32);
                }

                let payload = AudioBandsPayload {
                    bands: smoothed,
                    silent: silent_flag,
                    energy: smoothed.iter().take(5).sum::<f32>() / 5.0,
                };
                let _ = app.emit("audio-bands", &payload);
            }
            last_emit = Instant::now();
        }

        thread::sleep(Duration::from_millis(8));
    }

    Ok(())
}
