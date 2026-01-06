# JavaScript DOM Games — Source Code

This repository contains **100+ JavaScript DOM mini‑games** designed to teach frontend JavaScript through hands‑on practice.

## How to run
No build tools required.

1. Open `index.html` in your browser.
2. Click any game to launch it.

> Tip: For the best experience, run a tiny local server (optional):
> - VS Code: install **Live Server**
> - Or: `python3 -m http.server` then open `http://localhost:8000`

## Structure
- `/games/game-001` … `/games/game-100` — standalone HTML games (each folder has one `index.html`)
- `/capstone/game-101-neon-drift` — multi-file capstone (HTML/CSS/JS)

## Accessibility
Most games support keyboard interaction where it makes sense. The capstone includes reduced‑motion support and ARIA live announcements.

## Author
Laurence “Lars” Svekis


## Compound Puzzle Packs (merged mini-games)

For learners who prefer bundled progression, open:

- `compound-packs/pack-01/` (Games 001–004)
- `compound-packs/pack-02/` (Games 005–008)
- `compound-packs/pack-03/` (Games 009–012)
- `compound-packs/pack-04/` (Games 013–016)
- `compound-packs/pack-05/` (Games 017–020)

Each pack uses tabs to switch between the included games.

## Game Shell UI (labels, differences, variants)

Every game now includes a lightweight “Game Shell” header that adds:

- **New concept label** (what this game teaches)
- **“What’s different from last game?”** callout
- **Optional challenge variants** (ideas to extend the game)
- **Player options** toggles (High Contrast, Reduced Motion, Bigger Text)
- **Prev/Next navigation**

The shell is powered by shared files in `assets/`:

- `assets/themes.css` (theme reskins + accessibility toggles)
- `assets/shell.css` (shell UI styling)
- `assets/shell.js` (injects the shell from per-game metadata)

Each game includes a small JSON block (embedded in the HTML) that looks like:

- number, title
- concept label
- whatsDifferent
- challengeVariants
- theme group

## Theme reskins

Games are grouped into theme “seasons” (all driven by CSS variables so the games keep their original layout but look distinct):

- Games 001–020: Neon
- Games 021–040: Retro
- Games 041–060: Minimal
- Games 061–080: Arcade
- Games 081–100: Sunset
