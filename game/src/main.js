// Ember Court — main.js
// The game controller: owns the match state and the selection, answers
// clicks and keys, lets Vesper answer after a short thinking pause, and
// re-renders after every move. Staged shots (?shot=…) render a fixed
// state instead of a live match.

import { LANTERNS } from './config.js';
import { vesperMove } from './ai.js';
import { bindKeyboard } from './input.js';
import { newMatch, passIfStuck, playCard } from './rules.js';
import { makeRng, randomSeed } from './random.js';
import { render, startEmbers } from './render.js';
import { exposeDebug, stagedState } from './shots.js';
import { sfx, toggleMute } from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? randomSeed()) >>> 0 || 1;

let state;
let view;
let rng;
let vesperTimer = 0;

function freshView(showTitle) {
  return { selectedCard: null, selectedLantern: null, showTitle };
}

function newGame(showTitle = false) {
  clearTimeout(vesperTimer);
  rng = makeRng(randomSeed());
  state = newMatch(randomSeed());
  state.log.push('The lanterns are lit. Sable, you lead.');
  view = freshView(showTitle);
  draw();
}

function draw() {
  render(state, view, {
    onCard: selectCard,
    onLantern: playOnLantern,
    onBegin: () => {
      view.showTitle = false;
      sfx.play();
      draw();
    },
    onRestart: () => newGame(false),
  });
  exposeDebug(state);
}

function selectCard(cardId) {
  if (state.phase !== 'play' || view.showTitle) return;
  view.selectedCard = view.selectedCard === cardId ? null : cardId;
  if (view.selectedCard && view.selectedLantern === null) {
    view.selectedLantern = state.lanterns.findIndex((l) => !l.owner && !l.cards.sable);
  }
  sfx.select();
  draw();
}

function playOnLantern(lanternIndex) {
  if (state.phase !== 'play' || view.showTitle) return;
  if (!view.selectedCard) {
    view.selectedLantern = lanternIndex;
    draw();
    return;
  }
  const result = playCard(state, 'sable', view.selectedCard, lanternIndex);
  if (!result.ok) {
    state.log.push(result.error ?? 'That play is not allowed.');
    draw();
    return;
  }
  view.selectedCard = null;
  view.selectedLantern = null;
  answerEvents(result.events);
  draw();
  scheduleVesper();
}

function answerEvents(events) {
  for (const event of events) {
    if (event.type === 'play') sfx.play();
    if (event.type === 'kindle') sfx.kindle();
    if (event.type === 'burn') sfx.burn();
    if (event.type === 'flare') sfx.flare();
    if (event.type === 'over') {
      if (event.draw) sfx.lose();
      else if (event.winner === 'sable') sfx.win();
      else sfx.lose();
    }
  }
}

function scheduleVesper() {
  clearTimeout(vesperTimer);
  if (state.phase !== 'play') return;
  if (state.turn !== 'vesper') return;
  vesperTimer = setTimeout(() => {
    if (state.phase !== 'play' || state.turn !== 'vesper') return;
    if (passIfStuck(state, 'vesper')) {
      draw();
      return;
    }
    const move = vesperMove(state, rng);
    if (!move) {
      draw();
      return;
    }
    const result = playCard(state, 'vesper', move.cardId, move.lantern);
    if (result.ok) answerEvents(result.events);
    draw();
    // The winner of a lantern leads: Vesper may move twice in a row.
    if (state.phase === 'play' && state.turn === 'vesper') scheduleVesper();
  }, 650);
}

const actions = {
  begin() {
    view.showTitle = false;
    draw();
  },
  selectCard,
  moveLantern(dir) {
    const open = LANTERNS.map((l, i) => i).filter((i) => !state.lanterns[i].owner && !state.lanterns[i].cards.sable);
    if (open.length === 0) return;
    let at = open.indexOf(view.selectedLantern);
    at = at === -1 ? 0 : (at + dir + open.length) % open.length;
    view.selectedLantern = open[at];
    draw();
  },
  playSelected() {
    if (view.selectedCard !== null && view.selectedLantern !== null) {
      playOnLantern(view.selectedLantern);
    }
  },
  cancelSelection() {
    view.selectedCard = null;
    view.selectedLantern = null;
    draw();
  },
  restart() {
    newGame(false);
  },
  toggleMute() {
    const muted = toggleMute();
    const btn = document.getElementById('btn-mute');
    if (btn) btn.textContent = muted ? 'Sound: off' : 'Sound: on';
    state.log.push(muted ? 'Sound muted.' : 'Sound on.');
    draw();
  },
};

function boot() {
  startEmbers();
  if (shot) {
    // A staged frame: no live play, no AI timer — just the state.
    rng = makeRng(seed);
    const staged = stagedState(shot, seed);
    state = staged.state;
    view = freshView(staged.showTitle);
    draw();
    return;
  }
  newGame(true);
  bindKeyboard(() => ({ state, view }), actions);
  document.getElementById('btn-restart').addEventListener('click', () => newGame(false));
  document.getElementById('btn-mute').addEventListener('click', () => actions.toggleMute());
}

document.addEventListener('DOMContentLoaded', boot);
