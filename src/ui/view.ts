import type { GameState } from '../game/state';
import type { SynthType } from '../audio/synths';

export interface GameViewCallbacks {
  onPause: () => void;
  onRestart: () => void;
  onExit: () => void;
  onSynth: (key: SynthType) => void;
}

export interface GameViewHandle {
  update(): void;
  flashPad(padIndex: number): void;
  showMiss(): void;
  showPaused(paused: boolean): void;
  showMilestone(message: string): void;
}

export type StartView = (
  root: HTMLElement,
  state: GameState,
  cb: GameViewCallbacks,
) => GameViewHandle;

export const PAD_COLORS = ['#ff4d6d', '#ffc94d', '#4dd2ff', '#7dff4d'];

export function padColor(i: number): string {
  return PAD_COLORS[i] ?? '#888';
}
