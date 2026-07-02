use crate::notes::{self, Note};
use regex::Regex;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::Path;

const MAX_CORE: usize = 8;
const MAX_PERIPHERAL: usize = 8;
const MIN_CORE_SCORE: f32 = 0.08;
const MIN_PERIPHERAL_SCORE: f32 = 0.02;

#[derive(Debug, Clone, Serialize)]
pub struct GalaxyNode {
    pub id: String,
    pub title: String,
    pub score: f32,
    pub reasons: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct GalaxyNav {
    pub north: Option<String>,
    pub south: Option<String>,
    pub east: Option<String>,
    pub west: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GalaxyView {
    pub center_id: String,
    pub center_title: String,
    pub nodes: Vec<GalaxyNode>,
    pub peripheral: Vec<GalaxyNode>,
    pub nav: GalaxyNav,
    pub total: usize,
}

struct NoteIndex {
    note: Note,
    outlinks: HashSet<String>,
    tokens: HashSet<String>,
}

fn tokenize(text: &str) -> HashSet<String> {
    static STOP: &[&str] = &[
        "avec", "dans", "pour", "plus", "note", "notes", "cette", "comme", "être", "tout",
        "une", "des", "les", "est", "pas", "par", "sur", "that", "this", "from", "have",
        "the", "and", "are", "not", "you", "your", "via", "aux", "son", "ses",
    ];
    let re = Regex::new(r"[a-zA-ZÀ-ÿ0-9_]{4,}").unwrap();
    let mut set = HashSet::new();
    for m in re.find_iter(&text.to_lowercase()) {
        let w = m.as_str();
        if !STOP.contains(&w) {
            set.insert(w.to_string());
        }
    }
    set
}

fn jaccard(a: &HashSet<String>, b: &HashSet<String>) -> f32 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    let inter = a.intersection(b).count() as f32;
    let union = a.union(b).count() as f32;
    inter / union
}

fn load_index(vault: &Path) -> Result<Vec<NoteIndex>, String> {
    let mut index = Vec::new();
    for summary in notes::list_notes(vault)? {
        let note = notes::get_note(vault, &summary.id)?;
        let outlinks: HashSet<String> = note.neighbors.iter().cloned().collect();
        let corpus = format!("{} {}", note.title, note.body);
        let tokens = tokenize(&corpus);
        index.push(NoteIndex {
            note,
            outlinks,
            tokens,
        });
    }
    Ok(index)
}

fn build_backlinks(index: &[NoteIndex]) -> HashMap<String, HashSet<String>> {
    let mut back: HashMap<String, HashSet<String>> = HashMap::new();
    for entry in index {
        for target in &entry.outlinks {
            back.entry(target.clone())
                .or_default()
                .insert(entry.note.id.clone());
        }
    }
    back
}

pub fn get_galaxy(vault: &Path, center_id: &str) -> Result<GalaxyView, String> {
    let index = load_index(vault)?;
    let backlinks = build_backlinks(&index);

    let center = index
        .iter()
        .find(|e| e.note.id == center_id)
        .ok_or_else(|| format!("Note introuvable : {center_id}"))?;

    let center_out = &center.outlinks;
    let center_tokens = &center.tokens;
    let center_tags: HashSet<_> = center.note.tags.iter().cloned().collect();

    let mut scored: Vec<GalaxyNode> = Vec::new();
    let mut peripheral_scored: Vec<GalaxyNode> = Vec::new();

    for entry in &index {
        if entry.note.id == center_id {
            continue;
        }

        let mut score = 0.0_f32;
        let mut reasons = Vec::new();

        if center_out.contains(&entry.note.id) {
            score += 1.0;
            reasons.push("lien →".into());
        }

        if backlinks
            .get(center_id)
            .map(|s| s.contains(&entry.note.id))
            .unwrap_or(false)
        {
            score += 0.72;
            reasons.push("← backlink".into());
        }

        let shared: Vec<_> = center_tags
            .intersection(&entry.note.tags.iter().cloned().collect())
            .cloned()
            .collect();
        if !shared.is_empty() {
            score += (shared.len() as f32 * 0.14).min(0.42);
            reasons.push(format!("tags {}", shared.join(" ")));
        }

        let words = jaccard(center_tokens, &entry.tokens);
        if words > 0.04 {
            score += words * 0.38;
            if words > 0.12 {
                reasons.push("thème commun".into());
            }
        }

        let node = GalaxyNode {
            id: entry.note.id.clone(),
            title: entry.note.title.clone(),
            score: score.min(1.0),
            reasons,
        };

        if score >= MIN_CORE_SCORE {
            scored.push(node);
        } else if score >= MIN_PERIPHERAL_SCORE {
            peripheral_scored.push(node);
        }
    }

    scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    peripheral_scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

    let total = scored.len() + peripheral_scored.len();
    let peripheral: Vec<GalaxyNode> = scored
        .iter()
        .skip(MAX_CORE)
        .cloned()
        .chain(peripheral_scored.into_iter())
        .take(MAX_PERIPHERAL)
        .collect();
    scored.truncate(MAX_CORE);

    let mut nav = GalaxyNav::default();
    if scored.len() > 0 {
        nav.north = Some(scored[0].id.clone());
    }
    if scored.len() > 1 {
        nav.east = Some(scored[1].id.clone());
    }
    if scored.len() > 2 {
        nav.south = Some(scored[2].id.clone());
    }
    if scored.len() > 3 {
        nav.west = Some(scored[3].id.clone());
    }

    Ok(GalaxyView {
        center_id: center.note.id.clone(),
        center_title: center.note.title.clone(),
        nodes: scored,
        peripheral,
        nav,
        total,
    })
}
