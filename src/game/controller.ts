import type { GameState } from './state';
import { currentStep } from './state';
import { playNote } from '../audio';
import { config } from '../config';

export type GameEvent =
  | { type: 'advance' }
  | { type: 'miss' }
  | { type: 'completed' };

export function onPadHit(
  state: GameState,
  padIndex: number,
  emit: (e: GameEvent) => void
): void {
  if (state.paused || state.completed || state.locked) return;

  const step = currentStep(state);
  if (!step) return;

  if (step.pad === padIndex) {
    playNote(step.noteName, step.duration);
    state.stepIndex += 1;
    if (state.stepIndex >= state.steps.length) {
      state.completed = true;
      emit({ type: 'completed' });
    } else {
      emit({ type: 'advance' });
    }
  } else {
    state.locked = true;
    emit({ type: 'miss' });
    setTimeout(() => {
      state.locked = false;
    }, config.mistakeLockMs);
  }
}

export function restart(state: GameState): void {
  state.stepIndex = 0;
  state.locked = false;
  state.completed = false;
  state.paused = false;
}
