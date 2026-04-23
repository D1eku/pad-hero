import type { GameState } from '../game/state';
import { progressPercent } from '../game/progress';
import type { Step } from '../types';
import type { GameViewCallbacks, GameViewHandle } from './view';
import { padColor } from './view';
import { createSynthPanel } from './synth-panel';
import { config } from '../config';

const VISIBLE_SLOTS = 5;
const SLOT_HEIGHT = 120;
const TRANSITION_MS = 220;

function createTile(step: Step): HTMLElement {
  const tile = document.createElement('div');
  tile.className = 'falling-tile';
  tile.style.backgroundColor = padColor(step.pad);
  tile.style.transform = `translateY(-${(VISIBLE_SLOTS + 1) * SLOT_HEIGHT}px)`;

  const num = document.createElement('div');
  num.className = 'fall-num';
  num.textContent = `PAD ${step.pad + 1}`;
  tile.appendChild(num);

  const note = document.createElement('div');
  note.className = 'fall-note';
  note.textContent = step.noteName;
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
  container.className = 'view view-game-falling';

  const header = document.createElement('div');
  header.className = 'game-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'game-song-title';
  titleEl.textContent = state.songName;
  titleEl.title = state.songName;
  header.appendChild(titleEl);

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

  const synthPanel = createSynthPanel(config.synth, cb.onSynth);
  container.appendChild(synthPanel.element);

  const streakPanel = document.createElement('div');
  streakPanel.className = 'streak-panel';
  const streakFire = document.createElement('div');
  streakFire.className = 'streak-panel-fire';
  streakFire.textContent = '🔥';
  const streakCount = document.createElement('div');
  streakCount.className = 'streak-panel-count';
  streakCount.textContent = '0';
  const streakMaxWrap = document.createElement('div');
  streakMaxWrap.className = 'streak-panel-max';
  streakMaxWrap.innerHTML = 'max <span class="streak-panel-max-value">0</span>';
  const streakMax = streakMaxWrap.querySelector<HTMLElement>('.streak-panel-max-value')!;
  streakPanel.appendChild(streakFire);
  streakPanel.appendChild(streakCount);
  streakPanel.appendChild(streakMaxWrap);
  container.appendChild(streakPanel);

  const fallingArea = document.createElement('div');
  fallingArea.className = 'falling-area';
  const lanesEl = document.createElement('div');
  lanesEl.className = 'lanes';
  for (let i = 0; i < 4; i++) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.dataset.pad = String(i);
    lanesEl.appendChild(lane);
  }
  fallingArea.appendChild(lanesEl);
  container.appendChild(fallingArea);

  const padsEl = document.createElement('div');
  padsEl.className = 'pads pads-falling';
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

  const tiles = new Map<number, HTMLElement>();

  function positionTile(tile: HTMLElement, slot: number) {
    tile.style.transform = `translateY(-${slot * SLOT_HEIGHT}px)`;
  }

  function layout() {
    for (const [stepIdx, el] of [...tiles.entries()]) {
      if (stepIdx < state.stepIndex) {
        el.classList.add('tile-hit');
        tiles.delete(stepIdx);
        setTimeout(() => el.remove(), TRANSITION_MS + 50);
      } else if (stepIdx >= state.stepIndex + VISIBLE_SLOTS) {
        el.remove();
        tiles.delete(stepIdx);
      }
    }

    for (let slot = 0; slot < VISIBLE_SLOTS; slot++) {
      const idx = state.stepIndex + slot;
      if (idx >= state.steps.length) break;
      const step = state.steps[idx];

      let tile = tiles.get(idx);
      if (!tile) {
        tile = createTile(step);
        const lane = lanesEl.querySelector<HTMLElement>(`.lane[data-pad="${step.pad}"]`);
        if (!lane) continue;
        lane.appendChild(tile);
        tiles.set(idx, tile);
        void tile.offsetHeight;
        positionTile(tile, slot);
      } else {
        positionTile(tile, slot);
      }
      tile.classList.toggle('tile-current', slot === 0);
    }
  }

  function update() {
    const pct = progressPercent(state);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${Math.round(pct)}%`;
    streakCount.textContent = String(state.streak);
    streakMax.textContent = String(state.maxStreak);
    layout();
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

  function showMilestone(message: string) {
    overlayEl.classList.remove('hidden', 'miss', 'pause');
    overlayEl.textContent = message;
    overlayEl.classList.add('celebrate');
    setTimeout(() => {
      overlayEl.classList.add('hidden');
      overlayEl.classList.remove('celebrate');
    }, 1200);
  }

  update();

  return { update, flashPad, showMiss, showPaused, showMilestone };
}
