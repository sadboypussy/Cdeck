use rustfft::num_complex::Complex;
use serde::Serialize;

pub const FFT_SIZE: usize = 2048;
pub const NUM_BANDS: usize = 6;

#[derive(Clone, Serialize)]
pub struct AudioBandsPayload {
    pub bands: [f32; NUM_BANDS],
    pub silent: bool,
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

pub fn apply_transient(prev_bass: f32, bands: &mut [f32; NUM_BANDS]) {
    let delta = bands[1] - prev_bass;
    if delta > 0.15 {
        bands[5] = bands[5].max(delta * 2.0).min(1.0);
    }
}

pub fn magnitudes_from_fft(outdata: &[Complex<f32>]) -> Vec<f32> {
    outdata.iter().map(|c| c.norm()).collect()
}

pub fn is_silent(bands: &[f32; NUM_BANDS], silent_since: Option<std::time::Instant>) -> bool {
    let energy: f32 = bands.iter().take(5).sum::<f32>() / 5.0;
    if energy > 0.08 {
        return false;
    }
    silent_since
        .map(|t| t.elapsed().as_millis() > 2000)
        .unwrap_or(false)
}
