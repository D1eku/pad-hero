import type { Step } from '../types';
import { config } from '../config';

export function assignPads(steps: Step[]): void {
  const pitches = steps.map(s => s.midiNote);
  const min = Math.min(...pitches);
  const max = Math.max(...pitches);
  const range = max - min;
  const pads = config.padCount;

  for (const step of steps) {
    if (range === 0) {
      step.pad = 0;
      continue;
    }
    const idx = Math.floor(((step.midiNote - min) / range) * pads);
    step.pad = Math.min(idx, pads - 1);
  }
}
