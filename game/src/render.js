// Ember Court — render.js
// DOM rendering: the table, the five lanterns, both hands, the scoreboard,
// the log and the title / win / loss overlays. Cards are cream with a big
// numeral and a drawn suit glyph; every suit is told by colour AND glyph.
// Ember particles drift on a canvas behind the table.

import { LANTERNS, PLAYERS, SUIT_INFO } from './config.js';
import { kindleValue } from './rules.js';

// Inline SVG glyphs, drawn — no image files, no emoji.
export function glyphSvg(suit, size = 28) {
  const paths = {
    flame: '<path d="M12 2 C14 6 20 8 20 14 A8 8 0 1 1 4 14 C4 10 7 8 9 6 C9 9 11 10 12 11 C12 8 11 5 12 2 Z"/>',
    tide: '<path d="M2 14 Q6 8 12 14 T22 14 V18 H2 Z"/><path d="M2 19 Q6 15 12 19 T22 19" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    gale: '<path d="M12 3 A9 9 0 1 0 21 12 H18 A6 6 0 1 1 12 6 A3.5 3.5 0 1 0 15.5 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8"/>',
    stone: '<path d="M12 3 L21 19 H3 Z"/><path d="M12 3 L16 12 L12 19 L8 12 Z" fill="rgba(0,0,0,0.25)"/>',
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${paths[suit] ?? ''}</svg>`;
}

function el(tag, className, html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function cardNode(card, opts = {}) {
  const info = SUIT_INFO[card.suit];
  const node = el('div', `card suit-${card.suit}${opts.selected ? ' selected' : ''}${opts.dim ? ' dim' : ''}${opts.glow ? ' glow' : ''}`);
  node.style.setProperty('--suit', info.color);
  node.dataset.cardId = card.id;
  node.innerHTML =
    `<span class="card-corner top"><b>${card.value}</b>${glyphSvg(card.suit, 18)}</span>` +
    `<span class="card-value">${card.value}</span>` +
    `<span class="card-glyph">${glyphSvg(card.suit, 40)}</span>` +
    `<span class="card-suit">${info.name}</span>` +
    `<span class="card-corner bottom"><b>${card.value}</b>${glyphSvg(card.suit, 18)}</span>`;
  if (opts.badge) {
    const badge = el('span', 'card-badge', opts.badge);
    node.appendChild(badge);
  }
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  return node;
}

function backNode() {
  const node = el('div', 'card back');
  node.innerHTML = `<span class="card-back-glyph">${glyphSvg('flame', 34)}</span><span class="card-back-word">EMBER</span>`;
  return node;
}

function lanternNode(state, lantern, view, onLantern) {
  const wrap = el('div', `lantern-col${lantern.owner ? ` owned by-${lantern.owner}` : ''}${view.selectedLantern === lantern.id && !lantern.owner ? ' targeted' : ''}`);
  const affinity = SUIT_INFO[lantern.affinity];

  // Vesper's card sits above the lantern, Sable's below it.
  const topSlot = el('div', 'lantern-slot foe-slot');
  const foeCard = lantern.cards.vesper;
  if (foeCard) {
    const isFirst = lantern.first === 'vesper';
    topSlot.appendChild(cardNode(foeCard, { badge: `✦ ${kindleValue(foeCard, lantern, isFirst)}` }));
  }
  const bottomSlot = el('div', 'lantern-slot my-slot');
  const myCard = lantern.cards.sable;
  if (myCard) {
    const isFirst = lantern.first === 'sable';
    bottomSlot.appendChild(cardNode(myCard, { badge: `✦ ${kindleValue(myCard, lantern, isFirst)}` }));
  }

  const body = el('div', 'lantern');
  body.style.setProperty('--affinity', affinity.color);
  body.innerHTML =
    `<span class="lantern-roman">${lantern.roman}</span>` +
    `<span class="lantern-glow"></span>` +
    `<span class="lantern-affinity" title="Affinity: ${affinity.name}">${glyphSvg(lantern.affinity, 20)}</span>` +
    `<span class="lantern-value">${lantern.value} pt${lantern.value > 1 ? 's' : ''}</span>` +
    (lantern.owner ? `<span class="lantern-owner">${PLAYERS[lantern.owner].name}</span>` : '<span class="lantern-open">open</span>');
  body.addEventListener('click', () => onLantern(lantern.id));

  wrap.append(topSlot, body, bottomSlot);
  return wrap;
}

export function render(state, view, handlers) {
  const root = document.getElementById('app');
  root.dataset.phase = state.phase;
  root.dataset.turn = state.turn;

  // Scoreboard
  document.getElementById('score-sable').textContent = state.scores.sable;
  document.getElementById('score-vesper').textContent = state.scores.vesper;
  document.getElementById('turn-note').textContent =
    state.phase === 'over'
      ? state.draw
        ? 'The court is split — a draw.'
        : `${PLAYERS[state.winner].name} takes the court.`
      : state.turn === 'sable'
        ? 'Your move — play a card.'
        : 'Vesper is thinking…';

  // Vesper's hand: face-down backs, count shown.
  const foeHand = document.getElementById('foe-hand');
  foeHand.replaceChildren();
  foeHand.appendChild(el('div', 'hand-label', `Vesper · ${state.hands.vesper.length} cards`));
  const foeRow = el('div', 'hand-row foe');
  state.hands.vesper.forEach(() => foeRow.appendChild(backNode()));
  foeHand.appendChild(foeRow);

  // Lanterns
  const row = document.getElementById('lantern-row');
  row.replaceChildren();
  state.lanterns.forEach((lantern) => {
    row.appendChild(lanternNode(state, lantern, view, handlers.onLantern));
  });

  // Sable's hand: playable cards, selected one lifted.
  const myHand = document.getElementById('player-hand');
  myHand.replaceChildren();
  myHand.appendChild(el('div', 'hand-label', `Your hand · ${state.hands.sable.length} cards — click a card, then a lantern (keys 1–7, ← →, Enter)`));
  const myRow = el('div', 'hand-row mine');
  state.hands.sable.forEach((card) => {
    myRow.appendChild(
      cardNode(card, {
        selected: view.selectedCard === card.id,
        onClick: () => handlers.onCard(card.id),
      }),
    );
  });
  myHand.appendChild(myRow);

  // Log: the last three lines.
  const log = document.getElementById('log');
  log.replaceChildren();
  state.log.slice(-3).forEach((line) => log.appendChild(el('div', 'log-line', line)));

  renderOverlay(state, view, handlers);
}

function renderOverlay(state, view, handlers) {
  const overlay = document.getElementById('overlay');
  if (state.phase === 'play' && !view.showTitle) {
    overlay.classList.add('hidden');
    overlay.replaceChildren();
    return;
  }
  overlay.classList.remove('hidden');
  overlay.replaceChildren();
  if (state.phase === 'play' && view.showTitle) {
    const panel = el('div', 'panel title-panel');
    panel.innerHTML =
      '<h1>Ember Court</h1>' +
      '<p class="subtitle">Duel of the Five Lanterns</p>' +
      '<p class="versus">Sable, Keeper of the Last Lantern<br>against Vesper, the Gilded Fox</p>' +
      '<ul class="howto">' +
      '<li>36 cards — 4 suits × values 1–9. Your hand holds 7.</li>' +
      '<li>Play 1 card onto any open lantern. When both keepers have lit it, it kindles: the higher kindle value takes it.</li>' +
      '<li>Kindle value = card +2 for the lantern’s affinity suit +4 First Light for lighting it first.</li>' +
      '<li>Ties go to the brighter suit (Flame &gt; Tide &gt; Gale &gt; Stone); an exact tie burns both cards.</li>' +
      '<li>Win beside a lantern you own for a Flare (+1). First to 7 takes the court.</li>' +
      '</ul>';
    const btn = el('button', 'big-btn', 'Begin the Duel');
    btn.addEventListener('click', handlers.onBegin);
    panel.appendChild(btn);
    panel.appendChild(el('p', 'keys-hint', 'Mouse or keys: 1–7 select · ← → lantern · Enter play · Esc cancel · R restart · M mute'));
    overlay.appendChild(panel);
    return;
  }
  // Game over: win or loss (or a rare draw).
  const won = state.winner === 'sable';
  const panel = el('div', `panel end-panel ${state.draw ? 'draw' : won ? 'win' : 'loss'}`);
  panel.innerHTML =
    `<h1>${state.draw ? 'A Draw' : won ? 'The Court Is Yours' : 'Vesper Takes the Court'}</h1>` +
    `<p class="final-score">Sable ${state.scores.sable} — ${state.scores.vesper} Vesper</p>` +
    `<p class="end-note">${state.draw ? 'Every lantern burned even in the end.' : won ? 'Five lanterns, one keeper — the last light is yours.' : 'The fox outplayed you this night. Light the lanterns again.'}</p>` +
    `<p class="end-stats">${state.moves} moves · ${state.flares.sable + state.flares.vesper} flares · ${state.burned} lantern${state.burned === 1 ? '' : 's'} burned even</p>`;
  const btn = el('button', 'big-btn', 'Play Again');
  btn.addEventListener('click', handlers.onRestart);
  panel.appendChild(btn);
  overlay.appendChild(panel);
}

// ---- Ember particles -------------------------------------------------
let emberCtx = null;
let embers = [];
let emberRaf = 0;

export function startEmbers() {
  const canvas = document.getElementById('embers');
  if (!canvas) return;
  emberCtx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
  embers = Array.from({ length: 42 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 1 + Math.random() * 2.4,
    speed: 0.2 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 0.4,
    hue: 25 + Math.random() * 25,
    alpha: 0.25 + Math.random() * 0.5,
  }));
  cancelAnimationFrame(emberRaf);
  const tick = () => {
    emberCtx.clearRect(0, 0, canvas.width, canvas.height);
    for (const e of embers) {
      e.y -= e.speed;
      e.x += e.drift + Math.sin((e.y + e.r * 40) / 90) * 0.2;
      if (e.y < -6) {
        e.y = canvas.height + 6;
        e.x = Math.random() * canvas.width;
      }
      emberCtx.beginPath();
      emberCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      emberCtx.fillStyle = `hsla(${e.hue}, 90%, 62%, ${e.alpha})`;
      emberCtx.fill();
    }
    emberRaf = requestAnimationFrame(tick);
  };
  tick();
}
