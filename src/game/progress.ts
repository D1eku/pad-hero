import type { GameState } from './state';

export function progressPercent(s: GameState): number {
  if (s.steps.length === 0) return 0;
  return (s.stepIndex / s.steps.length) * 100;
}
