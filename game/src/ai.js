// Ember Court — ai.js
// Vesper, the Gilded Fox: she scores every legal play on a cloned match
// and takes the best. A careless picker sits beside her for the staged
// loss shot and for players who want an easy game.
//
// Vesper's eye, per candidate play (on the clone, after the play resolves):
//   + lantern value x3 when the play claims a lantern for her
//   + flare bonus x3 when it kindles a flare
//   + affinity +2 when her card's suit matches the lantern
//   + small credit for lighting a lantern first (First Light is worth 2)
//   - overkill: spending a big card to win a small lantern by a wide
//     margin wastes strength she could use later
//   - denial: letting Sable claim the lantern next is costly, so a play
//     that leaves a lantern half-lit in Sable's favour scores lower
//   - card economy: a 9 spent where a 5 would do is a wasted 9

import { AFFINITY_BONUS, FLARE_BONUS } from './config.js';
import { cloneState, kindleValue, legalMoves, playCard } from './rules.js';
import { pick } from './random.js';

function flareWouldFollow(state, who, index) {
  for (const n of [index - 1, index + 1]) {
    if (n >= 0 && n < state.lanterns.length && state.lanterns[n].owner === who) return true;
  }
  return false;
}

export function scorePlay(state, who, move) {
  const lantern = state.lanterns[move.lantern];
  const card = state.hands[who].find((c) => c.id === move.cardId);
  if (!card || !lantern) return -1e9;
  let score = 0;
  if (card.suit === lantern.affinity) score += AFFINITY_BONUS;
  if (lantern.first === null) score += 1.5; // First Light is worth having

  const clone = cloneState(state);
  const result = playCard(clone, who, move.cardId, move.lantern);
  if (!result.ok) return -1e9;

  for (const event of result.events) {
    if (event.type === 'claim' && event.who === who) {
      score += event.points * 3;
      if (flareWouldFollow(state, who, move.lantern)) score += FLARE_BONUS * 3;
    }
    if (event.type === 'claim' && event.who !== who) score -= event.points * 3;
    if (event.type === 'burn') score -= 2; // burning a good card hurts
  }

  // Overkill: winning by far more than needed wastes a strong card.
  const foe = who === 'sable' ? 'vesper' : 'sable';
  const foeCard = lantern.cards[foe];
  if (foeCard) {
    const mine = kindleValue(card, lantern, lantern.first === null || lantern.first === who);
    const theirs = kindleValue(foeCard, lantern, lantern.first === foe);
    const margin = mine - theirs;
    if (margin > 0) score -= Math.max(0, margin - 2) * 0.6; // a close win is a thrifty win
    if (margin < 0) score -= 4; // losing the kindle outright
    // Leaving a lantern half-lit where Sable's card already waits is risky:
    // he may answer with exactly the card that takes it.
    if (margin < 0) score -= Math.abs(margin) * 0.4;
  } else {
    // Lighting a fresh lantern: don't throw a 9 at a 1-point lantern
    // when a small card would hold it just as well.
    if (lantern.value === 1 && card.value >= 8) score -= 2;
    if (lantern.value === 3 && card.value <= 2) score -= 1; // too weak for the big one
  }

  // Card economy: high cards are dear; prefer the smallest card that
  // does the job, all else being equal.
  score -= card.value * 0.12;
  return score;
}

// Vesper's move: the best-scoring legal play, or null when she must pass.
export function vesperMove(state, rng) {
  const moves = legalMoves(state, 'vesper');
  if (moves.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  // A little fox-like jitter so two identical positions do not always
  // play identically; the jitter is far smaller than a lantern's value.
  for (const move of moves) {
    const score = scorePlay(state, 'vesper', move) + rng() * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

// The careless picker: any legal play, at random. Used for the staged
// loss screenshot and as the easy opponent.
export function carelessMove(state, rng) {
  const moves = legalMoves(state, 'vesper');
  if (moves.length === 0) return null;
  return pick(moves, rng);
}
