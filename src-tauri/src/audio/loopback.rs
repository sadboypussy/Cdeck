use std::collections::VecDeque;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::sync::Arc;
use wasapi::*;

pub fn bytes_to_mono_f32(bytes: &[u8], channels: u16) -> Vec<f32> {
    let mut mono = Vec::with_capacity(bytes.len() / (4 * channels as usize).max(1));
    for frame in bytes.chunks(channels as usize * 4) {
        if frame.len() >= 4 {
            mono.push(f32::from_le_bytes([frame[0], frame[1], frame[2], frame[3]]));
        }
    }
    mono
}

/// Capture loopback jusqu'à arrêt explicite ou erreur.
pub fn capture_loop(
    tx: mpsc::SyncSender<Vec<f32>>,
    chunksize: usize,
    stop: Arc<AtomicBool>,
) -> Result<(), String> {
    let device = get_default_device(&Direction::Render).map_err(|e| e.to_string())?;
    let mut audio_client = device.get_iaudioclient().map_err(|e| e.to_string())?;

    let desired_format = WaveFormat::new(32, 32, &SampleType::Float, 48000, 2, None);
    let blockalign = desired_format.get_blockalign();
    let (_, min_time) = audio_client.get_device_period().map_err(|e| e.to_string())?;

    let mode = StreamMode::EventsShared {
        autoconvert: true,
        buffer_duration_hns: min_time,
    };
    audio_client
        .initialize_client(&desired_format, &Direction::Capture, &mode)
        .map_err(|e| e.to_string())?;

    let h_event = audio_client.set_get_eventhandle().map_err(|e| e.to_string())?;
    let buffer_frame_count = audio_client.get_buffer_size().map_err(|e| e.to_string())?;
    let capture_client = audio_client.get_audiocaptureclient().map_err(|e| e.to_string())?;
    let channels = desired_format.get_nchannels();

    let mut sample_queue: VecDeque<u8> = VecDeque::with_capacity(
        100 * blockalign as usize * (1024 + 2 * buffer_frame_count as usize),
    );

    audio_client.start_stream().map_err(|e| e.to_string())?;

    while !stop.load(Ordering::Relaxed) {
        while sample_queue.len() > blockalign as usize * chunksize {
            let mut chunk_bytes = vec![0u8; blockalign as usize * chunksize];
            for b in chunk_bytes.iter_mut() {
                *b = sample_queue.pop_front().unwrap_or(0);
            }
            let mono = bytes_to_mono_f32(&chunk_bytes, channels);
            if tx.send(mono).is_err() {
                audio_client.stop_stream().ok();
                return Ok(());
            }
        }

        if stop.load(Ordering::Relaxed) {
            break;
        }

        capture_client
            .read_from_device_to_deque(&mut sample_queue)
            .map_err(|e| e.to_string())?;

        if h_event.wait_for_event(3000).is_err() {
            continue;
        }
    }

    audio_client.stop_stream().ok();
    Ok(())
}
