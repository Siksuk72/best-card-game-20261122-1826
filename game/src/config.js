// Ember Court — Duel of the Five Lanterns
// config.js — the shared constants: suits, lanterns, colours, glyphs, tuning.
// Every suit is told by colour AND by a drawn glyph, so the game never
// relies on colour alone.

export const SUITS = ['flame', 'tide', 'gale', 'stone'];

export const SUIT_INFO = {
  flame: { name: 'Flame', color: '#e4572e', glow: '#ff9a3d', bright: 4, glyph: 'flame' },
  tide: { name: 'Tide', color: '#3a86c8', glow: '#7cc4ff', bright: 3, glyph: 'tide' },
  gale: { name: 'Gale', color: '#5da271', glow: '#9fe6b0', bright: 2, glyph: 'gale' },
  stone: { name: 'Stone', color: '#a08a6d', glow: '#d8c49a', bright: 1, glyph: 'stone' },
};

// Brighter suit wins a kindle-value tie. Flame is brightest, Stone dimmest.
export const SUIT_BRIGHTNESS = { flame: 4, tide: 3, gale: 2, stone: 1 };

// The five lanterns, left to right. Value is the points the lantern is worth;
// affinity is the suit that earns +2 kindle value on it.
export const LANTERNS = [
  { id: 0, roman: 'I', value: 1, affinity: 'flame' },
  { id: 1, roman: 'II', value: 2, affinity: 'tide' },
  { id: 2, roman: 'III', value: 3, affinity: 'gale' },
  { id: 3, roman: 'IV', value: 2, affinity: 'stone' },
  { id: 4, roman: 'V', value: 1, affinity: 'flame' },
];

export const TARGET_SCORE = 7; // first to 7 takes the court
export const HAND_SIZE = 7; // cards in hand at the start of your turn
export const DECK_SIZE = 36; // 4 suits x values 1..9, one deck per keeper
export const AFFINITY_BONUS = 2; // kindle value when suit matches the lantern
export const FIRST_LIGHT_BONUS = 4; // kindle value for lighting a lantern first —
// the keeper who lights first shows their card, so the other keeper
// answers with full knowledge; +4 keeps the lead worth taking
export const FLARE_BONUS = 1; // points for winning beside a lantern you own

export const PLAYERS = {
  sable: { id: 'sable', name: 'Sable', title: 'Keeper of the Last Lantern', color: '#f2c14e', ring: '#f2c14e' },
  vesper: { id: 'vesper', name: 'Vesper', title: 'the Gilded Fox', color: '#c77dff', ring: '#c77dff' },
};

export const OPPONENT = { sable: 'vesper', vesper: 'sable' };
