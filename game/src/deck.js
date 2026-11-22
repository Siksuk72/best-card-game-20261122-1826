// Ember Court — deck.js
// A keeper's deck: 36 cards, 4 suits x values 1..9. Each keeper shuffles
// their own deck; hands are drawn from it and refilled after every play
// until the deck runs out.

import { SUITS } from './config.js';
import { shuffle } from './random.js';

// Build one fresh 36-card deck. A card is { suit, value, id }.
export function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 9; value += 1) {
      deck.push({ suit, value, id: `${suit}-${value}` });
    }
  }
  return deck;
}

// A shuffled deck plus a draw pile API the rules engine uses.
export function makeDrawPile(rng) {
  const cards = shuffle(buildDeck(), rng);
  return {
    size() {
      return cards.length;
    },
    draw() {
      return cards.pop() ?? null;
    },
    // Draw up to n cards (fewer when the pile is empty).
    drawMany(n) {
      const out = [];
      for (let i = 0; i < n && cards.length > 0; i += 1) out.push(cards.pop());
      return out;
    },
  };
}
