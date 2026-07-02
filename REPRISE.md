# REPRISE — VISUAL-CORE-77 (Cyber-Deck)

> Doc de handoff — mis à jour juil. 2025 · Branche : `master` · repo `sadboypussy/Cdeck`

## Direction produit actuelle

**Lire en priorité :** [`PIVOT V3.1 — Framing acté.md`](PIVOT%20V3.1%20—%20Framing%20acté.md) · contexte : [`PIVOT V3 — Notes First.md`](PIVOT%20V3%20—%20Notes%20First.md)

Framing V3.1 : **VISUAL-CORE-77** (Writer Space) ship first · vault séparé · esthétique **clean** · bande musique titre+waveform (pas thumbnail) · Draft/Navigate proximité · fullscreen primary plus tard · **SYNTAX-CORE** coder en V4.

Chaîne de valeur :

```
Musique → Ambiance → Concentration → Pensée → Navigation
```

---

## Démarrage sur un autre PC

```bash
git clone https://github.com/sadboypussy/Cdeck.git
cd Cdeck
npm install
npm run dev          # ou double-clic Dev Cyber-Deck.bat (Windows)
```

Prérequis : **Node.js**, **Rust**, **Visual Studio Build Tools** (Windows), WebView2.

---

## État actuel du code (post-refonte V3 — juil. 2025)

> UI alignée sur **PIVOT V3.1** : workzone hero · bande musique bas · Draft/Navigate/Focus · read mode · autocomplete `[[` · vault `vault-writer/`

### Ce qui marche

| Zone | Détail |
|------|--------|
| **Notes** | Éditeur Markdown, wikilinks cliquables, tags, autosave 800 ms |
| **Enregistrer** | Bouton pill + `Ctrl+S`, état Modifié / Enregistré |
| **Proximité** | Rails + ribbon (Navigate) · focus `Ctrl+Shift+G` · Draft par défaut |
| **Lecture** | Bouton Lire / `Ctrl+E` · rendu MD + wikilinks cliquables |
| **Liens** | Autocomplete `[[` · chips raison sur rails |
| **Moteur liens** | `get_galaxy` Rust : wikilink, backlink, tags, Jaccard mots |
| **Audio** | WASAPI loopback → FFT → 6 bandes → `audio-bands` @ 60 Hz |
| **UI audio** | Bande basse : titre défilant + horloge + waveform · source Système/YouTube |
| **Fenêtre** | Maximize sur **moniteur #2** au démarrage (sinon #1) |
| **Palette** | `Ctrl+P` recherche + création note |
| **Debug audio** | `Ctrl+Shift+D` |

### Lancer correctement

**Ne pas** ouvrir `index.html` seul — il faut **Tauri** (`npm run dev`).

L'audio-réactif marche via **son système** (Spotify, navigateur…) — **sans embed**. YouTube lazy au ▶ est un confort optionnel, pas le cœur produit.

---

## Architecture fichiers clés

```
src/
  app.js              UI, tabs, save, player, HUD, proximité
  proximity.js        Grille 3×3 + chips périphériques (→ focus mode V3)
  audio-reactive.js   rAF, lissage asymétrique, bridge WASAPI
  tauri-shim.js       invoke/listen sans bundler npm
  ambient.js / crt.js Effets zone vidéo (→ atmosphere globale V3)
src-tauri/src/
  galaxy.rs           Scoring proximité (core 8 + peripheral 8)
  window.rs           Placement 2ᵉ écran + maximize
  audio/              WASAPI loopback + FFT + emit
  notes.rs            Vault AppData, seed 5 notes
```

### Commandes Tauri exposées

`list_notes` · `get_note` · `save_note` · `create_note` · `search_notes` · `get_vault_path` · **`get_galaxy`**

Vault prod : `%APPDATA%/com.cyberdeck.app/vault-writer/` (migration auto depuis `vault/`)

---

## Moteur proximité (`galaxy.rs`)

Scoring :

- `lien →` : 1.0 · `← backlink` : 0.72 · tags : jusqu'à 0.42 · thème Jaccard : ~0.38
- `MIN_CORE_SCORE` 0.08 · `MIN_PERIPHERAL_SCORE` 0.02

**V3 :** exposer les `reasons` en rails/ribbon permanent, pas seulement dans la grille.

---

## Audio — calibrage actuel

**Rust** (`audio/mod.rs`) : emit 16 ms, `smooth_bands_asymmetric` attack 0.78 / release 0.32.

**JS** (`audio-reactive.js`) : `requestAnimationFrame`. Intensité défaut ~60 % (`Ctrl+Shift+D`).

**V3 :** prioriser effets sur **texte** (titres, wikilinks, transitions note) vs chrome vidéo.

---

## Fenêtre second écran

`src-tauri/src/window.rs` → moniteur index **1** (2ᵉ écran), puis `maximize()`.

`tauri.conf.json` : fenêtre redimensionnable, UI stretch 100 %.

---

## Bugs connus / bruit

| Symptôme | Cause | Action |
|----------|-------|--------|
| `Tracking Prevention blocked storage` | WebView2 + YouTube | Ignorer (cosmétique) |
| YouTube erreur 150 | Embed interdit | WASAPI suffit ; embed = addon |
| Peu de voisins en grille | Vault petit (5 notes seed) | Ajouter notes + `[[liens]]` |
| UI « lecteur first » | Layout pré-pivot | Refonte Phase A (pivot doc) |

---

## Non commité volontairement

- `visual-core-v2 claude remanié.html` — mockup référence UI V2
- `src/vendor/three/` — legacy radar WebGL (retiré UI)

---

## Traçabilité docs

| Doc | Version | Rôle |
|-----|---------|------|
| `PDD Cyber-Deck V2.md` | V1.1 (juin 2025) | Superdocument historique · technique · principes musicaux |
| **`PIVOT V3.1 — Framing acté.md`** | **V3.1 (juil. 2025)** | **Framing verrouillé — Spaces, UI, proximité** |
| **`PIVOT V3 — Notes First.md`** | V3.0 (juil. 2025) | Pivot direction · roadmap |
| `REPRISE.md` | ce fichier | Handoff dev |
| `.cursor/rules/cyber-deck-pdd-core.mdc` | V3 | Règle agent Cursor |

---

## Prochaine session

1. Test usage réel (2 h écriture · musique Spotify)
2. Calibrage INT audio · polish typo
3. Moniteur : préférence écran
4. V3.2 : fullscreen écran principal

---

## Commandes utiles

```bash
npm run dev              # hot reload
npm run test:audio       # spike WASAPI CLI
cargo check -p cyber-deck --manifest-path src-tauri/Cargo.toml
```

Raccourcis in-app : `Ctrl+P` · `Ctrl+S` · `Escape` (HUD) · `Ctrl+Shift+D` (VU)  
**V3 prévu :** `Ctrl+Shift+G` (focus proximité)
