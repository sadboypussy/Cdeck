# PIVOT V3 — Notes First

> **Statut :** direction produit actée — juillet 2025  
> **Framing verrouillé :** [`PIVOT V3.1 — Framing acté.md`](PIVOT%20V3.1%20—%20Framing%20acté.md) ← **lire en second**  
> **Repo :** `sadboypussy/Cdeck` · branche `master`  
> **Documents liés :** `PDD Cyber-Deck V2.md` (V1.1) · `REPRISE.md` · `.cursor/rules/cyber-deck-pdd-core.mdc`

---

## 1. Résumé exécutif

**Cyber-Deck / VISUAL-CORE-77** n'est pas un lecteur avec des notes. C'est une **surface de pensée musicale** — écrire, lire, naviguer entre idées — où la musique **imprègne l'espace** sans en être le héros visuel.

Ce pivot corrige un décalage : le PDD V1.1 disait déjà « notes = outil principal », mais l'UI actuelle consacre ~40 % de l'écran à une zone vidéo 16:9 + contrôles, et la proximité vit dans un **onglet séparé**.

**V3 = aligner l'implémentation sur l'intention.**

---

## 2. Pourquoi ce pivot (maintenant)

### 2.1 Constat après usage réel

| Observation | Conséquence |
|-------------|-------------|
| L'audio-réactif marche via **WASAPI loopback** (Spotify, navigateur, tout) | YouTube embed n'est **pas** nécessaire pour que l'app « vive » |
| La zone vidéo 16:9 domine le layout | Les notes se sentent **secondaires** malgré l'onglet actif |
| `get_galaxy` est intelligent et explicable | Sa valeur est **cachée** derrière l'onglet Proximité |
| L'éditeur est un textarea fonctionnel | Le différenciateur (« comment ça **feel** ») n'est pas encore là |
| Obsidian gagne sur le graphe | On ne concurrence pas le graphe — on concurrence **le ressenti** |

### 2.2 Ce que Ben a validé (session pivot)

- Chaîne de valeur : **Musique → Ambiance → Concentration → Pensée → Navigation**
- Notes + navigation clever = **destination** ; musique = **medium**
- YouTube = **addon convenience**, pas identité
- Musique : WASAPI système ; bande **titre défilant + heure + visualizer** — **pas de thumbnail** (V3.1)
- Spaces : une app, **VISUAL-CORE-77** writer first · **SYNTAX-CORE** coder later · **vaults séparés**
- Esthétique : **moderne clean**, pas cyberpunk hero (V3.1)
- Proximité **continue**, pas un mode
- Typographie + confiance + musicalité **sur le texte**, pas sur un visualiseur
- La musique reste **load-bearing** pour le feel — pas décorative, pas hero UI

### 2.3 Citation pivot

> *Obsidian te donne un vault. Cyber-Deck te donne une **pièce**.*

---

## 3. Traçabilité — évolution du produit

| Étape | Date | Direction | Problème résolu / créé |
|-------|------|-----------|-------------------------|
| **PDD V1.0** | — | Lecteur YouTube + notes + graphe + widgets | Liste de features, pas de promesse |
| **Repositionnement ChatGPT** | — | Compagnon de concentration | Chaîne de valeur musicale formalisée |
| **Annexe A + implémentation** | juin 2025 | WASAPI, proximité Rust, shell Tauri | Audio OK ; UI encore « deck vidéo » |
| **Pivot proximité UI** | juin 2025 | Abandon radar WebGL → grille 3×3 | Moteur conservé ; navigation encore en onglet |
| **PIVOT V3 Notes First** | juil. 2025 | Notes hero · musique atmosphere · proximité tissée | Ce document |
| **PIVOT V3.1 Framing** | juil. 2025 | Spaces · vaults séparés · esthétique clean · Draft/Navigate · bande musique sans thumbnail | **V3.1 doc** |

### 3.1 Ce qui ne change pas (fondations solides)

- Stack **Tauri 2** · Windows only V1
- Vault local Markdown + `[[wikilinks]]` + tags
- **`get_galaxy`** (`galaxy.rs`) : scoring explicable (lien, backlink, tags, Jaccard)
- **WASAPI loopback** → FFT → bandes agrégées → `emit` (pas de spectre brut IPC)
- Principes **musical** vs audio-reactive (~3 % amplitude, pulses sur transitoires)
- **Ctrl+P** palette · autosave · rejets PDD (pas Alt+Espace, pas vumètre permanent prod, pas graphe global)
- Budget polish **80/20** : navigation idées + subtilité musicale >> cyberpunk décoratif

### 3.2 Ce qui change (V3)

| Avant (impl. actuelle) | Après (cible V3) |
|------------------------|------------------|
| Audio tier 16:9 + transport en haut | **Bande ambiance** compacte ; source repliable |
| YouTube toujours visible (fallback ou embed) | **Optionnel** ; menu source ; vignette si l'utilisateur veut |
| Onglets Notes \| Proximité | **Une surface note** ; proximité en rails / ribbon / focus mode |
| Proximité = grille à visiter | Proximité = **contexte permanent** + focus `Ctrl+Shift+G` (provisoire) |
| Écriture = textarea seul | Écriture + **autocomplete wikilink** + suggestions latérales |
| Lecture = même textarea | **Mode lecture** toggle (rendu MD, liens first-class) |
| Raisons de score dans onglet Proximité | **Chips explicatifs** partout (`← backlink`, `tags #focus`) |

---

## 4. Chaîne de valeur (confirmée)

```
Musique → Ambiance → Concentration → Pensée → Navigation
```

**Pas :** `Markdown + Graph + YouTube`

La musique alimente l'ambiance. L'ambiance soutient la concentration. La concentration libère la pensée. La pensée **se relie elle-même** via la proximité.

**Test produit :** l'utilisateur ne dit pas « c'est audio-réactif ». Il dit : *« Je ne sais pas pourquoi, mais travailler là-dessus est incroyablement agréable »* — et quand la musique s'arrête : *« le logiciel est devenu mort »*.

---

## 5. Musique — addon atmosphere (pas hero)

### 5.1 Principe

1. **Source de vérité réactive :** mix système via WASAPI (Spotify, YouTube dans le navigateur, Discord, etc.)
2. **UI musique :** compacte, repliable, jamais obligatoire pour l'expérience
3. **L'app respire** même sans aucun embed — elle **s'éteint** (feel mort) sans son système, pas sans YouTube

### 5.2 Sources musicales (roadmap)

| Phase | Source | Rôle |
|-------|--------|------|
| **V3.0** (actuel + polish) | WASAPI seul | Réactivité complète ; bande « son système » |
| **V3.1** | YouTube IFrame (existant) | Option zero-setup dans menu déroulant |
| **V3.2+** | Comptes plateformes (Spotify, etc.) | OAuth / API officielle — **pas d'extraction** (rejets PDD : pas yt-dlp) |
| **Toutes phases** | Vignette / pochette | **Toggle utilisateur** — affichée seulement si demandée |

### 5.3 UI cible — bande ambiance (affiné V3.1)

Voir **PIVOT V3.1 §5** pour le détail acté. Résumé :

```
┌─────────────────────────────────────────┐
│ TOPBAR · LIVE · (horloge aussi en bande)│
├─────────────────────────────────────────┤
│         ZONE NOTE (hero ~75–85%)        │
│    Draft: éditeur seul · Navigate: rails│
├─────────────────────────────────────────┤
│ ♪ titre défilant · 14:32 · waveform ▾   │  ← repliable, pas de thumbnail
└─────────────────────────────────────────┘
```

- Source menu : Système (défaut) · YouTube option · OAuth plateformes **hors V3**
- **Pas** de cadre 16:9 · **pas** CRT hero · esthétique **clean**

---

## 6. Proximité continue — décisions actées

> Question ouverte en session pivot : *« Mid-sentence, que montrer ? »*  
> **Décision retenue (meilleur compromis V3) :** combinaison **rails latéraux + ribbon bas + focus mode**.

### 6.1 Draft vs Navigate (acté V3.1)

| Posture | Proximité visible | Déclencheur |
|---------|-------------------|-------------|
| **Draft** (défaut) | Non — éditeur seul | Focus écriture · frappe active |
| **Navigate** | Rails + ribbon + chips | Idle 4 s · `Tab` · `Ctrl+Shift+G` (grille) |

Autocomplete `[[` reste actif en Draft. Voir V3.1 §4.

### 6.2 Pendant la lecture

- Même rails · liens rendus cliquables en mode lecture
- Transition note→note modulée par énergie audio (existant — à étendre aux rails)

### 6.3 Focus proximité (ex-onglet)

- **Raccourci provisoire :** `Ctrl+Shift+G` (G = galaxy / proximité)
- Plein écran temporaire : grille **3×3** actuelle + périphériques
- **Escape** ou clic centre → retour surface note
- La grille reste un **instrument de navigation profonde**, pas un mode égal à l'écriture

### 6.4 Confiance — le moteur s'explique

Chaque suggestion affiche **pourquoi** (données déjà dans `GalaxyNode.reasons`) :

- `lien →` · `← backlink` · `tags #foo` · `thème commun`

Pas de boîte noire. L'utilisateur apprend le vault en naviguant.

---

## 7. Notes — « amazing feel »

### 7.1 Écriture

- Hiérarchie typographique respirante (H1/H2/wikilinks — étendre le backdrop actuel)
- Line-height et curseur intentionnels (caret cyan existant)
- Autocomplete wikilink + création note inline
- Bass glow sur titres · pulse wikilinks sur kick (existants — **prioriser** vs effets vidéo)

### 7.2 Lecture

- Toggle **Écrire / Lire** (ou `Ctrl+E` / `Ctrl+R` provisoires)
- Mode lire : Markdown rendu · `[[links]]` et tags comme affordances · pas d'édition accidentelle

### 7.3 Ce qu'on ne devient pas

- Pas un clone Obsidian (plugins, graphe global, PDF, etc.)
- Pas un IDE
- Un **compagnon vertical** toujours ouvert, clever sur **son** vault local

---

## 8. Écart implémentation → cible V3

| Composant | Fichiers actuels | Action prévue |
|-----------|------------------|---------------|
| Layout hero note | `index.html`, `components.css`, `tokens.css` | Inverser ratio ; bande ambiance basse |
| Onglets Notes/Proximité | `app.js`, `index.html` | Supprimer tabs ; rails + focus mode |
| Grille 3×3 | `proximity.js` | Réutiliser en overlay focus |
| Player YouTube | `app.js` | Déplacer menu source ; lazy load conservé |
| Éditeur | `app.js`, `components.css` | Autocomplete · mode lecture |
| Rails suggestions | *nouveau* | Consommer `get_galaxy` en continu |
| PDD / docs | ce fichier + mises à jour | Traçabilité |

---

## 9. Roadmap implémentation (suggérée)

### Phase A — Layout pivot (1–2 sessions)

- [ ] Bande ambiance repliable remplace audio-tier hero
- [ ] Workzone = flex majoritaire
- [ ] YouTube derrière menu source (masqué par défaut)

### Phase B — Proximité tissée (1–2 sessions)

- [ ] Rails latéraux branchés sur `get_galaxy`
- [ ] Ribbon suggestions bas
- [ ] Focus mode `Ctrl+Shift+G` (grille 3×3 existante)
- [ ] Retirer onglet Proximité

### Phase C — Feel notes (2–3 sessions)

- [ ] Autocomplete `[[`
- [ ] Mode lecture Markdown
- [ ] Polish typo + chips raison
- [ ] Calibrage musical sur texte (pas sur bande)

### Phase D — Sources musique (backlog)

- [ ] Menu source extensible
- [ ] Préférences vignette / pochette
- [ ] Spotify OAuth (si faisable API officielle)

---

## 10. Rejets maintenus (hérités PDD V1.1)

- yt-dlp / extraction non officielle
- Graphe global · layout 16:9 principal · widgets RSS/todo
- Vumètre permanent en prod UI
- Alt+Espace · badges raccourcis permanents
- cpal (reste `wasapi`)
- Spectre FFT brut via IPC

---

## 11. Références croisées

| Document | Rôle après pivot |
|----------|------------------|
| **Ce fichier** | Vérité direction V3 · pourquoi · cible UX |
| `PDD Cyber-Deck V2.md` | Historique V1.0–V1.1 · principes musicaux · architecture technique |
| `REPRISE.md` | Handoff dev · état code · prochaine session |
| `.cursor/rules/cyber-deck-pdd-core.mdc` | Règle Cursor — scope agent aligné V3 |

---

## 12. Historique de ce document

| Version | Date | Changement |
|---------|------|------------|
| V3.0 | 2 juil. 2025 | Création — pivot Notes First acté post-session design |

---

*Fin — PIVOT V3 Notes First*
