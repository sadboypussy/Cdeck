# REPRISE — VISUAL-CORE-77 (Cyber-Deck)

> Doc de handoff — session juin 2025. Branche : `master` · repo `sadboypussy/Cdeck`

## Démarrage sur un autre PC

```bash
git clone https://github.com/sadboypussy/Cdeck.git
cd Cdeck
npm install
npm run dev          # ou double-clic Dev Cyber-Deck.bat (Windows)
```

Prérequis : **Node.js**, **Rust**, **Visual Studio Build Tools** (Windows), WebView2.

---

## État actuel du produit

### Ce qui marche

| Zone | Détail |
|------|--------|
| **Notes** | Éditeur Markdown, wikilinks cliquables, tags, autosave 800 ms |
| **Enregistrer** | Bouton pill + `Ctrl+S`, état Modifié / Enregistré |
| **Proximité** | Grille **3×3** : centre = note active, 8 cases = voisins scorés |
| **Périphériques** | Colonnes gauche/droite translucides (overflow + écho si peu de notes) |
| **Moteur liens** | `get_galaxy` Rust : wikilink, backlink, tags, Jaccard mots |
| **Audio** | WASAPI loopback → FFT → 6 bandes → `audio-bands` @ 60 Hz |
| **UI audio** | rAF 60 fps, attaque rapide / release doux, waveform sans lag CSS |
| **Fenêtre** | Maximize sur **moniteur #2** au démarrage (sinon #1) |
| **Palette** | `Ctrl+P` recherche + création note |
| **Debug audio** | `Ctrl+Shift+D` |

### Lancer correctement

**Ne pas** ouvrir `index.html` seul — il faut **Tauri** (`npm run dev`).

YouTube : lazy load au ▶. L’audio-réactif marche via **son système** (Spotify, navigateur…) même sans embed.

---

## Architecture fichiers clés

```
src/
  app.js              UI, tabs, save, player, HUD, proximité
  proximity.js        Grille 3×3 + chips périphériques
  audio-reactive.js   rAF, lissage asymétrique, bridge WASAPI
  tauri-shim.js       invoke/listen sans bundler npm
  ambient.js / crt.js Effets zone vidéo
src-tauri/src/
  galaxy.rs           Scoring proximité (core 8 + peripheral 8)
  window.rs           Placement 2ᵉ écran + maximize
  audio/              WASAPI loopback + FFT + emit
  notes.rs            Vault AppData, seed 5 notes
```

### Commandes Tauri exposées

`list_notes` · `get_note` · `save_note` · `create_note` · `search_notes` · `get_vault_path` · **`get_galaxy`**

Vault prod : `%APPDATA%/com.cyberdeck.app/vault/`

---

## UX Proximité (dernière direction validée)

- **Abandon** : radar WebGL, galaxie canvas, onglet Liens cartes
- **Grille 3×3** : clic voisin → ouvre note dans onglet Notes
- **Flèches + Entrée** sur onglet Proximité
- **Suggestions latérales** : notes 9–16 du moteur, ou écho des voisins si vault sparse

Scoring (`galaxy.rs`) :

- `lien →` : 1.0 · `← backlink` : 0.72 · tags : jusqu’à 0.42 · thème Jaccard : ~0.38
- `MIN_CORE_SCORE` 0.08 · `MIN_PERIPHERAL_SCORE` 0.02

---

## Audio — calibrage actuel

**Rust** (`audio/mod.rs`) : emit 16 ms, `smooth_bands_asymmetric` attack 0.78 / release 0.32.

**JS** (`audio-reactive.js`) : `requestAnimationFrame`, pas de `setInterval`. Intensité défaut ~60 % (`Ctrl+Shift+D`).

Si trop nerveux : baisser `BAND_ATTACK` / `VISUAL_ATTACK` dans `audio-reactive.js`.  
Si trop mou : augmenter attack Rust ou INT debug.

---

## Fenêtre second écran

`src-tauri/src/window.rs` → moniteur index **1** (2ᵉ écran), puis `maximize()`.

Si mauvais écran : ajuster l’index ou filtrer par position (TODO).

`tauri.conf.json` : plus de min/max 405×720 — fenêtre redimensionnable, UI stretch 100 %.

---

## Bugs connus / bruit

| Symptôme | Cause | Action |
|----------|-------|--------|
| `Tracking Prevention blocked storage` | WebView2 + YouTube | Ignorer (cosmétique) |
| YouTube erreur 150 | Embed interdit | Fallback ambiance OK, WASAPI suffit |
| Peu de voisins en grille | Vault petit (5 notes seed) | Normal — ajouter notes + `[[liens]]` |
| ~~Panic `drain(8..)`~~ | **Corrigé** — `skip(8)` safe | — |

---

## Non commité volontairement

- `visual-core-v2 claude remanié.html` — mockup référence UI V2
- `src/vendor/three/` — legacy radar WebGL (retiré UI, gros volume)

---

## PDD vs implémentation

Écarts assumés par Ben :

- Grille proximité **8 voisins** (PDD disait max 4)
- Pas de radar / galaxie
- Fenêtre **maximize 2ᵉ écran** (plus fixe 405×720 strict)

Référence produit : `PDD Cyber-Deck V2.md` · règle Cursor `.cursor/rules/cyber-deck-pdd-core.mdc`

---

## Pistes prochaine session

1. **Moniteur** : préférence utilisateur ou détection écran « à droite » plutôt qu’index fixe
2. **Proximité** : plus de notes seed / liens pour tester périphériques réels (overflow 9–16)
3. **Audio** : affiner INT par défaut après test musique réelle
4. **README** : encore partiellement « Liens / 405×720 » — à aligner
5. **Commit suivant** : décider si vendored Three.js reste ou suppression `radar-gl.js`

---

## Commandes utiles

```bash
npm run dev              # hot reload
npm run test:audio       # spike WASAPI CLI
cargo check -p cyber-deck --manifest-path src-tauri/Cargo.toml
```

Raccourcis in-app : `Ctrl+P` · `Ctrl+S` · `Escape` (HUD) · `Ctrl+Shift+D` (VU)
