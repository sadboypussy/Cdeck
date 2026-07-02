# VISUAL-CORE-77

**Surface de pensée musicale** pour second écran — notes Zettelkasten locales, navigation par proximité intelligente, ambiance calée sur le **son système** (WASAPI).

Nom affiché : **VISUAL-CORE-77** · codename / repo : `Cdeck` / `cyber-deck`

Stack : **Tauri 2** (Rust + vanilla JS, sans bundler) · Windows 10/11 · portrait compagnon (redimensionnable).

> **Handoff session :** [`HANDOFF — Juil 2025.md`](HANDOFF%20—%20Juil%202025.md)

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

L'audio-réactif capte le **son du PC** (WASAPI) — lance ta musique dans Spotify, navigateur, etc. L'app ne lit pas la musique et n'affiche pas de titre.

### Launcher (Windows)

| Fichier | Action |
|---------|--------|
| `Cyber-Deck.bat` | Menu interactif |
| `Dev Cyber-Deck.bat` | Lance directement le mode dev |
| `launch.ps1 dev` | Idem en ligne de commande |

## Structure

```
src/
  app.js            UI principale (notes, postures, HUD, proximité)
  proximity.js      Rails, ribbon, grille focus 3×3
  markdown.js       Rendu MD lecture + backdrop édition
  tauri-shim.js     Bridge invoke/listen (pas de bundler)
  audio-reactive.js Bandes audio + lissage rAF
  styles/           tokens, glass, components, effects, pivot-v3, typography
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
| Notes | Autocomplete `[[` · Lire `Ctrl+E` (prose Lora, MD enrichi) · autosave 800 ms |
| Audio | WASAPI loopback · waveform · statut Réactif/Silence · **pas lecteur** |
| Vault | `vault-writer/` · migration depuis `vault/` |

### Moteur proximité

Rust `get_galaxy` score les voisins avec raisons explicites :

- `lien →` · `← backlink` · tags partagés · thème commun (Jaccard)

### Créer / naviguer

1. `Ctrl+P` → identifiant (`Ma_Idee`) → **Créer**
2. Écrire avec `[[Autre_Note]]` et `#tags`
3. **Navigate** (Tab ou idle 4 s) : rails latéraux · ribbon · `Ctrl+Shift+G` pour la grille

Vault seed : ouvrir `PROTOCOLE_REINITIALISATION`.

## Audio

- **WASAPI loopback** : mix système → effets musicaux sur texte (~3 %)
- Bande : statut **Réactif** / **Silence** + waveform — pas nom de piste
- Debug : `Ctrl+Shift+D`

## Documentation

| Fichier | Contenu |
|---------|---------|
| **`HANDOFF — Juil 2025.md`** | **Reprise autre PC — commits, décisions, état** |
| **`PIVOT V3.1 — Framing acté.md`** | Vérité produit |
| `PIVOT V3 — Notes First.md` | Contexte pivot |
| `REPRISE.md` | Technique court |

## Développement

- API Tauri : `src/tauri-shim.js` (obligatoire sans bundler)
- Pas d'import `@tauri-apps/api/...` direct dans le frontend
