//! CLI spike — Branche B du PDD Cyber-Deck.
//! Capture WASAPI loopback → FFT → bandes agrégées → vumètre terminal.

use realfft::RealFftPlanner;
use rustfft::num_complex::Complex;
use std::collections::VecDeque;
use std::io::{self, Write};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use wasapi::*;

const FFT_SIZE: usize = 2048;
const NUM_BANDS: usize = 6;

type Res<T> = Result<T, Box<dyn std::error::Error>>;

fn aggregate_bands(magnitudes: &[f32], sample_rate: u32) -> [f32; NUM_BANDS] {
    let bin_hz = sample_rate as f32 / FFT_SIZE as f32;
    let ranges = [
        (20.0, 60.0),
        (60.0, 150.0),
        (150.0, 400.0),
        (400.0, 2000.0),
        (2000.0, 8000.0),
        (8000.0, sample_rate as f32 / 2.0 - 1.0),
    ];

    let mut bands = [0.0f32; NUM_BANDS];
    for (i, (lo, hi)) in ranges.iter().enumerate() {
        let start = (*lo / bin_hz).ceil() as usize;
        let end = (*hi / bin_hz).floor() as usize;
        if start >= magnitudes.len() {
            continue;
        }
        let end = end.min(magnitudes.len() - 1);
        if end <= start {
            continue;
        }
        let sum: f32 = magnitudes[start..=end].iter().sum();
        let avg = sum / (end - start + 1) as f32;
        bands[i] = (1.0 + avg * 500.0).ln() / 8.0;
    }

    bands[5] = bands[1].max(bands[0]) * 1.2;
    bands.map(|b| b.clamp(0.0, 1.0))
}

fn render_vu(bands: &[f32; NUM_BANDS]) -> String {
    bands
        .iter()
        .map(|&b| {
            let bars = (b * 20.0).round() as usize;
            "|".repeat(bars)
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn bytes_to_mono_f32(bytes: &[u8], channels: u16) -> Vec<f32> {
    let mut mono = Vec::with_capacity(bytes.len() / (4 * channels as usize));
    for frame in bytes.chunks(channels as usize * 4) {
        if frame.len() >= 4 {
            mono.push(f32::from_le_bytes([frame[0], frame[1], frame[2], frame[3]]));
        }
    }
    mono
}

fn capture_loop(tx: mpsc::SyncSender<Vec<f32>>, chunksize: usize) -> Res<()> {
    // Render endpoint + Capture direction = loopback (mix système)
    let device = get_default_device(&Direction::Render)?;
    let mut audio_client = device.get_iaudioclient()?;

    let desired_format = WaveFormat::new(32, 32, &SampleType::Float, 48000, 2, None);
    let blockalign = desired_format.get_blockalign();
    let (_, min_time) = audio_client.get_device_period()?;

    let mode = StreamMode::EventsShared {
        autoconvert: true,
        buffer_duration_hns: min_time,
    };
    audio_client.initialize_client(&desired_format, &Direction::Capture, &mode)?;

    let h_event = audio_client.set_get_eventhandle()?;
    let buffer_frame_count = audio_client.get_buffer_size()?;
    let capture_client = audio_client.get_audiocaptureclient()?;
    let channels = desired_format.get_nchannels();

    let mut sample_queue: VecDeque<u8> = VecDeque::with_capacity(
        100 * blockalign as usize * (1024 + 2 * buffer_frame_count as usize),
    );

    audio_client.start_stream()?;

    loop {
        while sample_queue.len() > blockalign as usize * chunksize {
            let mut chunk_bytes = vec![0u8; blockalign as usize * chunksize];
            for b in chunk_bytes.iter_mut() {
                *b = sample_queue.pop_front().unwrap_or(0);
            }
            let mono = bytes_to_mono_f32(&chunk_bytes, channels);
            tx.send(mono).ok();
        }

        capture_client.read_from_device_to_deque(&mut sample_queue)?;
        if h_event.wait_for_event(3000).is_err() {
            audio_client.stop_stream()?;
            break;
        }
    }
    Ok(())
}

fn main() -> Res<()> {
    println!("Cyber-Deck Audio Spike — WASAPI loopback");
    println!("Lance de la musique, observe les barres. Ctrl+C pour quitter.\n");

    let _ = initialize_mta();

    let (tx, rx) = mpsc::sync_channel::<Vec<f32>>(4);
    let chunksize = 1024;

    thread::Builder::new()
        .name("capture".into())
        .spawn(move || {
            if let Err(e) = capture_loop(tx, chunksize) {
                eprintln!("Capture error: {e}");
            }
        })?;

    let mut planner = RealFftPlanner::<f32>::new();
    let r2c = planner.plan_fft_forward(FFT_SIZE);
    let mut indata = vec![0.0f32; FFT_SIZE];
    let mut outdata = vec![Complex::<f32>::new(0.0, 0.0); FFT_SIZE / 2 + 1];
    let mut sample_buf: Vec<f32> = Vec::with_capacity(FFT_SIZE * 4);
    let mut prev_bands = [0.0f32; NUM_BANDS];
    let mut last_print = Instant::now();
    let sample_rate = 48000u32;

    loop {
        while let Ok(chunk) = rx.try_recv() {
            sample_buf.extend(chunk);
            if sample_buf.len() > FFT_SIZE * 8 {
                sample_buf.drain(0..sample_buf.len() - FFT_SIZE * 4);
            }
        }

        if sample_buf.len() >= FFT_SIZE {
            indata.copy_from_slice(&sample_buf[sample_buf.len() - FFT_SIZE..]);
            r2c.process(&mut indata, &mut outdata)?;

            let magnitudes: Vec<f32> = outdata.iter().map(|c| c.norm()).collect();
            let mut bands = aggregate_bands(&magnitudes, sample_rate);

            let delta = bands[1] - prev_bands[1];
            if delta > 0.15 {
                bands[5] = bands[5].max(delta * 2.0).min(1.0);
            }
            prev_bands = bands;

            if last_print.elapsed() >= Duration::from_millis(50) {
                print!("\x1b[2J\x1b[H");
                println!("Cyber-Deck Audio Spike — {sample_rate} Hz loopback");
                println!("Bands: sub  bass  lo-mid  mid  high  peak");
                println!("{}", render_vu(&bands));
                println!(
                    "[{:.2} {:.2} {:.2} {:.2} {:.2} {:.2}]",
                    bands[0], bands[1], bands[2], bands[3], bands[4], bands[5]
                );
                io::stdout().flush()?;
                last_print = Instant::now();
            }
        }

        thread::sleep(Duration::from_millis(16));
    }
}
