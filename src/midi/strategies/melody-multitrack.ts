import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';

interface Candidate {
  pitch: number;
  time: number;
  duration: number;
  name: string;
  velocity: number;
  trackName: string;
}

const QUANTIZE_MS = 30;

export const melodyMultitrackStrategy: MappingStrategy = {
  key: 'melody-multitrack',
  label: 'Melodía (multitrack)',
  description:
    'Mezcla todos los tracks, ignora baterías y puntúa por velocity + rol del track para extraer la melodía.',
  needsTrackPick: false,
  buildSteps(midi) {
    const candidates: Candidate[] = [];
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      const penalty = isBassLike(track) ? -60 : 0;
      for (const n of track.notes) {
        candidates.push({
          pitch: n.midi,
          time: n.time,
          duration: n.duration,
          name: n.name,
          velocity: Math.round(n.velocity * 127) + penalty,
          trackName: track.name ?? '',
        });
      }
    }

    const buckets = new Map<number, Candidate[]>();
    for (const c of candidates) {
      const key = Math.round((c.time * 1000) / QUANTIZE_MS);
      const b = buckets.get(key);
      if (b) b.push(c);
      else buckets.set(key, [c]);
    }

    const steps: Step[] = [];
    const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);
    for (const k of sortedKeys) {
      const pick = pickBest(buckets.get(k)!);
      if (!pick) continue;
      steps.push({
        midiNote: pick.pitch,
        noteName: pick.name,
        duration: pick.duration,
        pad: -1,
      });
    }

    if (steps.length === 0) throw new Error('No se encontraron notas melódicas');

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};

function isPercussion(track: { channel: number; instrument: { percussion: boolean; family: string }; name: string }): boolean {
  if (track.channel === 9) return true;
  if (track.instrument?.percussion) return true;
  const fam = track.instrument?.family?.toLowerCase() ?? '';
  if (fam === 'drums') return true;
  const name = (track.name ?? '').toLowerCase();
  if (/drum|perc|batter[ií]a/.test(name)) return true;
  return false;
}

function isBassLike(track: { instrument: { family: string }; name: string }): boolean {
  const fam = track.instrument?.family?.toLowerCase() ?? '';
  if (fam === 'bass') return true;
  const name = (track.name ?? '').toLowerCase();
  if (/\bbass\b|\bbajo\b/.test(name)) return true;
  return false;
}

function pickBest(bucket: Candidate[]): Candidate | null {
  if (bucket.length === 0) return null;
  let best = bucket[0];
  let bestScore = -Infinity;
  for (const c of bucket) {
    let score = c.velocity + c.pitch / 8;
    const t = c.trackName.toLowerCase();
    if (/melody|melod[ií]a|lead|vocal|solo|voice|voz|main/.test(t)) score += 120;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function collapseRepeats(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.pad === s.pad) last.duration += s.duration;
    else out.push(s);
  }
  return out;
}
