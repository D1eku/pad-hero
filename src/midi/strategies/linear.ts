import { config } from '../../config';
import type { MappingStrategy } from './types';

export const linearStrategy: MappingStrategy = {
  key: 'linear',
  label: 'Lineal',
  description: 'Divide el rango min→max en 4 bandas iguales. Baseline original.',
  needsTrackPick: true,
  buildSteps(midi, trackIdx) {
    if (trackIdx == null) throw new Error('linear strategy requires a track index');
    const steps = midi.extractSteps(trackIdx);
    const pitches = steps.map(s => s.midiNote);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    const range = max - min;
    const pads = config.padCount;
    for (const step of steps) {
      if (range === 0) { step.pad = 0; continue; }
      const idx = Math.floor(((step.midiNote - min) / range) * pads);
      step.pad = Math.min(idx, pads - 1);
    }
    return steps;
  },
};
