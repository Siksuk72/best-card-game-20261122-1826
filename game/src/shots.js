// Ember Court — shots.js
// Staged frames for the screenshots (?shot=…&seed=…): deterministic states
// built from the real rules with fixed seeds, never hand-drawn.
//   title — the title screen over a fresh table
//   play  — mid-game: score 2–0, one lantern claimed, both hands visible
//   win   — the end screen, Sable 7–4
//   loss  — the end screen, Sable 0–10 (Vesper ran away with the flares)
//
// The staging plays real moves: a seeded match, Sable and Vesper taking
// turns with the careless picker for Vesper and a greedy picker for Sable,
// until the wanted shape appears. If the shape never appears within the
// move budget, the state falls back to the closest mid-game position.
//
// For the end screens the strong side plays its best (scorePlay on a
// clone) and the weak side plays carelessly, over many seeds, until the
// wanted winner reaches 7 — a real finished match, never a hand-shaped one.

import { LANTERNS } from './config.js';
import { carelessMove, scorePlay } from './ai.js';
import { cloneState, legalMoves, newMatch, passIfStuck, playCard } from './rules.js';
import { makeRng } from './random.js';

// The best-scoring legal play for either keeper (Vesper's eye, either way).
function bestMove(state, who, rng) {
  const moves = legalMoves(state, who);
  if (moves.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = scorePlay(state, who, move) + rng() * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

// Play a whole match: `strong` plays best, `weak` plays carelessly.
function playFullMatch(seed, strong) {
  const rng = makeRng(seed);
  const state = newMatch(seed);
  for (let i = 0; i < 120 && state.phase === 'play'; i += 1) {
    const who = state.turn;
    if (passIfStuck(state, who)) continue;
    const move = who === strong ? bestMove(state, who, rng) : carelessMove(state, rng);
    if (!move) break;
    playCard(state, who, move.cardId, move.lantern);
  }
  return state;
}

function greedyMove(state, who, rng) {
  const moves = legalMoves(state, who);
  if (moves.length === 0) return null;
  // Favour big lanterns and big cards, with a little jitter.
  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const card = state.hands[who].find((c) => c.id === move.cardId);
    const score = LANTERNS[move.lantern].value * 2 + card.value + rng() * 2;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function runUntil(state, rng, stop, maxMoves = 60) {
  for (let i = 0; i < maxMoves && state.phase === 'play'; i += 1) {
    if (stop(state)) return true;
    const who = state.turn;
    const move = who === 'sable' ? greedyMove(state, who, rng) : carelessMove(state, rng);
    if (!move) break;
    playCard(state, who, move.cardId, move.lantern);
  }
  return stop(state);
}

export function stagedState(shot, seed) {
  const rng = makeRng(seed);
  if (shot === 'title') {
    return { state: newMatch(seed), showTitle: true };
  }
  if (shot === 'play') {
    const state = newMatch(seed);
    runUntil(state, rng, (s) => s.lanterns.some((l) => l.owner) && s.scores.sable >= 2);
    // If the greedy line never gave Sable 2, accept any claimed lantern.
    if (!state.lanterns.some((l) => l.owner)) {
      runUntil(state, rng, (s) => s.lanterns.some((l) => l.owner));
    }
    return { state, showTitle: false };
  }
  if (shot === 'win') {
    let fallback = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const trial = playFullMatch(seed + attempt * 101, 'sable');
      if (trial.phase === 'over' && trial.winner === 'sable') {
        fallback = trial;
        if (trial.scores.sable >= 7) return { state: trial, showTitle: false };
      }
    }
    return { state: fallback ?? playFullMatch(seed + 999, 'sable'), showTitle: false };
  }
  if (shot === 'loss') {
    let fallback = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const trial = playFullMatch(seed + attempt * 77 + 5, 'vesper');
      if (trial.phase === 'over' && trial.winner === 'vesper') {
        fallback = trial;
        if (trial.scores.vesper >= 7) return { state: trial, showTitle: false };
      }
    }
    return { state: fallback ?? playFullMatch(seed + 555, 'vesper'), showTitle: false };
  }
  return { state: newMatch(seed), showTitle: true };
}

// A debug handle, only with ?debug=1, for play-testing in the browser.
export function exposeDebug(state) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    window.__ember = { state, cloneState };
  }
}
