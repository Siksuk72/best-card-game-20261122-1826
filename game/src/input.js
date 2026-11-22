// Ember Court — input.js
// Mouse is handled by the renderer (click a card, click a lantern).
// This module owns the keyboard: 1–7 select a card, Left/Right move the
// targeted lantern, Enter plays, Esc cancels, R restarts, M mutes.

export function bindKeyboard(getState, actions) {
  window.addEventListener('keydown', (event) => {
    const { state, view } = getState();
    if (!state || state.phase !== 'play' || view.showTitle) {
      if (event.key === 'Enter' && view.showTitle) actions.begin();
      return;
    }
    const hand = state.hands.sable;
    if (event.key >= '1' && event.key <= '7') {
      const index = Number(event.key) - 1;
      if (hand[index]) actions.selectCard(hand[index].id);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const dir = event.key === 'ArrowLeft' ? -1 : 1;
      actions.moveLantern(dir);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      actions.playSelected();
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      actions.cancelSelection();
      event.preventDefault();
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      actions.restart();
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      actions.toggleMute();
    }
  });
}
