import type { GameState } from './state';
import { currentStep } from './state';
import { playNote } from '../audio';
import { config } from '../config';

export type GameEvent =
  | { type: 'advance' }
  | { type: 'miss' }
  | { type: 'completed' }
  | { type: 'milestone'; streak: number; message: string };

const MILESTONE_MESSAGES: Record<number, string> = {
  25: '¡NICE! 🔥',
  100: '¡EN FUEGO! 🔥🔥',
  250: '¡IMPARABLE! 🔥🔥🔥',
  500: '¡BESTIAL! 🔥🔥🔥🔥',
};

const BIG_STREAK_NAMES = [
  '¡LEYENDA!',
  '¡DIOS DEL PAD!',
  '¡SOBREHUMANO!',
  '¡PRECISIÓN BRUTAL!',
  '¡INCREÍBLE!',
];

export function milestoneMessage(streak: number): string | null {
  if (MILESTONE_MESSAGES[streak]) return MILESTONE_MESSAGES[streak];
  if (streak > 500 && streak % 500 === 0) {
    const idx = Math.floor((streak - 1000) / 500) % BIG_STREAK_NAMES.length;
    const name = BIG_STREAK_NAMES[Math.max(0, idx)];
    return `${name} ${streak} 🔥`;
  }
  return null;
}

export function onPadHit(
  state: GameState,
  padIndex: number,
  emit: (e: GameEvent) => void
): void {
  if (state.paused || state.completed || state.locked) return;

  const step = currentStep(state);
  if (!step) return;

  if (step.pad === padIndex) {
    playNote(step.chordNotes ?? step.noteName, step.duration);
    state.stepIndex += 1;
    state.streak += 1;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    const msg = milestoneMessage(state.streak);
    if (msg) emit({ type: 'milestone', streak: state.streak, message: msg });

    if (state.stepIndex >= state.steps.length) {
      state.completed = true;
      emit({ type: 'completed' });
    } else {
      emit({ type: 'advance' });
    }
  } else {
    state.locked = true;
    state.streak = 0;
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
  state.streak = 0;
  state.maxStreak = 0;
}
