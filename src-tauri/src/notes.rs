use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::Manager;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteSummary {
    pub id: String,
    pub title: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub neighbors: Vec<String>,
}

pub fn vault_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    path.push("vault-writer");
    Ok(path)
}

fn migrate_legacy_vault(app_data: &Path, writer: &Path) -> Result<(), String> {
    let legacy = app_data.join("vault");
    if !legacy.is_dir() {
        return Ok(());
    }

    let writer_has_notes = writer.is_dir()
        && fs::read_dir(writer)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .any(|e| {
                e.path()
                    .extension()
                    .and_then(|s| s.to_str())
                    == Some("md")
            });

    if writer_has_notes {
        return Ok(());
    }

    if !writer.exists() {
        fs::create_dir_all(writer).map_err(|e| e.to_string())?;
    }

    for entry in fs::read_dir(&legacy).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            if let Some(name) = path.file_name() {
                fs::copy(&path, writer.join(name)).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

pub fn ensure_vault(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let vault = vault_path(app)?;
    migrate_legacy_vault(&app_data, &vault)?;
    if !vault.exists() {
        fs::create_dir_all(&vault).map_err(|e| e.to_string())?;
        seed_vault(&vault)?;
    }
    Ok(vault)
}

fn seed_vault(vault: &Path) -> Result<(), String> {
    let seeds: &[(&str, &str)] = &[
        (
            "PROTOCOLE_REINITIALISATION.md",
            r##"---
tags:
  - "#system"
  - "#core"
---

# PROTOCOLE REINITIALISATION

Séquence de boot du Cyber-Deck. La capture audio passe par [[WASAPI]] en loopback système.

## Pipeline

Le flux spectral est décrit dans [[Annexe_A_Pipeline]]. Le shell Tauri ([[Tauri_Shell]]) héberge l'interface 9:16.

## Ambiance

Playlist par défaut : [[Syrex_Nightcore]]. La musique imprègne l'espace — pas un visualiseur décoratif.
"##,
        ),
        (
            "WASAPI.md",
            r##"---
tags:
  - "#audio"
  - "#rust"
---

# WASAPI Loopback

Capture du mix audio système Windows via l'API native Microsoft.

## Pourquoi wasapi et pas cpal

V1 strictement Windows-only : loopback natif sans contournement d'abstraction cross-platform.

## Liens

Retour [[PROTOCOLE_REINITIALISATION]] · Pipeline [[Annexe_A_Pipeline]]
"##,
        ),
        (
            "Annexe_A_Pipeline.md",
            r##"---
tags:
  - "#audio"
  - "#fft"
---

# Annexe A — Pipeline

```
Loopback → Buffer → FFT → Bandes agrégées → emit Tauri → CSS
```

Le spectre FFT brut ne traverse **jamais** l'IPC. Agrégation 4–8 floats côté Rust uniquement.

Voir [[WASAPI]] pour la capture · [[Tauri_Shell]] pour l'émission.
"##,
        ),
        (
            "Tauri_Shell.md",
            r##"---
tags:
  - "#tauri"
  - "#ui"
---

# Tauri Shell

Fenêtre portrait 380×780. Zone supérieure ≈ 1/3 (audio), inférieure ≈ 2/3 (notes / radar).

## Navigation

Liens `[[wikilinks]]` cliquables · Radar de proximité · Palette `Ctrl+P`.

Contexte : [[PROTOCOLE_REINITIALISATION]]
"##,
        ),
        (
            "Syrex_Nightcore.md",
            r##"---
tags:
  - "#music"
  - "#focus"
---

# Syrex Nightcore

Source de rythme par défaut. La réactivité visuelle est **musicale**, pas Winamp — respiration ~3 %, pulses sur transitoires.

Référencé depuis [[PROTOCOLE_REINITIALISATION]].
"##,
        ),
    ];

    for (name, content) in seeds {
        let path = vault.join(name);
        fs::write(path, content).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn note_id_from_path(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string()
}

fn parse_frontmatter(raw: &str) -> (Vec<String>, String) {
    let mut tags = Vec::new();
    let body = if raw.starts_with("---") {
        if let Some(end) = raw[3..].find("\n---") {
            let fm = &raw[3..3 + end];
            let content = raw[3 + end + 4..].trim_start().to_string();
            for line in fm.lines() {
                let line = line.trim();
                if line.starts_with("- ") {
                    tags.push(line[2..].trim().trim_matches('"').to_string());
                } else if line.starts_with("tags:") {
                    continue;
                } else if !line.is_empty() && !line.contains(':') {
                    tags.push(line.to_string());
                }
            }
            content
        } else {
            raw.to_string()
        }
    } else {
        raw.to_string()
    };
    (tags, body)
}

fn extract_title(body: &str) -> String {
    for line in body.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("# ") {
            return rest.trim().to_string();
        }
        if let Some(rest) = trimmed.strip_prefix("## ") {
            return rest.trim().to_string();
        }
    }
    "Sans titre".to_string()
}

pub fn extract_wikilinks(text: &str) -> Vec<String> {
    let re = Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
    let mut seen = HashSet::new();
    let mut links = Vec::new();
    for cap in re.captures_iter(text) {
        let id = cap[1].trim().replace(' ', "_");
        if seen.insert(id.clone()) {
            links.push(id);
        }
    }
    links
}

fn read_note_file(path: &Path) -> Result<Note, String> {
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let id = note_id_from_path(path);
    let (mut tags, body) = parse_frontmatter(&raw);
    if tags.is_empty() {
        tags = extract_inline_tags(&body);
    }
    let title = extract_title(&body);
    let neighbors = extract_wikilinks(&raw);
    Ok(Note {
        id,
        title,
        body,
        tags,
        neighbors,
    })
}

fn extract_inline_tags(body: &str) -> Vec<String> {
    let re = Regex::new(r"(?m)(^|\s)(#[\w\-]+)").unwrap();
    let mut tags = Vec::new();
    let mut seen = HashSet::new();
    for cap in re.captures_iter(body) {
        let tag = cap[2].to_string();
        if seen.insert(tag.clone()) {
            tags.push(tag);
        }
    }
    tags
}

pub fn list_notes(vault: &Path) -> Result<Vec<NoteSummary>, String> {
    let mut notes = Vec::new();
    for entry in WalkDir::new(vault)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }
        let note = read_note_file(path)?;
        notes.push(NoteSummary {
            id: note.id,
            title: note.title,
            tags: note.tags,
        });
    }
    notes.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(notes)
}

pub fn get_note(vault: &Path, id: &str) -> Result<Note, String> {
    let path = vault.join(format!("{id}.md"));
    if !path.exists() {
        return Err(format!("Note introuvable : {id}"));
    }
    let mut note = read_note_file(&path)?;
    note.neighbors = resolve_neighbors(vault, &note.neighbors);
    Ok(note)
}

fn resolve_neighbors(vault: &Path, links: &[String]) -> Vec<String> {
    links
        .iter()
        .filter(|id| vault.join(format!("{id}.md")).exists())
        .cloned()
        .collect()
}

fn sanitize_note_id(raw: &str) -> String {
    raw.trim()
        .replace(' ', "_")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .collect()
}

pub fn create_note(vault: &Path, id: &str, body: Option<&str>) -> Result<Note, String> {
    let id = sanitize_note_id(id);
    if id.is_empty() {
        return Err("Identifiant de note invalide".to_string());
    }
    let path = vault.join(format!("{id}.md"));
    if path.exists() {
        return Err(format!("La note existe déjà : {id}"));
    }

    let title = id.replace('_', " ");
    let default_body = format!(
        "# {title}\n\nNouvelle note VISUAL-CORE-77. Lie des notes avec [[wikilinks]].\n"
    );
    let note_body = body.unwrap_or(&default_body);
    let tags = extract_inline_tags(note_body);

    save_note(vault, &id, note_body, &tags)
}

pub fn save_note(vault: &Path, id: &str, body: &str, tags: &[String]) -> Result<Note, String> {
    let path = vault.join(format!("{id}.md"));
    let mut frontmatter = String::from("---\ntags:\n");
    for tag in tags {
        frontmatter.push_str(&format!("  - \"{tag}\"\n"));
    }
    frontmatter.push_str("---\n\n");
    let content = format!("{frontmatter}{body}");
    fs::write(&path, &content).map_err(|e| e.to_string())?;
    get_note(vault, id)
}

pub fn search_notes(vault: &Path, query: &str) -> Result<Vec<NoteSummary>, String> {
    let q = query.to_lowercase();
    Ok(list_notes(vault)?
        .into_iter()
        .filter(|n| {
            n.id.to_lowercase().contains(&q) || n.title.to_lowercase().contains(&q)
        })
        .collect())
}

#[allow(dead_code)]
pub fn build_neighbor_map(vault: &Path) -> Result<HashMap<String, Vec<String>>, String> {
    let mut map = HashMap::new();
    for summary in list_notes(vault)? {
        let note = get_note(vault, &summary.id)?;
        map.insert(note.id, note.neighbors);
    }
    Ok(map)
}
