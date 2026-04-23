import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import { isPercussion, isBassLike, isMelodyName, collapseRepeats } from './helpers';

interface Candidate {
  pitch: number;
  duration: number;
  name: string;
  velocity: number;
  trackName: string;
}

const QUANTIZE_MS = 30;

export const melodyContinuityStrategy: MappingStrategy = {
  key: 'melody-continuity',
  label: 'Melodía + continuidad',
  description:
    'Como multitrack pero premia notas cercanas en pitch a la anterior elegida. Evita saltos bruscos de octava entre tiempos.',
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

    const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);
    const steps: Step[] = [];
    let prevPitch: number | null = null;

    for (const k of sortedKeys) {
      const bucket = buckets.get(k)!;
      const pick = pickBest(bucket, prevPitch);
      if (!pick) continue;
      steps.push({ midiNote: pick.pitch, noteName: pick.name, duration: pick.duration, pad: -1 });
      prevPitch = pick.pitch;
    }

    if (steps.length === 0) throw new Error('Melody-continuity: no hay notas');

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};

function pickBest(bucket: Candidate[], prevPitch: number | null): Candidate | null {
  if (bucket.length === 0) return null;
  let best = bucket[0];
  let bestScore = -Infinity;
  for (const c of bucket) {
    let score = c.velocity + c.pitch / 8;
    if (isMelodyName(c.trackName)) score += 120;
    if (prevPitch !== null) {
      const interval = Math.abs(c.pitch - prevPitch);
      score -= Math.min(interval * 4, 60);
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
