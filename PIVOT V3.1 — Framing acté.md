# PIVOT V3.1 — Framing acté

> **Statut :** décisions produit verrouillées — juillet 2025  
> **Suite de :** [`PIVOT V3 — Notes First.md`](PIVOT%20V3%20—%20Notes%20First.md)  
> **Session :** réponses Ben + arbitrages agent

---

## 1. Identité produit

### 1.1 Modèle

**Une app, plusieurs Spaces** — même binaire Tauri, configs distinctes :

| Space | Nom affiché (acté) | Rôle | Priorité |
|-------|-------------------|------|----------|
| **Thinker / Writer** | **VISUAL-CORE-77** | Prose, notes longues, Zettelkasten, roman | **V3 — ship first** |
| **Coder** | **SYNTAX-CORE** *(codename provisoire)* | Snippets, dev notes, effets typés | V4+ — après nail Writer |

Umbrella / repo : **Cyber-Deck** · `Cdeck`

Chaque Space = **vault séparé** (pas de `[[liens]]` cross-space — évite pollution prose ↔ code).

### 1.2 Esthétique

**Abandon progressif du cyberpunk décoratif** comme identité principale.

| Avant (PDD / mockups) | Après (V3.1) |
|----------------------|--------------|
| CRT, scanner frame, NOW PLAYING, glitch hero | **Moderne, clean**, adaptable writer ou dev |
| Glow cyberpunk partout | Typographie soignée · musique sur le texte · UI calme |
| Portrait « deck vidéo » | Companion vertical **par défaut** · fullscreen primary **plus tard** |

La musique reste le **sang de l'app** (tous Spaces) — pas un thème visuel cyberpunk.

### 1.3 Remplacement Notepad

Promesse honnête user zero : *« J'arrête d'ouvrir Notepad / bloc-notes pour mes idées. »*  
Pas de positionnement anti-Obsidian (inconnu utilisateur) — **outil perso puis proche, puis maybe Reddit**.

---

## 2. Chaîne de valeur (inchangée)

```
Musique → Ambiance → Concentration → Pensée → Navigation
```

Musique = load-bearing **partout** (Writer et Coder). Silence prolongé = app « morte » — assumé.

---

## 3. Space Writer (VISUAL-CORE-77) — scope V3

### 3.1 Job to be done

Nailer **une** surface de texte :

- Écrire et relire avec **typographie intentionnelle**
- Liens `[[wikilinks]]` + proximité **explicable** sous le capot
- Jamais perdre un mot · liens fiables · navigation > arborescence dossiers
- Musique **subconsciente** sur le texte (pas gimmick)

### 3.2 Différences Writer vs Coder (futures)

| Dimension | VISUAL-CORE-77 (Writer) | SYNTAX-CORE (Coder, plus tard) |
|-----------|-------------------------|--------------------------------|
| **Police / mesure** | Prose : Inter/Sora, line-length confortable | Mono, densité code |
| **Syntaxe** | Markdown riche, titres, tags `#` | MD + blocs code, maybe backticks-first |
| **Réactivité musicale** | **Très subtile** — titres respirent, pas chaque mot | Plus ludique — accents sur **types** de tokens (keywords, strings…) |
| **Proximité** | Jaccard thème, tags, liens narratifs | Headings, symboles, refs fichiers (à concevoir V4) |
| **Vault** | `%APPDATA%/…/vault-writer/` | `%APPDATA%/…/vault-coder/` |

Common sense : écrire un roman ≠ pulse sur chaque syllabe ; coder peut être fun avec effets **catégorisés**.

### 3.3 Écrans

| Mode | V3 | Plus tard |
|------|-----|-----------|
| Second écran vertical, maximized | **Oui — défaut** | — |
| Fenêtre redimensionnable | Oui (existant) | — |
| **Plein écran écran principal** (writing focus) | Non V3 | **V3.2+** — layout s'adapte (plus de largeur texte) |

---

## 4. Proximité — arbitrage Draft / Navigate

Ben : *« fais au mieux »*. Décision :

### 4.1 Deux postures, une surface

| Posture | Défaut | Proximité UI | Usage |
|---------|--------|--------------|-------|
| **Draft** | **Oui** au focus éditeur | Rails **repliés** · ribbon **masqué** · moteur actif en arrière-plan | Écriture flow |
| **Navigate** | Idle **> 4 s** sans frappe · ou **`Tab`** · ou **`Ctrl+Shift+G`** focus grille | Rails **ouverts** · ribbon · chips raison | Exploration, liens |

- Retour Draft : **`Escape`** (si pas HUD) · reprise frappe
- Autocomplete `[[` : **toujours** disponible en Draft (discret)
- Focus grille 3×3 : **`Ctrl+Shift+G`** (overlay plein écran temporaire)

### 4.2 Toujours sous le capot

`get_galaxy` tourne à chaque save / changement note — suggestions prêtes quand Navigate s'ouvre. **Confiance** : raisons visibles dès qu'une suggestion apparaît.

---

## 5. Bande musique — concept acté

**Fini** : zone vidéo 16:9, thumbnail, CRT frame, NOW PLAYING badge.

**V3 bande ambiance** (bas ou haut, repliable) :

```
┌──────────────────────────────────────────────────────┐
│  ♪  Titre du morceau qui défile · artiste  —  14:32   │
│  ▁▂▃▅▇ waveform / visualizer WASAPI                    │
│  [source ▾]  [▶]  [replier]                          │
└──────────────────────────────────────────────────────┘
```

- **Pas de pochette / thumbnail** — nom en **défilement stylé** (marquee) si titre long
- **Horloge** intégrée bande ou topbar (existant)
- **Visualizer** = waveform actuelle (14 barres) — calé WASAPI
- **Source** : système (défaut) · YouTube option menu · plateformes OAuth **hors V3**
- **Repliée** : fine ligne + pulse dot LIVE + heure

YouTube = addon zero-setup, jamais requis.

---

## 6. Piliers qualité (tous P0 — ordre d'implémentation)

1. **Autosave fiable** — jamais perdre un mot (800 ms + indicateur clair)
2. **Wikilinks corrects** — résolution, création, autocomplete
3. **Proximité juste** — reasons qui collent ; pas de suggestions random
4. **Typographie** — pas Notepad ; hiérarchie H1/H2/read mode
5. **Navigation** — rails/Navigate + Ctrl+P < arborescence
6. **Musique subconsciente** — effets texte ~3 % ; manqués quand silence

---

## 7. Non-goals V3 (arbitrage agent)

| Non-goal | V3 | Note |
|----------|-----|------|
| Sync / cloud vault | **Non** | Local first ; wife = copie manuelle ou zip |
| Plugins | **Non** | Spaces = extensibilité future |
| Mobile | **Non** | Windows Tauri |
| Collaboration temps réel | **Non** | — |
| IDE complet | **Non** | Coder Space ≠ VS Code |
| AI writing assistant | **Non** | Revisité si demande forte |
| OAuth Spotify / etc. | **Non V3** | WASAPI suffit |
| Second Space (Coder) | **Non V3** | Architecture Space-ready seulement |

---

## 8. Audience & polish

| Phase | Qui | Niveau polish |
|-------|-----|---------------|
| **Now** | Ben — usage quotidien | Feel Writer nailing |
| **Next** | Femme — test confort | Stabilisation, onboarding minimal |
| **Maybe** | Reddit niche | README install clair ; pas de marketing prématuré |

Framework **Spaces** en code (config JSON : vault path, fonts, reactivity preset) — **sans** shipper Coder UI en V3.

---

## 9. Definition of Done — pivot réussi

Tous valides (session Ben : *« maybe all of this »*) :

- [ ] 2 h d'écriture monitor 2 **sans** ouvrir un onglet Proximité — Navigate suffit
- [ ] YouTube **oublié** — Spotify/navigateur + WASAPI
- [ ] 10+ notes naviguées via rails / `[[` / Ctrl+P sans dossiers
- [ ] Musique off → l'app **se sent morte** ; musique on → retour vie **sans** penser aux effets
- [ ] Femme peut ouvrir, écrire, retrouver une note sans doc

---

## 10. Roadmap révisée

### V3.0 — Writer nail (priorité absolue)

| Phase | Livrable |
|-------|----------|
| **A** | Layout : workzone hero · bande musique actée §5 · retrait hero vidéo |
| **B** | Proximité : Draft/Navigate · rails · ribbon · `Ctrl+Shift+G` · retirer onglets |
| **C** | Feel : typo · read mode · autocomplete `[[` · chips raison · 6 piliers |
| **D** | Space config hook (vault-writer, presets) — **pas** UI Coder |

### V3.2+ — Fenêtre primary fullscreen writer

### V4 — SYNTAX-CORE (Coder Space)

---

## 11. Traçabilité

| Version | Date | Contenu |
|---------|------|---------|
| V3.0 | 2 juil. 2025 | Notes First — doc pivot initial |
| **V3.1** | **2 juil. 2025** | **Framing acté** — Spaces, vaults, esthétique, bande musique, Draft/Navigate |

---

*Fin — PIVOT V3.1 Framing acté*
