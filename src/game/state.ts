import type { Step } from '../types';

export interface GameState {
  steps: Step[];
  stepIndex: number;
  locked: boolean;
  completed: boolean;
  paused: boolean;
  songName: string;
}

export function createGameState(steps: Step[], songName: string): GameState {
  return {
    steps,
    stepIndex: 0,
    locked: false,
    completed: false,
    paused: false,
    songName,
  };
}

export function currentStep(s: GameState): Step | null {
  return s.stepIndex < s.steps.length ? s.steps[s.stepIndex] : null;
}

export function upcomingSteps(s: GameState, count: number): Step[] {
  return s.steps.slice(s.stepIndex + 1, s.stepIndex + 1 + count);
}
