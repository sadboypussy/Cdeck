# VISUAL-CORE-77

Compagnon de concentration pour second écran — notes Zettelkasten + lecteur YouTube + réactivité audio musicale.

Nom affiché : **VISUAL-CORE-77** · codename projet / repo : `cyber-deck`

Stack : **Tauri 2** (Rust + vanilla JS) · Windows 10/11 · portrait 9:16.

## Démarrage

**Double-clic** : `Cyber-Deck.bat` (menu) ou `Dev Cyber-Deck.bat` (dev direct)

```bash
npm install
npm run dev          # ou npm start
npm run launch       # menu PowerShell
npm run test:audio   # spike WASAPI seul
```

> Connexion internet requise au premier lancement (Three.js + post-processing via CDN).

### Launcher (Windows)

| Fichier | Action |
|---------|--------|
| `Cyber-Deck.bat` | Menu interactif |
| `Dev Cyber-Deck.bat` | Lance directement le mode dev |
| `launch.ps1 dev` | Idem en ligne de commande |

Options menu : **DEV** · **RELEASE** · **DEBUG EXE** · **AUDIO SPIKE** · **BUILD**

## Structure

```
src/              Frontend (glass UI, éditeur, radar WebGL, HUD Ctrl+P, CRT)
  radar-gl.js     Radar Three.js + bloom (UnrealBloomPass)
  crt.js          Overlay CRT sur zone vidéo
  ambient.js      Particules audio-réactives
  styles/         tokens, glass, components, effects
src-tauri/        Backend Tauri (vault notes, capture WASAPI)
audio-spike/      Branche B — spike CLI WASAPI loopback + FFT (indépendant)
notes/            Référence vault (notes prod dans AppData)
```

## UI — livré

- Fenêtre portrait 380×780, shell glass + brackets néon
- Lecteur YouTube intégré (playlist nightcore) + overlay **CRT** (scanlines, vignette, aberration)
- Éditeur Markdown + autosave + surlignage wikilinks
- Toggle **Notes / Radar** avec transition fade + glitch
- Radar **WebGL** : graphe proximité (max 4 voisins), sweep bloom audio-réactif, nœuds cliquables
- Liens `[[wikilinks]]` cliquables dans l'éditeur
- Palette **Ctrl+P** : recherche + **création de note** (`Ma_Note` → Créer)
- Tags · barre statut · debug audio `Ctrl+Shift+D`

### Tester le radar

1. Ouvrir une note seed avec liens, ex. `PROTOCOLE_REINITIALISATION`
2. Basculer sur l'onglet **RADAR**
3. Cliquer un nœud voisin pour naviguer

Sans `[[wikilinks]]` dans la note active, le radar affiche l'état vide (comportement normal).

### Créer une note

1. `Ctrl+P` → taper un identifiant (`Ma_Idee` ou `Ma Idee`)
2. Choisir **Créer « … »** → la note s'ouvre
3. Ajouter des liens `[[Autre_Note]]` → le radar se met à jour à la sauvegarde

## Audio intégré (fusion A+B)

- Module `src-tauri/src/audio/` : WASAPI loopback → FFT → 6 bandes → `emit("audio-bands")`
- Frontend écoute les bandes Rust ; fallback simulation si hors Tauri
- Reconnexion auto si la capture loopback se termine
- Surveillance changement périphérique sortie (poll 1.5 s)
- Lissage silence / transitions note modulées par énergie · filtre pollution

## Branche B (audio) — spike CLI (référence)

```bash
cd audio-spike
cargo run --release
```

Capture loopback WASAPI → FFT → 6 bandes agrégées → vumètre terminal.

## Prochaine étape

1. Affinage seuils audio en usage réel (retours terrain)
2. Raccourci global Ctrl+P hors focus (optionnel)

Voir `PDD Cyber-Deck V2.md` pour la vision produit complète (codename Cyber-Deck).
