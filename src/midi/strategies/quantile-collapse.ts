import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';

export const quantileCollapseStrategy: MappingStrategy = {
  key: 'quantile-collapse',
  label: 'Cuantiles + colapso',
  description: 'Cuantiles y además fusiona repeticiones consecutivas en el mismo pad.',
  needsTrackPick: true,
  buildSteps(midi, trackIdx) {
    if (trackIdx == null) throw new Error('quantile-collapse strategy requires a track index');
    const steps = midi.extractSteps(trackIdx);
    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const step of steps) step.pad = pitchToPad.get(step.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};

function collapseRepeats(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.pad === s.pad) {
      last.duration += s.duration;
    } else {
      out.push(s);
    }
  }
  return out;
}
