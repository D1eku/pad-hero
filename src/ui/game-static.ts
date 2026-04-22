import type { GameState } from '../game/state';
import { currentStep, upcomingSteps } from '../game/state';
import { progressPercent } from '../game/progress';
import type { GameViewCallbacks, GameViewHandle } from './view';
import { padColor } from './view';

function makeTile(padIdx: number, noteName: string, big: boolean): HTMLElement {
  const tile = document.createElement('div');
  tile.className = big ? 'tile tile-current' : 'tile tile-next';
  tile.style.backgroundColor = padColor(padIdx);

  const padNum = document.createElement('div');
  padNum.className = 'pad-num';
  padNum.textContent = `PAD ${padIdx + 1}`;

  const note = document.createElement('div');
  note.className = 'note-name';
  note.textContent = noteName;

  tile.appendChild(padNum);
  tile.appendChild(note);
  return tile;
}

export function startView(
  root: HTMLElement,
  state: GameState,
  cb: GameViewCallbacks,
): GameViewHandle {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-game';

  const header = document.createElement('div');
  header.className = 'game-header';

  const progressWrap = document.createElement('div');
  progressWrap.className = 'progress-bar';
  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressWrap.appendChild(progressFill);
  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.textContent = '0%';
  header.appendChild(progressWrap);
  header.appendChild(progressText);

  const controls = document.createElement('div');
  controls.className = 'controls';
  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = 'Pausa';
  pauseBtn.onclick = cb.onPause;
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Reiniciar';
  restartBtn.onclick = cb.onRestart;
  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'Salir';
  exitBtn.onclick = cb.onExit;
  controls.appendChild(pauseBtn);
  controls.appendChild(restartBtn);
  controls.appendChild(exitBtn);
  header.appendChild(controls);

  container.appendChild(header);

  const tilesEl = document.createElement('div');
  tilesEl.className = 'tiles';
  container.appendChild(tilesEl);

  const padsEl = document.createElement('div');
  padsEl.className = 'pads';
  for (let i = 0; i < 4; i++) {
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.style.backgroundColor = padColor(i);
    pad.textContent = String(i + 1);
    pad.dataset.index = String(i);
    padsEl.appendChild(pad);
  }
  container.appendChild(padsEl);

  const overlayEl = document.createElement('div');
  overlayEl.className = 'overlay hidden';
  container.appendChild(overlayEl);

  root.appendChild(container);

  function update() {
    const pct = progressPercent(state);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${Math.round(pct)}%`;

    tilesEl.innerHTML = '';
    const cur = currentStep(state);
    if (cur) tilesEl.appendChild(makeTile(cur.pad, cur.noteName, true));
    for (const step of upcomingSteps(state, 3)) {
      tilesEl.appendChild(makeTile(step.pad, step.noteName, false));
    }
  }

  function flashPad(padIndex: number) {
    const pad = padsEl.querySelector<HTMLElement>(`.pad[data-index="${padIndex}"]`);
    if (!pad) return;
    pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 150);
  }

  function showMiss() {
    overlayEl.classList.remove('hidden', 'pause');
    overlayEl.textContent = 'X';
    overlayEl.classList.add('miss');
    setTimeout(() => {
      overlayEl.classList.add('hidden');
      overlayEl.classList.remove('miss');
    }, 900);
  }

  function showPaused(paused: boolean) {
    if (paused) {
      overlayEl.classList.remove('hidden', 'miss');
      overlayEl.textContent = 'PAUSA';
      overlayEl.classList.add('pause');
      pauseBtn.textContent = 'Reanudar';
    } else {
      overlayEl.classList.add('hidden');
      overlayEl.classList.remove('pause');
      pauseBtn.textContent = 'Pausa';
    }
  }

  update();

  return { update, flashPad, showMiss, showPaused };
}
