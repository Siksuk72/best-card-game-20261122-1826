// Ember Court — rules.js
// The pure rules engine: match state, legal plays, kindling, flares and
// the win check. No DOM here, so the AI can clone a match and score plays
// on the copy, and the staged screenshots can build states from it.
//
// A lantern holds at most one card per keeper. When both keepers have a
// card on it, it kindles at once: the higher kindle value takes it.
//   kindle value = card value
//                + 2 if the card's suit matches the lantern's affinity
//                + 2 First Light for the keeper who lit the lantern first
// A tie on kindle value goes to the brighter suit
// (Flame > Tide > Gale > Stone). An exact tie burns both cards and the
// lantern opens again. Winning a lantern beside one you already own
// kindles a Flare (+1 point). The winner of a lantern plays first next.
// First to 7 points takes the court; otherwise the most points when all
// five lanterns are claimed.

import {
  AFFINITY_BONUS,
  FIRST_LIGHT_BONUS,
  FLARE_BONUS,
  HAND_SIZE,
  LANTERNS,
  OPPONENT,
  SUIT_BRIGHTNESS,
  TARGET_SCORE,
} from './config.js';
import { buildDeck } from './deck.js';
import { makeRng, shuffle } from './random.js';

export function kindleValue(card, lantern, isFirst) {
  let value = card.value;
  if (card.suit === lantern.affinity) value += AFFINITY_BONUS;
  if (isFirst) value += FIRST_LIGHT_BONUS;
  return value;
}

// Start a fresh match. seed drives both decks, so a seed replays a match.
export function newMatch(seed) {
  const rng = makeRng(seed);
  const decks = {
    sable: shuffle(buildDeck(), rng),
    vesper: shuffle(buildDeck(), rng),
  };
  const state = {
    seed,
    phase: 'play',
    turn: 'sable',
    moves: 0,
    scores: { sable: 0, vesper: 0 },
    flares: { sable: 0, vesper: 0 },
    burned: 0,
    winner: null,
    draw: false,
    hands: { sable: [], vesper: [] },
    decks,
    lanterns: LANTERNS.map((l) => ({
      id: l.id,
      roman: l.roman,
      value: l.value,
      affinity: l.affinity,
      owner: null,
      first: null,
      cards: { sable: null, vesper: null },
    })),
    log: [],
  };
  for (const who of ['sable', 'vesper']) {
    for (let i = 0; i < HAND_SIZE; i += 1) {
      const card = state.decks[who].pop();
      if (card) state.hands[who].push(card);
    }
  }
  return state;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// Lanterns this keeper may play on: unclaimed, and holding no card of theirs.
export function legalLanterns(state, who) {
  const out = [];
  state.lanterns.forEach((lantern, i) => {
    if (!lantern.owner && !lantern.cards[who]) out.push(i);
  });
  return out;
}

// Every legal (card, lantern) pair for a keeper.
export function legalMoves(state, who) {
  const moves = [];
  for (const lantern of legalLanterns(state, who)) {
    for (const card of state.hands[who]) moves.push({ cardId: card.id, lantern });
  }
  return moves;
}

// A keeper with no legal lantern passes; returns true when they passed.
export function passIfStuck(state, who) {
  if (legalLanterns(state, who).length > 0) return false;
  state.log.push(`${who} has nowhere to light and passes.`);
  state.turn = OPPONENT[who];
  return true;
}

function neighbourOwned(state, who, index) {
  for (const n of [index - 1, index + 1]) {
    if (n >= 0 && n < state.lanterns.length && state.lanterns[n].owner === who) return true;
  }
  return false;
}

function checkOver(state) {
  if (state.scores.sable >= TARGET_SCORE || state.scores.vesper >= TARGET_SCORE) {
    state.phase = 'over';
    state.winner = state.scores.sable > state.scores.vesper ? 'sable' : 'vesper';
    return;
  }
  if (state.lanterns.every((l) => l.owner)) {
    state.phase = 'over';
    if (state.scores.sable === state.scores.vesper) {
      state.draw = true;
      state.winner = null;
    } else {
      state.winner = state.scores.sable > state.scores.vesper ? 'sable' : 'vesper';
    }
  }
}

// Play one card. Returns { ok, events[] } — events describe what happened
// so the renderer and the sound can answer each one.
export function playCard(state, who, cardId, lanternIndex) {
  const events = [];
  if (state.phase !== 'play') return { ok: false, events, error: 'match is over' };
  if (state.turn !== who) return { ok: false, events, error: 'not your turn' };
  const lantern = state.lanterns[lanternIndex];
  if (!lantern || lantern.owner) return { ok: false, events, error: 'lantern is claimed' };
  if (lantern.cards[who]) return { ok: false, events, error: 'you already lit this lantern' };
  const handIndex = state.hands[who].findIndex((c) => c.id === cardId);
  if (handIndex === -1) return { ok: false, events, error: 'card not in hand' };

  const card = state.hands[who].splice(handIndex, 1)[0];
  if (lantern.first === null) lantern.first = who;
  lantern.cards[who] = card;
  state.moves += 1;
  events.push({ type: 'play', who, card, lantern: lanternIndex });

  // Refill the hand from the keeper's own deck.
  const drawn = state.decks[who].pop();
  if (drawn) state.hands[who].push(drawn);

  const foe = OPPONENT[who];
  const foeCard = lantern.cards[foe];
  if (!foeCard) {
    // Lantern still waiting for the other keeper: turn passes over.
    state.turn = foe;
    return { ok: true, events };
  }

  // Both keepers lit it: the lantern kindles now.
  const mine = kindleValue(card, lantern, lantern.first === who);
  const theirs = kindleValue(foeCard, lantern, lantern.first === foe);
  events.push({ type: 'kindle', lantern: lanternIndex, mine, theirs });
  let winner = null;
  if (mine !== theirs) {
    winner = mine > theirs ? who : foe;
  } else if (SUIT_BRIGHTNESS[card.suit] !== SUIT_BRIGHTNESS[foeCard.suit]) {
    winner = SUIT_BRIGHTNESS[card.suit] > SUIT_BRIGHTNESS[foeCard.suit] ? who : foe;
  }
  if (!winner) {
    // An exact tie: both cards burn and the lantern opens again.
    lantern.cards = { sable: null, vesper: null };
    lantern.first = null;
    state.burned += 1;
    state.log.push(`Lantern ${lantern.roman} burns even — both cards turn to ash.`);
    events.push({ type: 'burn', lantern: lanternIndex });
    state.turn = foe;
    return { ok: true, events };
  }

  lantern.owner = winner;
  lantern.cards = { sable: null, vesper: null };
  state.scores[winner] += lantern.value;
  events.push({ type: 'claim', who: winner, lantern: lanternIndex, points: lantern.value });
  state.log.push(`${winner} takes Lantern ${lantern.roman} (+${lantern.value}).`);
  if (neighbourOwned(state, winner, lanternIndex)) {
    state.scores[winner] += FLARE_BONUS;
    state.flares[winner] += 1;
    events.push({ type: 'flare', who: winner, lantern: lanternIndex, points: FLARE_BONUS });
    state.log.push(`Flare! A neighbouring lantern catches (+${FLARE_BONUS}).`);
  }
  // The winner lights the next lantern first.
  state.turn = winner;
  checkOver(state);
  if (state.phase === 'over') {
    events.push({ type: 'over', winner: state.winner, draw: state.draw });
  }
  return { ok: true, events };
}

export function scoreLine(state) {
  return `${state.scores.sable} – ${state.scores.vesper}`;
}
