# VISUAL-CORE-77

Compagnon de concentration pour second écran — notes Zettelkasten + ambiance musicale + réactivité audio WASAPI.

Nom affiché : **VISUAL-CORE-77** · codename projet / repo : `cyber-deck`

Stack : **Tauri 2** (Rust + vanilla JS, sans bundler) · Windows 10/11 · fenêtre portrait **405×720** (9:16).

## Démarrage

**Important :** lancer via Tauri, pas en ouvrant `index.html` dans le navigateur.

**Double-clic** : `Cyber-Deck.bat` (menu) ou `Dev Cyber-Deck.bat` (dev direct)

```bash
npm install
npm run dev          # ou npm start
npm run launch       # menu PowerShell
npm run test:audio   # spike WASAPI seul
```

> YouTube se charge **au clic sur ▶** (lazy). L'audio-réactif fonctionne via **WASAPI loopback** dès que de la musique joue sur le système — même sans vidéo embed.

### Launcher (Windows)

| Fichier | Action |
|---------|--------|
| `Cyber-Deck.bat` | Menu interactif |
| `Dev Cyber-Deck.bat` | Lance directement le mode dev |
| `launch.ps1 dev` | Idem en ligne de commande |

Options menu : **DEV** · **RELEASE** · **DEBUG EXE** · **AUDIO SPIKE** · **BUILD**

## Structure

```
src/
  app.js            UI principale (notes, liens, player, HUD)
  tauri-shim.js     Bridge invoke/listen via window.__TAURI__ (pas de bundler)
  audio-reactive.js Bandes audio + simulation fallback
  ambient.js        Particules zone audio
  crt.js            Overlay CRT léger sur la zone vidéo
  vendor/           Three.js local (legacy, radar WebGL retiré de l'UI)
  styles/           tokens, glass, components, effects
src-tauri/          Backend Tauri (vault notes, capture WASAPI)
audio-spike/        Branche B — spike CLI WASAPI loopback + FFT
notes/              Référence vault (notes prod dans AppData)
```

## UI — livré

- Fenêtre **405×720** plein écran portrait, UI edge-to-edge (Sora + Inter)
- Zone vidéo **16:9** · placeholder ambiance · YouTube optionnel (▶)
- Éditeur Markdown + autosave + surlignage `[[wikilinks]]`
- Toggle **Notes / Liens** (graphe de proximité en cartes lisibles, max 4)
- Palette **Ctrl+P** : recherche + création de note
- Waveform · particules · CRT subtil · debug audio `Ctrl+Shift+D`

### Onglet Liens (ex-radar)

Affiche les notes **connectées** à celle que tu édites via les liens `[[NomNote]]` dans le texte.

1. Ouvre une note seed, ex. `PROTOCOLE_REINITIALISATION`
2. Onglet **Liens**
3. Clique une carte voisine → la note s'ouvre

Sans `[[wikilinks]]` vers des notes existantes, l'état vide est normal — ajoute par ex. `[[WASAPI]]` dans le texte.

### Créer une note

1. `Ctrl+P` → identifiant (`Ma_Idee`)
2. **Créer « … »** → la note s'ouvre
3. Ajoute `[[Autre_Note]]` → onglet **Liens** se met à jour à la sauvegarde

## Audio

- **WASAPI loopback** (Rust) : capture le mix système → FFT → 6 bandes → `emit("audio-bands")`
- Frontend : simulation toujours active ; remplacée par Rust quand l'énergie est détectée
- Reconnexion auto · surveillance changement périphérique (poll 1.5 s)
- Lissage silence · filtre pollution · amplitude visuelle ~3 % (PDD)

### Console « Tracking Prevention »

Messages Edge/WebView2 quand YouTube tente des cookies — **sans impact** sur WASAPI. Réduits en chargeant YouTube uniquement au clic ▶.

### Erreur YouTube 150

Le propriétaire de la vidéo interdit l'embed. Le placeholder reste affiché ; **l'audio système suffit** pour la réactivité visuelle.

## Développement

- API Tauri : `src/tauri-shim.js` (obligatoire sans Vite/Webpack)
- Pas d'import `@tauri-apps/api/...` direct dans le frontend servi depuis `src/`

## Prochaine étape

1. Affinage seuils audio en usage réel
2. Source YouTube configurable (URL / playlist embeddable)
3. Raccourci global Ctrl+P hors focus (optionnel)

Voir `PDD Cyber-Deck V2.md` pour la vision produit (codename Cyber-Deck).
