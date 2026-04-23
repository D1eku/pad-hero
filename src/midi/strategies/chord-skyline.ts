import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import { isPercussion, collapseChordRepeats, chordFromCandidates } from './helpers';

interface Candidate {
  pitch: number;
  duration: number;
  name: string;
}

const QUANTIZE_MS = 40;

export const chordSkylineStrategy: MappingStrategy = {
  key: 'chord-skyline',
  label: 'Acorde + Skyline',
  description:
    'Lead = nota más aguda del MIDI en cada instante (skyline). Al acertar suena el acorde completo del instante.',
  needsTrackPick: false,
  buildSteps(midi) {
    const buckets = new Map<number, Candidate[]>();
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      for (const n of track.notes) {
        const key = Math.round((n.time * 1000) / QUANTIZE_MS);
        const cand: Candidate = { pitch: n.midi, duration: n.duration, name: n.name };
        const list = buckets.get(key);
        if (list) list.push(cand);
        else buckets.set(key, [cand]);
      }
    }

    if (buckets.size === 0) throw new Error('Chord-skyline: no hay notas');

    const sorted = [...buckets.keys()].sort((a, b) => a - b);
    const steps: Step[] = [];
    for (const k of sorted) {
      const bucket = buckets.get(k)!;
      const lead = bucket.reduce((a, b) => (a.pitch >= b.pitch ? a : b));
      const duration = Math.max(...bucket.map(c => c.duration));
      steps.push({
        midiNote: lead.pitch,
        noteName: lead.name,
        duration,
        pad: -1,
        chordNotes: chordFromCandidates(bucket),
      });
    }

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseChordRepeats(steps);
  },
};
