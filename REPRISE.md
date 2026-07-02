# REPRISE — VISUAL-CORE-77 (Cyber-Deck)

> Handoff technique · juil. 2025 · `master` · https://github.com/sadboypussy/Cdeck

**Reprise complète session :** [`HANDOFF — Juil 2025.md`](HANDOFF%20—%20Juil%202025.md) ← **lire en premier sur autre PC**

**Vérité produit :** [`PIVOT V3.1 — Framing acté.md`](PIVOT%20V3.1%20—%20Framing%20acté.md)

---

## Démarrage autre PC

```bash
git clone https://github.com/sadboypussy/Cdeck.git
cd Cdeck
git pull origin master
npm install
npm run dev
```

**Double-clic :** `Dev Cyber-Deck.bat` (ajoute `.cargo\bin` au PATH si besoin)

### Prérequis Windows (une fois par machine)

| Outil | Installation |
|-------|----------------|
| **Node.js** | [nodejs.org](https://nodejs.org) ou `winget install OpenJS.NodeJS.LTS` |
| **Rust** | `winget install Rustlang.Rustup` puis **fermer/réouvrir le terminal** (ou redémarrer le PC) |
| **VS Build Tools** | [Build Tools 2022](https://aka.ms/vs17/release/vs_buildtools.exe) → charge *Desktop development with C++* |
| **WebView2** | Déjà présent sur Win10/11 dans la plupart des cas |

Si `cargo introuvable` : le `.bat` tente de corriger ; sinon ajouter `%USERPROFILE%\.cargo\bin` au PATH utilisateur.

**Auth GitHub :** compte `sadboypussy` (403 → Gestionnaire d'identification Windows → supprimer `git:https://github.com`).

Musique : lance **Spotify / navigateur** sur le PC — l'app capte le son (WASAPI). Pas de lecteur dans l'app.

---

## Identité (une phrase)

Snappy, musical, connected — surface d'écriture audio-réactive, pas Notepad, pas un player.

---

## État code (juil. 2025 — post-V3)

### Livré

| Zone | Détail |
|------|--------|
| **Layout** | Workzone hero · bande basse · UI clean |
| **Notes** | MD · wikilinks · tags · autosave 800 ms · flush si onglet caché |
| **Proximité** | Draft (défaut) · Navigate (idle 4s / Tab) · Focus (`Ctrl+Shift+G`) |
| **Liens** | Autocomplete `[[` · rails + ribbon · chips raison |
| **Lecture** | `Ctrl+E` / bouton Lire |
| **Audio** | WASAPI · waveform · **En veille / À l'écoute** · diégétique silence/actif |
| **Vault** | `vault-writer/` · migration `vault/` · 6 seeds · backfill manquants |
| **Palette** | `Ctrl+P` |

### Retiré (décision actée)

- Zone vidéo 16:9 · YouTube · titres de piste · menu source · onglets Notes/Proximité

---

## Architecture

```
src/
  app.js              UI · postures · save · HUD · read mode
  proximity.js        Rails · ribbon · grille 3×3 focus
  audio-reactive.js   rAF · WASAPI · --energy / --bass-glow
  styles/pivot-v3.css Layout V3 · diégétique audio-silent / audio-active
  space.js            Hook Writer (SYNTAX-CORE = V4+)
src-tauri/src/
  notes.rs            vault-writer · seeds · ensure_seed_notes
  galaxy.rs           get_galaxy scoring
  audio/              WASAPI loopback
```

Vault : `%APPDATA%/com.cyberdeck.app/vault-writer/`

---

## Raccourcis

`Ctrl+P` · `Ctrl+S` · `Ctrl+E` · `Tab` (Navigate) · `Ctrl+Shift+G` (Focus) · `Ctrl+Shift+D` (debug) · `Escape`

---

## Commits session (référence)

`8f36e0c` docs pivot · `fc26b8a` framing V3.1 · `e9073b4` impl UI V3 · `c813f37` audio-réactif pur · `5db1390` diégétique + seeds

---

## Prochaine étape

1. **Test réel** 2 h (toi) — valider le « whoah »
2. Polish audio / typo / transitions (agent)
3. V3.2 fullscreen primary (plus tard)

```bash
npm run dev
npm run test:audio
cargo check -p cyber-deck --manifest-path src-tauri/Cargo.toml
```
