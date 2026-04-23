import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';

export const quantileStrategy: MappingStrategy = {
  key: 'quantile',
  label: 'Cuantiles',
  description: 'Distribuye las notas entre los 4 pads según frecuencia de aparición.',
  needsTrackPick: true,
  buildSteps(midi, trackIdx) {
    if (trackIdx == null) throw new Error('quantile strategy requires a track index');
    const steps = midi.extractSteps(trackIdx);
    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const step of steps) step.pad = pitchToPad.get(step.midiNote) ?? 0;
    return steps;
  },
};

export function buildQuantileMap(steps: Step[], pads: number): Map<number, number> {
  const counts = new Map<number, number>();
  for (const s of steps) counts.set(s.midiNote, (counts.get(s.midiNote) ?? 0) + 1);

  const uniquePitches = [...counts.keys()].sort((a, b) => a - b);
  const map = new Map<number, number>();
  if (uniquePitches.length === 0) return map;
  if (uniquePitches.length === 1) {
    map.set(uniquePitches[0], 0);
    return map;
  }
  if (uniquePitches.length <= pads) {
    const gap = (pads - 1) / (uniquePitches.length - 1);
    uniquePitches.forEach((p, i) => map.set(p, Math.round(i * gap)));
    return map;
  }

  const total = steps.length;
  let cumulative = 0;
  for (const pitch of uniquePitches) {
    const c = counts.get(pitch)!;
    const midpoint = (cumulative + c / 2) / total;
    const padIdx = Math.min(pads - 1, Math.floor(midpoint * pads));
    map.set(pitch, padIdx);
    cumulative += c;
  }
  return map;
}
