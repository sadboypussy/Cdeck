# Cyber-Deck

Compagnon de concentration pour second écran — notes Zettelkasten + lecteur YouTube + réactivité audio musicale.

Stack : **Tauri 2** (Rust + vanilla JS) · Windows 10/11 · portrait 9:16.

## Démarrage

```bash
npm install
npm run dev
```

## Structure

```
src/              Frontend (UI Glitch-Decoder, éditeur, radar, HUD Ctrl+P)
src-tauri/        Backend Tauri (persistance notes vault)
audio-spike/      Branche B — spike CLI WASAPI loopback + FFT (indépendant)
notes/            Référence vault (les notes prod sont dans AppData)
```

## Branche A (UI) — livré

- Fenêtre portrait 380×780
- Lecteur YouTube intégré (playlist nightcore)
- Éditeur Markdown + autosave
- Toggle Notes / Radar (graphe proximité, max 4 voisins)
- Liens `[[wikilinks]]` cliquables + pivot radar
- Palette `Ctrl+P` · tags · barre statut

## Fusion A+B — audio intégré

- Module `src-tauri/src/audio/` : WASAPI loopback → FFT → 6 bandes → `emit("audio-bands")`
- Frontend écoute les bandes Rust ; fallback simulation si hors Tauri
- Reconnexion auto si la capture loopback se termine
- Surveillance changement périphérique sortie (A.5, poll 1.5 s)
- Lissage silence / transitions note modulées par énergie

## Branche B (audio) — spike CLI (référence)

```bash
cd audio-spike
cargo run --release
```

Capture loopback WASAPI → FFT → 6 bandes agrégées → vumètre terminal.

## Prochaine étape

1. Affinage seuils en usage réel (retours terrain)
2. Création note via Ctrl+P (V2 PDD)
3. Raccourci global Ctrl+P hors focus (optionnel)

Voir `PDD Cyber-Deck V2.md` pour le design complet.
