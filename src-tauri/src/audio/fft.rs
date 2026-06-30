use rustfft::num_complex::Complex;
use serde::Serialize;
use std::time::{Duration, Instant};

pub const FFT_SIZE: usize = 2048;
pub const NUM_BANDS: usize = 6;

/// PDD §3.2 — silence > ~2 s avant retour repos
pub const SILENCE_MS: u128 = 2000;
/// PDD §3.2 — seuil élevé pour transitoires (kick/snare)
pub const TRANSIENT_THRESHOLD: f32 = 0.15;
/// PDD §3.2 — énergie sous laquelle on considère le silence en cours
pub const SILENCE_ENERGY: f32 = 0.08;

#[derive(Clone, Serialize)]
pub struct AudioBandsPayload {
    pub bands: [f32; NUM_BANDS],
    pub silent: bool,
    pub energy: f32,
}

pub fn aggregate_bands(magnitudes: &[f32], sample_rate: u32) -> [f32; NUM_BANDS] {
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

pub fn filter_pollution(bands: &mut [f32; NUM_BANDS]) {
    let bass = (bands[0] + bands[1]) * 0.5;
    let highs = bands[4];
    let peak = bands[5];
    // PDD §3.2 — sons aigus courts sans fond basse (notifications, etc.)
    if (highs > 0.3 || peak > 0.35) && bass < 0.1 {
        bands[4] *= 0.4;
        bands[5] *= 0.2;
    }
}

pub fn apply_transient(prev_bass: f32, bands: &mut [f32; NUM_BANDS], threshold: f32) {
    let delta = bands[1] - prev_bass;
    if delta > threshold {
        bands[5] = bands[5].max(delta * 2.0).min(1.0);
    }
}

pub fn smooth_bands(current: &mut [f32; NUM_BANDS], target: &[f32; NUM_BANDS], alpha: f32) {
    for (c, t) in current.iter_mut().zip(target.iter()) {
        *c += (*t - *c) * alpha;
    }
}

pub fn magnitudes_from_fft(outdata: &[Complex<f32>]) -> Vec<f32> {
    outdata.iter().map(|c| c.norm()).collect()
}

pub fn is_silent(energy: f32, silent_since: &mut Option<Instant>, threshold_ms: u128) -> bool {
    if energy > SILENCE_ENERGY {
        *silent_since = None;
        return false;
    }
    if silent_since.is_none() {
        *silent_since = Some(Instant::now());
    }
    silent_since
        .map(|t| t.elapsed() > Duration::from_millis(threshold_ms as u64))
        .unwrap_or(false)
}
