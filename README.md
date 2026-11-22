# Ember Court — Duel of the Five Lanterns

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Siksuk72/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Siksuk72/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A midnight lantern-festival card duel for
[make.fun](https://make.fun/bounty/best-card-game-20261122-1826):
**Sable, Keeper of the Last Lantern**, against **Vesper, the Gilded Fox**,
across five paper lanterns. First to 7 points takes the court.

## How it plays

- **36 cards** — 4 suits (Flame, Tide, Gale, Stone) × values 1–9. Each keeper
  shuffles their own deck and holds a **7-card hand**, refilled after every play.
- **5 lanterns** worth 1 / 2 / 3 / 2 / 1 points, each with an affinity suit.
- Each turn, play 1 card onto any open lantern on your side. When a lantern
  holds both keepers' cards it **kindles**: the higher kindle value takes it.
- **Kindle value** = card value +2 if its suit matches the lantern's affinity
  +4 **First Light** for the keeper who lit the lantern first.
- Ties go to the **brighter suit** (Flame > Tide > Gale > Stone); an exact tie
  **burns both cards** and the lantern opens again.
- Winning a lantern beside one you already own kindles a **Flare (+1)**.
  The winner of a lantern lights the next one first.
- **First to 7** takes the court; otherwise the most points when all five
  lanterns are claimed.

Vesper scores every legal play on a cloned match — lantern value, flare,
card economy with an overkill penalty, flare denial and affinity — and takes
the best. A careless picker exists beside her for the staged loss frame.

## Controls

Mouse, or keyboard: **1–7** select a card, **← →** choose a lantern,
**Enter** play, **Esc** cancel, **R** restart, **M** mute.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

Staged frames for the screenshots: `?shot=title|play|win|loss&seed=1`
(see `shots.json`). All art is drawn in code (SVG glyphs, CSS lanterns)
and all sounds are synthesised WebAudio — no downloaded assets, no network
requests; the game is plain static files under `game/`.

## Files

- `game/index.html` — the table, scoreboard and styles
- `game/src/config.js` — suits, lanterns, tuning
- `game/src/rules.js` — the pure rules engine (match, kindling, flares)
- `game/src/ai.js` — Vesper's scoring AI and the careless picker
- `game/src/render.js` — DOM rendering and ember particles
- `game/src/input.js` — keyboard controls
- `game/src/shots.js` — staged screenshot states from the real rules
- `game/src/sound.js` — synthesised WebAudio effects
- `game/src/deck.js`, `game/src/random.js` — decks and the seeded RNG
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes the dossier)
- `vendor/makefun-game.ts` — the kit's library, unchanged

MIT licensed. Original work: no existing commercial game is copied.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hz26ha21&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
