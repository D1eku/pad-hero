import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { isPercussion, isBassLike, isMelodyName, collapseRepeats } from './helpers';

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

interface Candidate {
  pitch: number;
  duration: number;
  name: string;
  velocity: number;
  trackName: string;
}

const QUANTIZE_MS = 30;

export const keyAwareStrategy: MappingStrategy = {
  key: 'key-aware',
  label: 'Tonalidad (grados de escala)',
  description:
    'Detecta tonalidad del MIDI (Krumhansl-Schmuckler) y mapea notas a pads por grado de escala: tónica → pad 1, 3ª → pad 2, 5ª → pad 3, resto → pad 4.',
  needsTrackPick: false,
  buildSteps(midi) {
    const allNotes: { pitch: number; duration: number }[] = [];
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      for (const n of track.notes) allNotes.push({ pitch: n.midi, duration: n.duration });
    }
    if (allNotes.length === 0) throw new Error('Key-aware: no hay notas');

    const { tonic, isMinor } = detectKey(allNotes);
    console.log(`[key-aware] tonalidad detectada: ${noteName(tonic)} ${isMinor ? 'menor' : 'mayor'}`);

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

    const sorted = [...buckets.keys()].sort((a, b) => a - b);
    const steps: Step[] = [];
    for (const k of sorted) {
      const pick = pickBest(buckets.get(k)!);
      if (!pick) continue;
      steps.push({ midiNote: pick.pitch, noteName: pick.name, duration: pick.duration, pad: -1 });
    }

    for (const s of steps) s.pad = padForDegree(s.midiNote, tonic, isMinor);
    return collapseRepeats(steps);
  },
};

function detectKey(notes: { pitch: number; duration: number }[]): { tonic: number; isMinor: boolean } {
  const histogram = new Array(12).fill(0);
  for (const n of notes) histogram[((n.pitch % 12) + 12) % 12] += n.duration;

  let best = { tonic: 0, isMinor: false, score: -Infinity };
  for (let tonic = 0; tonic < 12; tonic++) {
    const majorScore = correlate(histogram, MAJOR_PROFILE, tonic);
    const minorScore = correlate(histogram, MINOR_PROFILE, tonic);
    if (majorScore > best.score) best = { tonic, isMinor: false, score: majorScore };
    if (minorScore > best.score) best = { tonic, isMinor: true, score: minorScore };
  }
  return { tonic: best.tonic, isMinor: best.isMinor };
}

function correlate(histogram: number[], profile: number[], tonic: number): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += histogram[(i + tonic) % 12] * profile[i];
  return sum;
}

function padForDegree(midiNote: number, tonic: number, isMinor: boolean): number {
  const degree = ((midiNote - tonic) % 12 + 12) % 12;
  const thirdInterval = isMinor ? 3 : 4;
  if (degree === 0) return 0;
  if (degree === thirdInterval) return 1;
  if (degree === 7) return 2;
  return 3;
}

function noteName(n: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[((n % 12) + 12) % 12];
}

function pickBest(bucket: Candidate[]): Candidate | null {
  if (bucket.length === 0) return null;
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
