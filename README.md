# VISUAL-CORE-77

**Surface de pensée musicale** pour second écran — notes Zettelkasten locales, navigation par proximité intelligente, ambiance calée sur le **son système** (WASAPI).

Nom affiché : **VISUAL-CORE-77** · codename / repo : `Cdeck` / `cyber-deck`

Stack : **Tauri 2** (Rust + vanilla JS, sans bundler) · Windows 10/11 · portrait compagnon (redimensionnable).

> **Framing acté (V3.1) :** [`PIVOT V3.1 — Framing acté.md`](PIVOT%20V3.1%20—%20Framing%20acté.md)  
> **VISUAL-CORE-77** = Writer Space (ship first) · **SYNTAX-CORE** = Coder (V4+) · vaults séparés · UI clean · musique = sang de l'app.

## Pitch

```
Musique → Ambiance → Concentration → Pensée → Navigation
```

Pas un lecteur avec des notes. Une **pièce** où le texte respire avec la musique — et où le vault **se trie tout seul** (liens, backlinks, tags, thèmes).

## Démarrage

**Important :** lancer via Tauri, pas en ouvrant `index.html` dans le navigateur.

**Double-clic** : `Cyber-Deck.bat` (menu) ou `Dev Cyber-Deck.bat` (dev direct)

```bash
npm install
npm run dev          # ou npm start
npm run launch       # menu PowerShell
npm run test:audio   # spike WASAPI seul
```

> L'audio-réactif fonctionne via **WASAPI loopback** dès qu'une musique joue sur le système — Spotify, navigateur, etc. **Sans embed obligatoire.**

### Launcher (Windows)

| Fichier | Action |
|---------|--------|
| `Cyber-Deck.bat` | Menu interactif |
| `Dev Cyber-Deck.bat` | Lance directement le mode dev |
| `launch.ps1 dev` | Idem en ligne de commande |

## Structure

```
src/
  app.js            UI principale (notes, player, HUD, proximité)
  proximity.js      Grille 3×3 + périphériques (→ focus mode V3)
  tauri-shim.js     Bridge invoke/listen (pas de bundler)
  audio-reactive.js Bandes audio + lissage rAF
  ambient.js        Particules ambiance
  crt.js            Overlay CRT (zone vidéo — à relocaliser V3)
  styles/           tokens, glass, components, effects
src-tauri/          Vault notes, get_galaxy, capture WASAPI
audio-spike/        Spike CLI WASAPI + FFT
notes/              Référence vault (prod dans AppData)
```

## État actuel (code)

| Livré V3 | Détail |
|----------|--------|
| Layout notes-first | Workzone hero · bande musique bas · UI clean |
| Draft / Navigate / Focus | Idle 4 s · Tab · `Ctrl+Shift+G` · Échap |
| Proximité tissée | Rails + ribbon + chips raison · grille focus |
| Notes | Autocomplete `[[` · Lire `Ctrl+E` · autosave 800 ms + flush visibility |
| Audio | WASAPI · waveform · titre défilant · source Système/YouTube |
| Vault | `vault-writer/` · migration depuis `vault/` |

### Moteur proximité

Rust `get_galaxy` score les voisins avec raisons explicites :

- `lien →` · `← backlink` · tags partagés · thème commun (Jaccard)

### Créer / naviguer

1. `Ctrl+P` → identifiant (`Ma_Idee`) → **Créer**
2. Écrire avec `[[Autre_Note]]` et `#tags`
3. Onglet **Proximité** (temporaire) ou bientôt rails latéraux

Vault seed : ouvrir `PROTOCOLE_REINITIALISATION`.

## Audio

- **WASAPI loopback** : mix système → FFT → 6 bandes → `emit("audio-bands")`
- Effets **musicaux** (~3 % amplitude) : titres, wikilinks, transitions note
- Debug : `Ctrl+Shift+D`

YouTube intégré = confort zero-setup, **pas requis**. Erreur embed 150 → ignorer, WASAPI suffit.

## Documentation

| Fichier | Contenu |
|---------|---------|
| **`PIVOT V3 — Notes First.md`** | Direction actuelle · roadmap refonte |
| `PDD Cyber-Deck V2.md` | Historique V1.1 · technique · principes musicaux |
| `REPRISE.md` | Handoff développeur · état session |

## Développement

- API Tauri : `src/tauri-shim.js` (obligatoire sans bundler)
- Pas d'import `@tauri-apps/api/...` direct dans le frontend
