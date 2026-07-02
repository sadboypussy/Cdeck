**\# Product Design Document — Cyber-Deck de Productivité**

**\*\*Statut :\*\*** Superdocument révisé — fusion PDD V1 \+ Annexe A \+ principes musicaux \+ synthèse des revues croisées · **direction actuelle V3 → voir `PIVOT V3 — Notes First.md`**    
**\*\*Version :\*\*** 1.1 (superdocument) · pivot produit **V3.0** documenté à part (juil. 2025)    
**\*\*Date de fusion :\*\*** 30 juin 2025    
**\*\*Stack cible :\*\*** Tauri (Rust \+ Web) — Windows 10/11 uniquement (V1)    
**\*\*Format :\*\*** Portrait fixe 9:16  

**\---**

**\#\# Table des matières**

1\. \[Vision & Pitch\](\#1-vision--pitch)  
2\. \[Proposition de valeur repositionnée\](\#2-proposition-de-valeur-repositionnée)  
3\. \[Principes d'animation musicale\](\#3-principes-danimation-musicale)  
4\. \[Démarche de conception — traçabilité des arbitrages\](\#4-démarche-de-conception--traçabilité-des-arbitrages)  
5\. \[Périmètre V1\](\#5-périmètre-v1)  
6\. \[Architecture technique\](\#6-architecture-technique)  
7\. \[Pipeline audio-réactif\](\#7-pipeline-audio-réactif)  
8\. \[UX / UI — Layout V1\](\#8-ux--ui--layout-v1)  
9\. \[Esthétique — Flux Glitch-Decoder\](\#9-esthétique--flux-glitch-decoder)  
10\. \[Interactions, raccourcis & navigation\](\#10-interactions-raccourcis--navigation)  
11\. \[Risques & points de vigilance\](\#11-risques--points-de-vigilance)  
12\. \[Roadmap V2+ (indicatif)\](\#12-roadmap-v2-indicatif)  
13\. \[Plan de développement — spike en deux branches\](\#13-plan-de-développement--spike-en-deux-branches)  
14\. \[Revues croisées & synthèse des décisions\](\#14-revues-croisées--synthèse-des-décisions)  
15\. \[Référence mockup UI\](\#15-référence-mockup-ui)  
16\. \[Historique des révisions & traçabilité\](\#16-historique-des-révisions--traçabilité)  
17\. \[Pivot V3 — Notes First\](\#17-pivot-v3--notes-first-juillet-2025)

**\---**

**\#\# 1\. Vision & Pitch**

\#\#\# 1.1 Pitch produit (direction actuelle)

\*\*Cyber-Deck\*\* est un \*\*compagnon de concentration pour second écran\*\* — un \*Knowledge Cockpit\* / \*Ambient Thinking Interface\* — où la musique n'est plus à côté du travail : elle devient une \*\*propriété de l'espace de réflexion\*\*.

L'application desktop, en portrait (9:16), combine trois usages aujourd'hui dispersés dans des outils séparés :

\- \*\*Écoute musicale\*\* (YouTube, playlist nightcore/Syrex par défaut) — non comme produit principal, mais comme \*\*source de rythme et d'ambiance\*\*  
\- \*\*Prise de notes interconnectées\*\* façon Zettelkasten — \*\*outil principal\*\* de l'expérience  
\- \*\*Navigation par graphe de proximité\*\* — mémoire vivante des idées, pas simple visualisation

Le tout est unifié par une esthétique cyberpunk/glitch sobre, et par une \*\*réactivité audio réelle\*\* calée sur le son effectivement émis par le système — pas une simulation.

\#\#\# 1.2 Ce que le produit n'est pas

| Ce n'est pas | C'est |  
|--------------|-------|  
| Un lecteur audio avec des notes en bonus | Un poste de travail compagnon |  
| Un éditeur de notes avec un lecteur en bonus | Un environnement de réflexion dont l'état émotionnel est influencé par la musique |  
| Un visualiseur Winamp cyberpunk | Une interface \*\*musicale\*\* (pas seulement audio-réactive) |  
| Un remplacement d'Obsidian ou VS Code | Un compagnon de second écran qu'on garde ouvert en permanence |

\#\#\# 1.3 Scénario d'usage cible

L'écran principal sert à coder/écrire. Le second écran héberge la musique, les notes en cours et un retour visuel qui \*\*vit au rythme de la musique\*\*, sans détourner l'attention.

L'utilisateur ne dit pas \*« c'est audio-réactif »\*. Il dit : \*« Je ne sais pas pourquoi, mais travailler là-dessus est incroyablement agréable »\* — ou, quand la musique s'arrête : \*« le logiciel est devenu mort »\*.

\#\#\# 1.4 Cible utilisateur

\- Développeurs, créateurs, rédacteurs avec \*\*second écran vertical\*\* (ou tablette en portrait en dock)  
\- Profils habitués au \*\*focus music\*\* (lofi, nightcore, Syrex, playlists longues)  
\- Utilisateurs cherchant un \*\*poste compagnon\*\* toujours ouvert, pas un IDE ou un gestionnaire de connaissances complet

\> \*\*Note de positionnement (revue ChatGPT, intégrée) :\*\* La cible n'est pas « tout le monde qui prend des notes ». C'est un profil précis : focus music \+ second écran \+ pensée en réseau (Zettelkasten léger). La promesse centrale : \*« le texte est parcouru de musique »\* et \*« une ambiance supra focus où la musique flow dans le boulot »\*.

\---

\#\# 2\. Proposition de valeur repositionnée

\#\#\# 2.1 Évolution du pitch (traçabilité)

\*\*Pitch initial (PDD V1.0) :\*\*    
\*Une application qui combine lecteur YouTube, éditeur Markdown, graphe Zettelkasten et widgets de productivité, unifiés par une esthétique cyberpunk et une réactivité audio.\*

\*\*Problème identifié (revue ChatGPT) :\*\*    
Présenté ainsi, l'utilisateur pense : \*« j'ai déjà Obsidian \+ Spotify/YouTube dans un onglet »\*. La liste de fonctionnalités ne suffit pas à justifier une app dédiée.

\*\*Pitch révisé (direction actuelle) :\*\*    
\*Un compagnon de concentration pour second écran — un espace de réflexion qui respire avec la musique.\*

La chaîne de valeur devient :

\`\`\`  
Musique → Ambiance → Concentration → Pensée → Navigation  
\`\`\`

et non :

\`\`\`  
Markdown \+ Graph \+ Youtube  
\`\`\`

\#\#\# 2.2 Différenciation assumée

| Concurrent indirect | Ce qu'il fait | Ce que Cyber-Deck fait différemment |  
|---------------------|---------------|-------------------------------------|  
| Obsidian \+ plugin | Notes \+ graphe puissant | Cohérence \*\*sensorielle\*\* : musique imprègne texte, liens, radar, transitions |  
| Spotify / YouTube (onglet) | Musique à côté du travail | Musique comme \*\*propriété\*\* de l'espace de travail |  
| Wallpaper Engine | Audio-réactivité décorative (fond d'écran) | Audio-réactivité au service de la \*\*cognition\*\* et de la navigation |  
| Notepad / éditeurs génériques | Texte plat | Texte \*\*vivant\*\*, parcouru de musique |

\#\#\# 2.3 Le twist différenciant (revues croisées)

Ce qui peut faire dire \*« je n'ai jamais vu ça »\* :

1\. \*\*Le radar comme mémoire vivante\*\* — pivoter entre idées par clic sur un nœud ; on ne navigue plus dans des fichiers, on navigue dans des idées  
2\. \*\*La musique comme propriété de l'espace\*\* — titres qui respirent, liens qui pulsent sur kick, radar qui contracte, transitions calées sur le tempo  
3\. \*\*Le format 9:16 compagnon\*\* — un seul layout maîtrisé, pensé pour rester ouvert des heures sans fatiguer

\*\*Pistes V2+ (non V1, mais identité produit) :\*\*

\- Notes qui respirent légèrement avec les basses (très subtil)  
\- Radar qui pulse quand une note liée est récemment modifiée  
\- Historique de navigation entre notes sous forme de « trace »  
\- Palette de commandes unique (\`Ctrl+P\`) pour tout faire : ouvrir une note, lancer une playlist, créer une note, rechercher un tag

\#\#\# 2.4 Noms alternatifs envisagés (non actés)

\- \*Knowledge Cockpit\*  
\- \*Ambient Thinking Interface\*  
\- \*Second Brain Companion\*

Le nom commercial reste \*\*Cyber-Deck\*\* ; les alternatives servent de boussole produit.

\---

\#\# 3\. Principes d'animation musicale

\> \*\*Section ajoutée post-revue ChatGPT — formalise la direction « musical » vs « audio-reactive ».\*\*

\#\#\# 3.1 Deux directions possibles

| Mauvaise direction | Bonne direction |  
|--------------------|-----------------|  
| Visualiseur Winamp : barres, particules, RGB, glitchs toutes les 2 s | Quasi-invisible : respiration 3 %, liens qui pulsent sur kick, radar qui contracte |  
| Fatiguant après 3 minutes → OFF | Invisible consciemment ; manquant quand la musique s'arrête |  
| Répond à chaque pic sonore | Comprend rythme, respirations, montées, relâchements |  
| Mot-clé : \*\*audio-reactive\*\* | Mot-clé : \*\*musical\*\* |

\#\#\# 3.2 Règles d'implémentation V1

1\. \*\*Amplitude maximale\*\* — Jamais plus de \~3 % de variation visuelle sur texte (letter-spacing, text-shadow, glow). Pas 30 %.  
2\. \*\*Seuil de déclenchement\*\* — Les micro-glitchs et pulses sur liens ne se déclenchent que sur transitoires significatifs (kick, snare), pas sur chaque frame FFT.  
3\. \*\*Silence\*\* — Si silence \> N secondes (à calibrer, ex. 2 s), les animations retombent à l'état repos sans effet « mort subite ».  
4\. \*\*Pollution audio\*\* — Seuil de détection ajustable pour limiter les faux déclenchements sur sons courts/aigus (notifications Discord, etc.).  
5\. \*\*Vumètre\*\* — En production V1 : option debug ou réglage « intensité », \*\*pas élément permanent\*\* de l'UI. La réactivité imprègne le texte et la navigation, pas un visualiseur décoratif.  
6\. \*\*Test de validation\*\* — L'utilisateur ne doit pas pouvoir décrire l'effet consciemment ; il doit le \*\*manquer\*\* quand la musique s'arrête (analogie interfaces Apple : on ne remarque pas les animations, on remarque leur absence).

\#\#\# 3.3 Effets musicaux obligatoires V1 (priorité produit)

| Effet | Cible | Bande / signal |  
|-------|-------|----------------|  
| Respiration des titres | \`\#\`, \`\#\#\` dans l'éditeur | Basses (\~20–150 Hz), ±2–3 % text-shadow / letter-spacing |  
| Pulse des liens \`\[\[...\]\]\` | Liens wikilinks cliquables | Transitoires (crêtes), seuil élevé |  
| Respiration du radar | Anneaux, nœuds, sweep | Énergie moyenne globale ; contraction/détente douce |  
| Transitions note → note | Changement de note active | Durée modulée par énergie des \~2 dernières secondes |

\#\#\# 3.4 Effets reportés ou optionnels

| Effet | Statut |  
|-------|--------|  
| Vumètre permanent (barres) | Debug / settings uniquement |  
| Glitch agressif sur transitoires | Option « intensité » ; défaut \= subtil |  
| Scanlines / pixellisation miniature | Esthétique statique OK ; animation agressive \= limitée |  
| Épaississement des liens graphe sync synthé | V2+ |  
| Curseur avec micro-traînée rythmique | V2+ (piste identité) |  
| Animations de panneaux selon intensité morceau | V2+ |

\#\#\# 3.5 Extension conceptuelle (interaction, pas seulement visuel)

La musique peut piloter l'\*\*interaction\*\*, pas seulement le rendu :

\- Animations de navigation suivent le tempo  
\- Ouvertures/fermetures de panneaux : inertie différente selon intensité  
\- Passage note → note : les liens semblent entraîner la note suivante, comme si l'on surfait sur le rythme

\> \*\*Budget produit (revue Claude) :\*\* Consacrer \~80 % du temps polish à la fluidité navigation idées \+ subtilité musicale ; \~20 % à l'esthétique cyberpunk décorative. Inverse \= gadget qu'on éteint au bout de trois jours.

\---

\#\# 4\. Démarche de conception — traçabilité des arbitrages

Cette section documente le raisonnement qui a mené au scope actuel, pour que les arbitrages restent traçables si le projet évolue.

\#\#\# 4.1 Point de départ

L'idée initiale combinait :

\- Lecteur YouTube intégré  
\- Couche de notes Markdown  
\- Graphe de liens façon Zettelkasten  
\- Plusieurs widgets (to-do, RSS, monitoring système)  
\- Bascule portrait (9:16) ↔ paysage plein écran (16:9)  
\- Esthétique « glitch-decoder », lofi/cyberpunk, musique comme horloge système de l'interface

\#\#\# 4.2 Premier filtre — Qu'est-ce qui est différenciant ?

Sur l'ensemble des briques proposées, une seule porte une vraie valeur d'usage durable : le \*\*Zettelkasten réactif\*\* (notes liées \+ graphe visuel / radar de proximité).

Les widgets annexes (to-do « combo », flux RSS défilant au BPM) ont été identifiés comme du \*\*remplissage probable\*\* plutôt que du cœur de produit. Ils sont conservés dans la vision long terme mais \*\*explicitement écartés de la V1\*\*.

\#\#\# 4.3 Deuxième filtre — La réactivité audio est-elle faisable ?

\*\*Point bloquant identifié :\*\* l'audio d'une vidéo YouTube embarquée via l'IFrame Player API n'est \*\*pas accessible\*\* à un \`AnalyserNode\` Web Audio — restriction cross-origin du navigateur.

\*\*Trois pistes évaluées :\*\*

| Piste | Description | Décision |  
|-------|-------------|----------|  
| A — Simulation | Beat detection approximative ou pattern procédural | Écartée pour la V1 finale ; utile en prototypage (branche A) |  
| B — Changer de source | Fichier auto-hébergé, ou extraction non officielle du flux YouTube | Extraction \= zone grise CGU, fragilité → \*\*hors scope durable\*\*. Hébergement local → \*\*V2+\*\* |  
| C — Capture système | Loopback OS, indépendamment de la source de lecture | \*\*Retenue pour V1\*\* (Windows-only) |

\#\#\# 4.4 Troisième filtre — Combien ça coûte réellement ?

La capture système a d'abord été écartée comme disproportionnée pour une V1, sur la base d'un raisonnement \*\*cross-platform\*\* :

\- Trois implémentations OS (WASAPI/Windows, ScreenCaptureKit/macOS, PulseAudio/Linux)  
\- UX de permission lourde sur macOS (popup autorisation enregistrement écran \+ audio)  
\- Travail de synchronisation non trivial  
\- Ratio effort/valeur mauvais pour un effet périphérique à l'usage

\#\#\# 4.5 Quatrième filtre — Comment fait un produit qui le fait déjà ?

\*\*Référence : Wallpaper Engine\*\*

\- Capture le mix audio de sortie système via WASAPI loopback  
\- Pas de distinction de source applicative  
\- \*\*Conclusion :\*\* faisabilité technique validée ; limite intrinsèque confirmée (impossible d'isoler « seulement Syrex » du reste du son système)

\#\#\# 4.6 Décision finale — Scope V1 Windows-only

Le scope V1 a été restreint à \*\*Windows uniquement\*\*, ce qui élimine le quasi-totalité du surcoût cross-platform :

\- Une seule implémentation native (\*\*wasapi\*\*, cf. §6.1 — amendement Annexe A)  
\- Pas de gestion permission macOS  
\- Pas de portage Linux à maintenir

Sous cette contrainte, la capture audio système redevient un investissement raisonnable (\*\*3 à 5 jours\*\* de travail Rust estimés — à ajuster à 7–10 jours si première expérience Rust) pour une fonctionnalité qui sort le produit du lot.

Le mode 16:9 / bascule d'orientation est \*\*repoussé en V2\*\* : complexité de layout disproportionnée par rapport à la valeur immédiate d'une V1 mono-format.

\#\#\# 4.7 Cinquième filtre — Repositionnement produit (post-revue ChatGPT)

\*\*Constat :\*\* Le différenciant n'est plus la liste de features mais la \*\*sensation\*\* — musique imprègnant l'espace de réflexion.

\*\*Décision :\*\* Intégrer les principes musicaux (§3) comme contraintes produit de première classe, au même niveau que les choix techniques.

\---

\#\# 5\. Périmètre V1

\#\#\# 5.1 Inclus en V1

| Brique | Détail |  
|--------|--------|  
| \*\*Lecteur YouTube intégré\*\* | IFrame Player API officielle. Playlist par défaut \= Syrex / nightcore. Changement de playlist possible. Contrôles standards (play/pause/skip/volume). Source de rythme, pas produit principal. |  
| \*\*Habillage visuel Glitch-Decoder\*\* | Filtre cyber-scanner sur la miniature, titre en flux décrypté, contrôles façon terminal/console analogique. Sobriété prioritaire sur spectacle. |  
| \*\*Éditeur Markdown minimaliste\*\* | Prise de notes rapide, syntaxe \`\[\[Lien\]\]\` pour relations entre notes. Persistance locale fichiers. |  
| \*\*Graphe Zettelkasten — proximité\*\* | \*\*Note active au centre \+ voisins au premier degré uniquement\*\* (pas de graphe global). Toggle panneau Notes / Radar. |  
| \*\*Réactivité audio réelle\*\* | Capture système Windows (WASAPI loopback via crate \*\*wasapi\*\*), FFT (rustfft), agrégation 4–8 bandes côté Rust, effets musicaux subtils (§3.3). |  
| \*\*Layout portrait fixe 9:16\*\* | Zone supérieure ≈ 1/3 : visualiseur \+ contrôles. Zone inférieure ≈ 2/3 : notes / graphe (toggle). |  
| \*\*Navigation\*\* | Liens \`\[\[...\]\]\` cliquables, pivot radar, palette recherche \`Ctrl+P\`. |  
| \*\*Tags\*\* | Affichage métadonnées tags en bas de note (épurer le corps). |  
| \*\*Raccourci global\*\* | \`Ctrl+P\` — palette de commandes (recherche notes ; extension V2 : playlists, tags, création). |

\#\#\# 5.2 Explicitement reporté en V2+

| Élément | Raison |  
|---------|--------|  
| Bascule layout 16:9 / mode Dashboard cockpit plein écran | Complexité layout |  
| Rack widgets modulaires (Hardware Monitor, Combo To-Do, Flux RSS) | Remplissage vs cœur produit |  
| Support macOS / Linux pour capture audio | Coût cross-platform |  
| Hébergement local de pistes audio | Alternative à loopback global ; affranchit pollution audio |  
| Animations avancées graphe (liens sync synthé, etc.) | V1 \= graphe réactif simple |  
| Sync cloud / mobile | Hors scope compagnon local |  
| Historique navigation « trace », curseur traînée, panneaux modulés par intensité | Identité V2 |

\#\#\# 5.3 Hors scope (assumé, pas de date)

| Élément | Raison |  
|---------|--------|  
| Extraction non officielle flux YouTube (yt-dlp, etc.) | Zone grise CGU, fragilité technique. IFrame API officielle retenue. |

\#\#\# 5.4 Explicitement rejeté après revues (traçabilité)

| Élément | Source revue | Raison du rejet |  
|---------|--------------|-----------------|  
| \`Alt+Espace\` comme raccourci focus global | Gemini proposé, ChatGPT \+ Claude rejettent | Conflit avec \`Alt+Space\` menu système fenêtre Windows |  
| Halo lumineux du deck au focus | Gemini | Effet « démo », pas produit ; focus quasi invisible préféré |  
| Badges raccourcis permanents dans l'UI | Gemini | Utile prototype, pas V1 |  
| Labels radar toujours visibles | ChatGPT | Casse esthétique ; préférer point lumineux, nom au hover, ouverture au clic |  
| Vumètre permanent en UI principale | ChatGPT \+ §3 | Visualiseur Winamp ; debug/settings uniquement |

\---

\#\# 6\. Architecture technique

\#\#\# 6.1 Stack

| Couche | Choix | Justification |  
|--------|-------|---------------|  
| Shell applicatif | \*\*Tauri\*\* (Rust backend \+ webview frontend) | Poids mémoire/CPU inférieur à Electron ; app en arrière-plan sur second écran pendant des heures |  
| Frontend | HTML/CSS/JS (React envisageable si état graphe complexe) | Léger, mockup existant |  
| Lecture vidéo | YouTube IFrame Player API (officielle, webview) | Conformité CGU ; pas d'extraction |  
| Capture audio système | \*\*\`wasapi\`\*\* (crate Rust) | \*\*Amendement Annexe A\*\* — voir §6.2 |  
| Analyse spectrale | \`rustfft\` côté Rust | FFT sur flux loopback |  
| Communication back → front | Événements Tauri (\`emit\`) | Bandes agrégées \~16–33 ms (30–60 Hz) |  
| Persistance notes | Fichiers locaux (Markdown \+ métadonnées) | Simplicité V1 ; pas de DB lourde |

\#\#\# 6.2 Choix wasapi vs cpal (amendement Annexe A — intégré)

\*\*Décision initiale PDD V1.0 :\*\* crate \`cpal\` (abstraction cross-platform au-dessus de WASAPI).

\*\*Décision révisée :\*\* crate \*\*\`wasapi\`\*\*.

\*\*Raisons :\*\*

\- \`cpal\` est une abstraction cross-platform pensée avant tout pour des périphériques d'\*\*entrée\*\* (micros)  
\- Le mode loopback WASAPI n'y est pas nativement bien exposé sur tous les backends → contourner la crate en pratique  
\- Le choix initial \`cpal\` reposait sur garder une porte ouverte macOS/Linux  
\- La V1 est \*\*strictement Windows-only\*\* → payer le coût d'abstraction sans contrepartie utile  
\- \`wasapi\` \= liaison directe API native Microsoft, loopback natif sans contournement

\*\*Portage futur :\*\* Si cross-platform devient objectif V2 sérieux, arbitrage \`cpal\` vs implémentations natives séparées réévalué avec besoin réel de portabilité.

\> \*\*Traçabilité :\*\* Retirer toute mention de \`cpal\` comme choix par défaut V1. Section 4.6 mise à jour en conséquence.

\#\#\# 6.3 Structure projet (indicatif)

\`\`\`  
cyber-deck/  
├── src-tauri/  
│   ├── src/  
│   │   ├── main.rs  
│   │   ├── audio/  
│   │   │   ├── mod.rs          \# Module capture \+ FFT  
│   │   │   ├── loopback.rs     \# WASAPI loopback  
│   │   │   ├── fft.rs          \# rustfft \+ agrégation bandes  
│   │   │   └── device.rs       \# Détection changement périphérique (A.5)  
│   │   └── commands.rs         \# IPC Tauri  
│   └── Cargo.toml              \# wasapi, rustfft  
├── src/                        \# Frontend  
│   ├── index.html  
│   ├── styles/  
│   ├── components/             \# Player, Editor, Radar, HUD  
│   └── audio-reactive.js       \# Consommation bandes → CSS  
└── notes/                      \# Vault Markdown local  
\`\`\`

\#\#\# 6.4 Limites techniques assumées

| Limite | Impact | Mitigation |  
|--------|--------|------------|  
| Loopback \= mix global système | Réagit à tout son Windows, pas seulement Syrex | Accepté V1 ; seuils §3.2 ; hébergement local V2 |  
| Latence audio → visuel | \~30–80 ms total (loopback \+ FFT \+ IPC \+ repaint) | Suffisant pour effets musicaux subtils ; pas beat-perfect frame-accurate |  
| Webview \+ YouTube | Caprices occasionnels (région, DRM, API) | Fallback visuel si miniature indisponible |  
| IFrame API | Pas de contrôle sur restrictions futures | Conformité ; alternative locale V2 |

\---

\#\# 7\. Pipeline audio-réactif

\#\#\# 7.1 Flux de données

\`\`\`  
\[WASAPI Loopback — périphérique sortie par défaut\]  
        ↓  
\[Échantillons bruts → buffer circulaire\]  
        ↓  
\[FFT (rustfft) à intervalle régulier\]  
        ↓  
\[Extraction énergie par bande : basses \~20–150 Hz, médiums, aigus, crêtes\]  
        ↓  
\[Pondération logarithmique — log scale ou A-weighting\]  
        ↓  
\[Agrégation → 4 à 8 floats normalisés 0.0–1.0\]  ← OBLIGATOIRE côté Rust  
        ↓  
\[tauri::Window::emit — IPC\]  
        ↓  
\[Frontend : CSS/SVG — text-shadow, glow, micro-glitch, radar\]  
\`\`\`

\#\#\# 7.2 Règle d'agrégation avant émission (amendement Annexe A.2)

\*\*Le spectre FFT brut ne doit jamais transiter par \`tauri::Window::emit\`.\*\*

Une émission JSON haute fréquence (30–60 Hz) d'un tableau de centaines de bins FFT créerait une charge de sérialisation/désérialisation inutile et potentiellement coûteuse en CPU côté IPC.

\*\*Règle d'implémentation :\*\* l'agrégation en bandes (basses / médiums / aigus / crêtes, typiquement 4 à 8 valeurs float normalisées) se fait \*\*entièrement côté Rust\*\*, avant l'appel à \`emit\`. Seul ce tableau réduit traverse l'IPC vers le frontend.

\#\#\# 7.3 Pondération perceptuelle

Point d'attention identifié en amont : une FFT brute en échelle linéaire donne un rendu visuel plat sur les basses et excessif sur les aigus par rapport à la perception réelle.

\*\*Mitigation :\*\* application d'une pondération log / A-weighting \*\*dès l'implémentation initiale\*\*, pas en correctif a posteriori.

\#\#\# 7.4 Gestion changement de périphérique (amendement Annexe A.5)

\*\*Risque :\*\* Si l'utilisateur change de périphérique de sortie par défaut en cours d'exécution (casque, carte son), le flux loopback peut rester « sourd » silencieusement — pas de crash, pas d'erreur visible, réactivité qui s'arrête.

\*\*Mitigation :\*\* Détection du changement de device par défaut côté wasapi et \*\*reconnexion automatique\*\* du flux loopback.

\---

\#\# 8\. UX / UI — Layout V1

\#\#\# 8.1 Contrainte format

\*\*Portrait 9:16 uniquement.\*\* Pas de bascule d'orientation en V1. Un seul agencement, stable.

Dimensions de référence mockup : \*\*380 × 780 px\*\* (équivalent \~second écran vertical compact).

\#\#\# 8.2 Zone supérieure (≈ 1/3) — Visualiseur & contrôles

\- Miniature pixellisée / filtrée de la piste en cours (filtre Cyber-Scanner)  
\- Titre en flux défilant style \`DATA\_STREAM // ...\`  
\- Contrôles play/pause/skip/volume façon terminal  
\- Réactivité audio la plus visible ici — mais \*\*subtile\*\* (§3), pas vumètre permanent  
\- Vumètre : réservé mode debug ou réglage intensité

\#\#\# 8.3 Zone inférieure (≈ 2/3) — Notes & graphe

\- \*\*Éditeur Markdown\*\* par défaut  
\- Raccourci / toggle vers vue \*\*Radar\*\* (graphe de proximité)  
\- \*\*Pas d'affichage simultané\*\* des deux en V1 (lisibilité format restreint)  
\- Tags affichés sous le corps de la note

\#\#\# 8.4 Graphe de proximité (amendement Annexe A.3)

En V1, le graphe Zettelkasten n'affiche \*\*pas\*\* l'ensemble des notes et de leurs liens.

Il affiche uniquement :

\- La \*\*note active au centre\*\*  
\- Ses \*\*voisins directs\*\* (liaisons au premier degré)  
\- Maximum \*\*4 voisins\*\* affichés géométriquement en V1 mockup (limite layout ; voisins supplémentaires accessibles via liens texte ou \`Ctrl+P\`)

\*\*Raisons :\*\*

\- Graphe global illisible en contrainte verticale 9:16  
\- Graphe de proximité lisible quelle que soit la taille du corpus  
\- Renforce l'effet « radar / scanner de données » (§9)

\*\*Comportement :\*\* Clic sur nœud périphérique → pivot : note cliquée au centre, nouvelles liaisons, sync avec vue Notes.

\#\#\# 8.5 Barre de statut

\- Position curseur (LN, COL) ou info contextuelle discrète  
\- Indicateur sync / version  
\- Pas de surcharge d'informations « démo »

\---

\#\# 9\. Esthétique — Flux Glitch-Decoder

\#\#\# 9.1 Éléments visuels

| Élément | Description | Niveau V1 |  
|---------|-------------|-----------|  
| Filtre Cyber-Scanner | Traitement lofi/cyberpunk sur miniature (pixellisation, overlay lignes balayage) | Statique / léger |  
| Illusion du direct | Titre piste défilant comme flux de données décrypté | Oui |  
| Contrôles | Commutateurs analogiques / terminal, pas boutons standards | Oui |  
| Typographie notes | Titres \`\#\`, \`\#\#\` avec lueur néon, intensité pilotée basses | Oui, \*\*subtil\*\* (§3) |  
| Scanlines / glitch agressif | Effet cyberpunk | Limité ; éviter fatigue visuelle |  
| Palette | Fond \`\#08080a\`, cyan \`\#00f0ff\`, pink accent \`\#ff0055\`, mono JetBrains / Share Tech Mono | Mockup de référence |

\#\#\# 9.2 Lien graphe proximité ↔ esthétique

Le graphe de proximité participe à l'esthétique \*\*scanner / radar\*\* :

\- Anneaux concentriques  
\- Sweep rotatif (animation lente, 4 s/tour en mockup)  
\- Nœuds \= points lumineux ; labels au hover (pas toujours visibles — décision revue ChatGPT)  
\- Lignes de liaison depuis le centre

\#\#\# 9.3 Équilibre esthétique vs musicalité

L'esthétique cyberpunk pose le \*\*cadre identitaire\*\*. La musicalité (§3) pose le \*\*comportement vivant\*\*. En cas de conflit, la musicalité subtile prime sur l'effet spectaculaire.

\---

\#\# 10\. Interactions, raccourcis & navigation

\#\#\# 10.1 Synthèse des revues (Gemini → filtrage ChatGPT/Claude)

| Interaction | Statut V1 | Notes |  
|-------------|-----------|-------|  
| \`Ctrl+P\` — palette recherche globale | \*\*Inclus\*\* | Style Obsidian / VS Code ; power user. Implémentation Tauri global shortcut. |  
| Liens \`\[\[...\]\]\` cliquables | \*\*Inclus\*\* | Pivot vers note liée ; sync radar |  
| Clic nœud radar → pivot | \*\*Inclus\*\* | Cœur navigation « mémoire vivante » |  
| Tags en bas de note | \*\*Inclus\*\* | Métadonnées explicites |  
| \`Escape\` — fermer HUD recherche | \*\*Inclus\*\* | Standard |  
| \`Alt+Espace\` — focus deck | \*\*Rejeté\*\* | Conflit Windows ; gadget |  
| Badges raccourcis dans UI | \*\*Rejeté\*\* | Prototype only |  
| Halo focus deck | \*\*Rejeté\*\* | Trop démo |

\#\#\# 10.2 Palette \`Ctrl+P\` — scope V1 vs V2

\*\*V1 :\*\* Recherche et ouverture de notes par nom / id.

\*\*V2 (extension) :\*\* Créer note, rechercher par tag, lancer playlist, commandes fichier.

\#\#\# 10.3 Modèle de données notes (conceptuel)

\`\`\`javascript  
// Structure cible (inspirée mockup Gemini, à implémenter avec persistance fichiers)  
{  
  "NOTE\_ID": {  
    title: "\# TITRE",  
    body: "Markdown \+ \[\[Liens\]\]",  
    tags: \["\#tag1", "\#tag2"\],  
    neighbors: \["ID\_VOISIN\_1", "ID\_VOISIN\_2"\]  // dérivé des \[\[wikilinks\]\] ou explicite  
  }  
}  
\`\`\`

Les \`neighbors\` sont dérivés du parsing \`\[\[wikilinks\]\]\` dans le vault — pas maintenus manuellement en double.

\#\#\# 10.4 Persistance (à spécifier en implémentation)

\- Un fichier \`.md\` par note dans un dossier vault local  
\- Parsing frontmatter YAML optionnel pour tags  
\- Résolution liens : \`\[\[NomNote\]\]\` → fichier \`NomNote.md\`  
\- Autosave on blur / debounce  
\- Backlink index léger pour graphe de proximité

\> \*\*Budget réaliste (revue faisabilité) :\*\* éditeur \+ persistance \= 1–2 semaines au-delà du mockup interactif.

\---

\#\# 11\. Risques & points de vigilance

| Risque | Impact | Mitigation prévue |  
|--------|--------|-------------------|  
| Captation sons parasites (notifications, autres apps) | Réactivité visuelle « polluée » | Accepté V1 ; seuils §3.2 ; hébergement local V2 |  
| Courbe d'apprentissage Rust / audio bas niveau | Retard module capture | Budget 3–5 j (7–10 j si débutant Rust) ; spike branche B isolé |  
| Rendu FFT non naturel si non pondéré | Effet visuel « faux » | Pondération log / A-weighting dès le départ (§7.3) |  
| Dépendance IFrame YouTube | Restrictions futures API | Conformité ; hébergement local V2 |  
| \*\*Changement périphérique sortie en cours d'exécution\*\* (A.5) | Perte silencieuse réactivité audio | Détection device \+ reconnexion auto loopback |  
| Éditeur Markdown « minimaliste » sous-estimé | Retard V1, UX bancale | Scope strict ; pas de features Obsidian ; autosave \+ wikilinks suffisent |  
| Raccourcis globaux \`Ctrl+P\` | Conflits avec autres apps | Documenter ; option rebind V2 |  
| Latence audio → visuel | Effets « décalés » sur kicks | Accepter « musical » pas « sample-accurate » ; ajuster seuils |  
| Dérive vers visualiseur Winamp | Fatigue utilisateur, app éteinte | Principes §3 ; vumètre pas en UI principale |  
| Pitch « liste de features » | Pas de différenciation perçue | Repositionnement §2 ; démo vidéo \= sensation pas features |

\---

\#\# 12\. Roadmap V2+ (indicatif, non engageant)

1\. Bascule layout 9:16 / 16:9 — mode Dashboard cockpit plein écran  
2\. Rack widgets modulaires (monitoring matériel, to-do combo, flux RSS calé BPM)  
3\. Hébergement local de pistes — affranchissement limite loopback global  
4\. Évaluation portage macOS (ScreenCaptureKit) si usage le justifie  
5\. Animations graphe avancées (liens sync synthé, pulse note modifiée récemment)  
6\. Extension palette \`Ctrl+P\` (playlists, tags, création)  
7\. Historique navigation « trace »  
8\. Curseur micro-traînée rythmique  
9\. Sync cloud (si demande utilisateurs)

\---

\#\# 13\. Plan de développement — spike en deux branches

\> \*\*Remplace intégralement l'ancienne section 9 du PDD initial\*\* (amendement Annexe A.4).

\#\#\# 13.1 Principe

Découpage en \*\*deux branches indépendantes\*\*, à fusionner ensuite. Isole le risque technique le plus incertain (audio bas niveau) du reste de l'UI.

\#\#\# 13.2 Branche A — UI & Notes

| Étape | Livrable |  
|-------|----------|  
| A1 | Structure Tauri de base, fenêtre portrait 9:16 |  
| A2 | IFrame YouTube intégré, contrôles |  
| A3 | Éditeur Markdown minimal \+ persistance fichiers |  
| A4 | Toggle Notes / Radar, données fictives puis vault réel |  
| A5 | Liens \`\[\[...\]\]\` cliquables, pivot radar |  
| A6 | HUD recherche \`Ctrl+P\` |  
| A7 | Tags, barre statut |  
| A8 | \*\*Réactivité simulée\*\* (\`setInterval\` JS basique) pour valider layout et hooks animation \*\*sans\*\* module audio |

\*\*Critère de validation branche A :\*\* Navigation note ↔ radar fluide ; layout stable 30+ min ; hooks CSS prêts à recevoir bandes réelles.

\#\#\# 13.3 Branche B — Audio Core

| Étape | Livrable |  
|-------|----------|  
| B1 | Prototype Rust \*\*CLI indépendant\*\* de l'UI |  
| B2 | Ouverture flux loopback wasapi |  
| B3 | FFT rustfft \+ log scale |  
| B4 | Agrégation 4–8 bandes (conforme §7.2) |  
| B5 | Vumètre texte terminal (\`||||...\`) |  
| B6 | Détection changement périphérique \+ reconnexion (A.5) |

\*\*Critère de validation branche B :\*\* Barres répondent correctement aux basses en écoutant une piste Syrex réelle — \*\*avant\*\* toute intégration Tauri.

\#\#\# 13.4 Fusion

Une fois A et B validées indépendamment :

1\. Intégrer module audio dans \`src-tauri\`  
2\. Brancher \`emit\` Rust (sortie B) sur éléments animation posés en A  
3\. Remplacer simulation JS par bandes réelles  
4\. Calibrer principes musicaux §3 (seuils, amplitudes)  
5\. Retirer vumètre UI ou le reléguer debug

\#\#\# 13.5 Ordre de priorité post-fusion (produit)

1\. Fluidité navigation idées (radar, liens, \`Ctrl+P\`)  
2\. Subtilité effets musicaux (§3.3)  
3\. Polish esthétique cyberpunk (scanlines, terminal)  
4\. Features V2

\---

\#\# 14\. Revues croisées & synthèse des décisions

\#\#\# 14.1 Revue technique (Claude \+ Gemini) — Annexe A originale

| Point | Décision |  
|-------|----------|  
| cpal → wasapi | \*\*wasapi\*\* retenu V1 Windows |  
| FFT brute via IPC | \*\*Interdit\*\* ; agrégation Rust obligatoire |  
| Graphe global | \*\*Rejeté\*\* V1 ; proximité uniquement |  
| Plan prototypage | \*\*Deux branches\*\* A / B |  
| Changement device audio | \*\*Reconnexion auto\*\* requise |

\#\#\# 14.2 Intervention Gemini — mockup interactif

\*\*Apports retenus :\*\*

\- \`MOCK\_DB\` — base notes interconnectées pour prototype crédible  
\- \`Ctrl+P\` — HUD recherche  
\- Tags dynamiques  
\- Radar vivant (injection nœuds, lignes, pivot au clic)  
\- Liens \`\[\[...\]\]\` onclick

\*\*Apports filtrés / rejetés :\*\*

\- \`Alt+Espace\` \+ \`focused-deck\` → rejeté  
\- Badges raccourcis sous le mockup → prototype only  
\- Labels radar toujours visibles → hover préféré

\#\#\# 14.3 Revue ChatGPT — positionnement & musicalité

\*\*Apports intégrés :\*\*

\- Repositionnement « compagnon de concentration » vs « lecteur \+ notes \+ graphe »  
\- Distinction musical vs audio-reactive (§3)  
\- Radar comme différenciant principal  
\- 80/20 polish navigation vs effets cyberpunk  
\- Rejet vumètre permanent, glow excessif  
\- Pistes identité V2 (trace, palette étendue, pulse note modifiée)

\*\*Citation clé retenue :\*\*    
\*« Tu ne veux pas faire une app qui joue de la musique. Tu veux que la musique imprègne l'espace de travail. »\*

\#\#\# 14.4 Revue Claude — faisabilité & filtrage

\*\*Apports intégrés :\*\*

\- Faisabilité V1 réaliste 4–8 semaines (scope strict)  
\- Sous-estimation éditeur \+ persistance (1–2 sem)  
\- Latence 30–80 ms acceptable pour effets subtils  
\- Niche assumée : potentiel marché large faible, potentiel outil perso / culte niche élevé  
\- Alignement filtrage Gemini (Ctrl+P oui, Alt+Espace non)

\#\#\# 14.5 Scores indicatifs (synthèse revues — non actés comme KPI)

| Dimension | Score indicatif | Commentaire |  
|-----------|-----------------|-------------|  
| Vision / intuition | 9–9,5/10 | « Texte parcouru de musique » originale |  
| PDD & arbitrages techniques | 9–9,5/10 | Mature après Annexe A |  
| Faisabilité V1 scope-strict | 8/10 | Audio OK ; éditeur sous-estimé |  
| Design mockup actuel | 7–8,5/10 | Belle esthétique ; trop visualiseur pour promesse finale |  
| Potentiel différenciation | 8/10 | Si musicalité \+ radar |  
| Potentiel marché large | 4/10 | Niche |  
| Potentiel outil perso / culte niche | 8/10 | Bon si construit pour son propre workflow |  
| Intervention Gemini (code UX) | 7/10 | Bonnes idées à filtrer |

\---

\#\# 15\. Référence mockup UI

\#\#\# 15.1 Mockup statique (base)

\- Fichier de référence : mockup HTML initial (portrait 380×780)  
\- Toggle \`\[ NOTES \]\` / \`\[ RADAR \]\`  
\- Vumètre et glow \*\*figés\*\* en démo — en prod pilotés par bandes Rust  
\- Note exemple : \`PROTOCOLE\_REINITIALISATION\` avec liens \`\[\[WASAPI\]\]\`, \`\[\[Annexe\_A\_Pipeline\]\]\`

\#\#\# 15.2 Mockup interactif (Gemini — filtré)

\- \`MOCK\_DB\` : 5 notes (\`PROTOCOLE\_REINITIALISATION\`, \`WASAPI\`, \`Annexe\_A\_Pipeline\`, \`Tauri\_Shell\`, \`Syrex\_Nightcore\`)  
\- Fonctions : \`loadNote()\`, \`renderRadar()\`, \`toggleHUD()\`, \`setTab()\`  
\- \*\*À porter en prod sans :\*\* \`Alt+Espace\`, badges shortcuts, labels radar permanents

\#\#\# 15.3 Composants UI identifiés

| Composant | Classe / id | Rôle |  
|-----------|-------------|------|  
| Device shell | \`.device\` | Conteneur 9:16 |  
| Topbar | \`.topbar\` | Status système, indicateur réactivité |  
| Audio tier | \`.audio-tier\` | Miniature, piste, contrôles |  
| Tab switch | \`.tabswitch\` | Notes / Radar |  
| Work zone | \`.workzone\` | Éditeur ou radar |  
| HUD overlay | \`.hud-overlay\` | Recherche Ctrl+P |  
| Status bar | \`.statusbar\` | Ligne/colonne, sync |

\#\#\# 15.4 Typographies & couleurs

\- \`--mono\`: JetBrains Mono  
\- \`--term\`: Share Tech Mono  
\- \`--body\`: Inter  
\- \`--cyan\`: \#00f0ff  
\- \`--pink\`: \#ff0055 (accents crêtes / peaks)  
\- \`--bg-main\`: \#08080a

\---

\#\# 16\. Historique des révisions & traçabilité

| Version | Date | Changements |  
|---------|------|-------------|  
| PDD V1.0 (draft) | — | Document initial : vision, scope, cpal, graphe global envisagé, prototypage triptyque \+ réactivité simulée |  
| Annexe A | — | wasapi, agrégation IPC, graphe proximité, spike 2 branches, risque device audio |  
| Revue ChatGPT | — | Repositionnement produit, principes musical, rejet Alt+Espace, radar \= différenciant |  
| Revue Gemini | — | Mockup interactif, MOCK\_DB, Ctrl+P, tags, radar dynamique |  
| Revue Claude | — | Faisabilité, filtrage Gemini, scores, budget temps |  
| \*\*Superdocument V1.1\*\* | 30 juin 2025 | \*\*Fusion intégrale\*\* : amendements A intégrés dans corps du document ; §2–3 ajoutés ; §14 synthèse revues ; traçabilité rejets et anciennes décisions |  
| \*\*PIVOT V3 Notes First\*\* | 2 juil. 2025 | Document séparé `PIVOT V3 — Notes First.md` : notes hero · musique atmosphere · proximité continue · YouTube/plateformes addon · traçabilité évolution ; §17 ci-dessous |

\#\#\# 16.1 Mapping fusion Annexe A → sections principales

| Annexe A | Section superdocument |  
|----------|----------------------|  
| A.1 wasapi | §6.2 |  
| A.2 agrégation IPC | §7.2 |  
| A.3 graphe proximité | §8.4 |  
| A.4 spike 2 branches | §13 |  
| A.5 device audio | §7.4, §11 |

\#\#\# 16.2 Éléments du PDD initial préservés explicitement

\- \[x\] Vision poste compagnon second écran  
\- \[x\] Les 4 filtres de conception (différenciation, faisabilité audio, coût cross-platform, Wallpaper Engine)  
\- \[x\] Tableau périmètre V1 inclus / reporté / hors scope  
\- \[x\] Stack Tauri \+ rustfft \+ IFrame YouTube  
\- \[x\] Pipeline audio complet (buffer, FFT, bandes, emit)  
\- \[x\] Limite loopback global (§6.4, §7)  
\- \[x\] Layout zones 1/3 — 2/3  
\- \[x\] Esthétique Glitch-Decoder détaillée  
\- \[x\] Tableau risques initial \+ extension A.5  
\- \[x\] Roadmap V2+  
\- \[x\] Rejet yt-dlp / extraction non officielle  
\- \[x\] Playlist Syrex / nightcore par défaut  
\- \[x\] Estimation 3–5 jours audio (avec note 7–10 j si débutant)  
\- \[x\] Référence HTML mockups  
\- \[x\] Toutes les interventions Gemini / ChatGPT / Claude avec décisions

\---

\#\# Annexes

\#\#\# A. Glossaire

| Terme | Définition |  
|-------|------------|  
| \*\*Zettelkasten\*\* | Méthode notes reliées par liens ; ici via \`\[\[wikilinks\]\]\` |  
| \*\*Graphe de proximité\*\* | Sous-graphe note active \+ voisins 1er degré |  
| \*\*Loopback\*\* | Capture du signal audio en sortie du périphérique (mix système) |  
| \*\*WASAPI\*\* | Windows Audio Session API |  
| \*\*Musical\*\* (vs audio-reactive) | Répond au rythme et à l'énergie, pas à chaque pic FFT |  
| \*\*Knowledge Cockpit\*\* | Nom de travail pour le repositionnement produit |

\#\#\# B. Références externes

\- \[YouTube IFrame Player API\](https://developers.google.com/youtube/iframe\_api\_reference)  
\- \[Tauri\](https://tauri.app/)  
\- Crate \[wasapi\](https://crates.io/crates/wasapi) (Rust)  
\- Crate \[rustfft\](https://crates.io/crates/rustfft)  
\- Wallpaper Engine — référence comportement loopback WASAPI

\#\#\# C. Prochaine action recommandée

1\. Valider ce superdocument tel quel ou ajuster  
2\. Créer dépôt Tauri \+ structure §6.3  
3\. Lancer \*\*Branche B\*\* (spike audio CLI) en parallèle de \*\*Branche A\*\* (shell \+ mockup porté)  
4\. Ne pas intégrer \`Alt+Espace\`, vumètre permanent, ni labels radar fixes

\---

\---

\#\# 17\. Pivot V3 — Notes First (juillet 2025)

\> \*\*Document canonique du pivot :\*\* \`PIVOT V3 — Notes First.md\` — cette section résume la traçabilité ; le détail UX/roadmap vit dans ce fichier.

\#\#\# 17.1 Pourquoi une V3 alors que V1.1 disait déjà « notes = principal » ?

Le superdocument V1.1 avait le **bon pitch** (compagnon de concentration, chaîne Musique → … → Navigation) mais l'**implémentation UI** restait structurée comme un deck vidéo : zone 16:9 hero, onglets Notes | Proximité, YouTube visible par défaut.

Session pivot juil. 2025 : aligner **layout, hiérarchie visuelle et navigation** sur l'intention déjà écrite au §2.

\#\#\# 17.2 Décisions actées (résumé)

| Domaine | V1.1 (doc / impl.) | V3 (cible) |
|---------|-------------------|------------|
| Hiérarchie | Audio tier large \+ workzone | **Notes ~75–85 %** · bande ambiance repliable |
| Musique | YouTube \+ WASAPI | **WASAPI = vérité** · sources menu (YT option · plateformes backlog) · pochette toggle |
| Proximité | Onglet / toggle Radar | **Continue** (rails \+ ribbon) \+ focus \`Ctrl+Shift+G\` (grille 3×3) |
| Feel notes | Textarea \+ backdrop | Autocomplete \`\[\[\` · mode lecture · chips raison partout |
| Différenciation | Radar vivant (abandonné UI) | Proximité **explicable** tissée à l'écriture |

\#\#\# 17.3 Ce qui est préservé du V1.1

- Chaîne de valeur et principes **musical** vs audio-reactive (§3)  
- \`get_galaxy\` / scoring Rust explicable  
- WASAPI \+ agrégation bandes · rejets yt-dlp, cpal, graphe global  
- Budget 80/20 navigation \+ subtilité >> cyberpunk décoratif  
- Ctrl+P · vault local · Windows/Tauri

\#\#\# 17.4 Décision UX — « mid-sentence, que montrer ? »

Question laissée ouverte en session design. **Décision retenue pour V3 :** combinaison **rails latéraux** (top 2–3 voisins \+ raison) \+ **ribbon bas** collapsible (overflow) \+ **autocomplete \`\[\[\`** \+ **focus proximité** plein écran ponctuel — pas de popup intrusive.

\#\#\# 17.5 Roadmap implémentation

Voir \`PIVOT V3 — Notes First.md\` §9 : Phase A layout → B proximité tissée → C feel notes → D sources musique.

\---

\*Fin du superdocument — Cyber-Deck PDD V1.1 \+ trace pivot V3 §17\*

