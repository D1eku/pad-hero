import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import {
  isPercussion,
  isBassLike,
  isMelodyName,
  collapseChordRepeats,
  chordFromCandidates,
} from './helpers';

interface Candidate {
  pitch: number;
  duration: number;
  name: string;
  velocity: number;
  trackName: string;
}

const QUANTIZE_MS = 30;

export const chordMultitrackStrategy: MappingStrategy = {
  key: 'chord-multitrack',
  label: 'Acorde completo',
  description:
    'Al acertar el pad dispara las notas simultáneas del MIDI (limitadas a 4 voces). La nota de melodía decide el pad.',
  needsTrackPick: false,
  buildSteps(midi) {
    const buckets = new Map<number, Candidate[]>();
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      const penalty = isBassLike(track) ? -60 : 0;
      for (const n of track.notes) {
        const key = Math.round((n.time * 1000) / QUANTIZE_MS);
        const cand: Candidate = {
          pitch: n.midi,
          duration: n.duration,
          name: n.name,
          velocity: Math.round(n.velocity * 127) + penalty,
          trackName: track.name ?? '',
        };
        const list = buckets.get(key);
        if (list) list.push(cand);
        else buckets.set(key, [cand]);
      }
    }

    if (buckets.size === 0) throw new Error('Chord-multitrack: no hay notas');

    const sorted = [...buckets.keys()].sort((a, b) => a - b);
    const steps: Step[] = [];
    for (const k of sorted) {
      const bucket = buckets.get(k)!;
      const lead = pickLead(bucket);
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

function pickLead(bucket: Candidate[]): Candidate {
  let best = bucket[0];
  let bestScore = -Infinity;
  for (const c of bucket) {
    let score = c.velocity + c.pitch / 8;
    if (isMelodyName(c.trackName)) score += 120;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
