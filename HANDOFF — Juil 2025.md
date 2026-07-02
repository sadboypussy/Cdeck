# HANDOFF — Session juillet 2025

> **Pour reprendre sur un autre PC** : clone → `npm install` → `npm run dev`  
> **Branche :** `master` · **Repo :** https://github.com/sadboypussy/Cdeck  
> **Dernier commit de référence :** voir `git log -1` après pull

---

## 1. Identité produit (actée)

**Une phrase :**

> Snappy, musical, connected — j'ouvre ça au lieu de Notepad, et mes idées se retrouvent entre elles.

**Ce que c'est :**

- Surface d'écriture **audio-réactive** (WASAPI) · notes Zettelkasten · proximité intelligente
- **Pas** un lecteur · **pas** un hub Spotify/YouTube · **pas** de titre de morceau affiché
- L'utilisateur joue sa musique **ailleurs sur le PC** ; l'app **écoute** et **s'éveille**

**Ce que ce n'est pas (encore) :**

- Space Coder (**SYNTAX-CORE**) → V4+
- Fullscreen écran principal → V3.2+
- OAuth plateformes · sync cloud · plugins

**Chaîne de valeur :**

```
Musique → Ambiance → Concentration → Pensée → Navigation
```

---

## 2. Décisions produit — traçabilité

| Date | Décision | Pourquoi |
|------|----------|----------|
| juil. 2025 | **PIVOT V3 Notes First** | UI était « lecteur vidéo » ; notes = héros |
| juil. 2025 | **PIVOT V3.1 Framing** | Spaces (VC-77 writer first) · vaults séparés · UI clean |
| juil. 2025 | **Pas de lecteur intégré** | WASAPI suffit ; éviter de redevenir un player |
| juil. 2025 | **Pas de titre de piste** | L'app ne connaît pas la metadata système — honnêteté UI |
| juil. 2025 | **Encouragement musique diégétique** | En veille / À l'écoute — contraste visuel, pas tutorial |
| juil. 2025 | **Draft / Navigate / Focus** | Écrire sans bruit · explorer après 4 s idle ou Tab |
| juil. 2025 | **Cyberpunk → clean** | Adaptable writer/dev ; musique sur le texte |

---

## 3. Historique commits (session)

| Commit | Contenu |
|--------|---------|
| `8f36e0c` | Docs pivot V3 + alignement README/PDD/REPRISE |
| `fc26b8a` | Docs V3.1 framing (Spaces, vaults, Draft/Navigate) |
| `e9073b4` | **Impl V3** : layout notes-first, proximité tissée, read mode, `[[` AC, vault-writer |
| `c813f37` | Suppression YouTube, titres, menu source — audio-réactif pur |
| `5db1390` | Diégétique en veille/à l'écoute · seed `Journal_Focus` · backfill seeds |

---

## 4. État code actuel

### UI

```
┌ TOPBAR — VISUAL-CORE/77 · LIVE · badge Draft/Navigate/Focus ─┐
├ WORKZONE HERO — éditeur · rails (Navigate) · ribbon · Lire ──┤
├ BANDE — En veille | À l'écoute · waveform · horloge · ▾ ──────┤
└ STATUSBAR — Ln/Col · Synced ───────────────────────────────────┘
```

### Postures proximité

| Posture | Déclencheur | UI |
|---------|-------------|-----|
| **Draft** | Défaut · frappe | Rails masqués |
| **Navigate** | Idle 4 s · `Tab` | Rails + ribbon + raisons |
| **Focus** | `Ctrl+Shift+G` | Grille 3×3 overlay · `Escape` → Navigate |

### Audio diégétique

| Classe body | Ressenti |
|-------------|----------|
| `audio-silent` | Désaturé, plat, « En veille » |
| `audio-active` | Lueur, saturation, « À l'écoute » |

### Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Ctrl+P` | Palette notes |
| `Ctrl+S` | Enregistrer |
| `Ctrl+E` | Lire / Écrire |
| `Ctrl+Shift+G` | Focus proximité |
| `Ctrl+Shift+D` | Debug VU |
| `Tab` (éditeur) | Navigate |
| `Escape` | Focus→Navigate→Draft · ferme HUD |

### Vault

- Chemin : `%APPDATA%/com.cyberdeck.app/vault-writer/`
- Migration auto depuis ancien `vault/`
- Seeds : 6 notes (dont `Journal_Focus` ajoutée en 5db1390)
- Notes seed **manquantes** ajoutées au boot sans écraser l'existant

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/app.js` | UI principale |
| `src/proximity.js` | Rails, ribbon, grille focus |
| `src/audio-reactive.js` | WASAPI → bandes → CSS vars |
| `src/styles/pivot-v3.css` | Layout V3 + diégétique audio |
| `src/space.js` | Hook Writer (V4 Coder plus tard) |
| `src-tauri/src/notes.rs` | Vault + seeds |
| `src-tauri/src/galaxy.rs` | Moteur proximité |

---

## 5. Démarrage autre PC

```bash
git clone https://github.com/sadboypussy/Cdeck.git
cd Cdeck
git pull origin master
npm install
npm run dev
```

**Prérequis Windows :** Node.js · Rust · VS Build Tools · WebView2

**Auth GitHub :** compte `sadboypussy` (si 403 : Gestionnaire d'identification Windows → supprimer `git:https://github.com` → reconnecter)

**Double-clic :** `Dev Cyber-Deck.bat`

**Usage musique :** lance Spotify/navigateur **avant ou pendant** — l'app passe de *En veille* à *À l'écoute*.

---

## 6. Definition of Done (pas encore validée)

- [ ] 2 h écriture monitor 2 sans friction
- [ ] Musique on/off = différence ressentie (pièce morte / vivante)
- [ ] 10+ notes naviguées sans dossiers
- [ ] Femme peut écrire + retrouver une note sans doc
- [ ] Tu as arrêté d'ouvrir Notepad pour tes idées

---

## 7. Prochaine session (ordre suggéré)

1. **Toi** : session réelle 1–2 h (musique + notes) — noter ce qui casse le magic
2. **Solo agent** : polish audio INT · typo · transitions · empty states
3. **Vault** : enrichir tes notes perso + `[[liens]]` pour sentir la proximité
4. **V3.2** : fullscreen écran principal (plus tard)

---

## 8. Docs à lire (ordre)

1. **Ce fichier** — reprise rapide
2. [`PIVOT V3.1 — Framing acté.md`](PIVOT%20V3.1%20—%20Framing%20acté.md) — vérité produit
3. [`REPRISE.md`](REPRISE.md) — technique court
4. [`PIVOT V3 — Notes First.md`](PIVOT%20V3%20—%20Notes%20First.md) — contexte pivot
5. `.cursor/rules/cyber-deck-pdd-core.mdc` — règle agent Cursor

---

*Fin handoff — juillet 2025*
