import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import {
  isPercussion,
  isMelodyName,
  collapseChordRepeats,
  chordFromCandidates,
} from './helpers';

const QUANTIZE_MS = 30;

interface Candidate {
  pitch: number;
  duration: number;
  name: string;
}

export const chordAutoTrackStrategy: MappingStrategy = {
  key: 'chord-auto-track',
  label: 'Acorde + Auto-track',
  description:
    'Lead viene del track mejor rankeado (monofonicidad + entropía + velocity + nombre). Todo lo demás del MIDI en acorde.',
  needsTrackPick: false,
  buildSteps(midi) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    midi.raw.tracks.forEach((track, idx) => {
      if (isPercussion(track) || track.notes.length === 0) return;
      const s = scoreTrack(track);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = idx;
      }
    });
    if (bestIdx < 0) throw new Error('Chord-auto-track: no hay tracks melódicos');

    const leadTrack = midi.raw.tracks[bestIdx];
    const leadByBucket = new Map<number, { pitch: number; duration: number; name: string }>();
    for (const n of leadTrack.notes) {
      const key = Math.round((n.time * 1000) / QUANTIZE_MS);
      const cur = leadByBucket.get(key);
      if (!cur || n.midi > cur.pitch) {
        leadByBucket.set(key, { pitch: n.midi, duration: n.duration, name: n.name });
      }
    }

    const chordByBucket = new Map<number, Candidate[]>();
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      for (const n of track.notes) {
        const key = Math.round((n.time * 1000) / QUANTIZE_MS);
        const cand: Candidate = { pitch: n.midi, duration: n.duration, name: n.name };
        const list = chordByBucket.get(key);
        if (list) list.push(cand);
        else chordByBucket.set(key, [cand]);
      }
    }

    const sorted = [...leadByBucket.keys()].sort((a, b) => a - b);
    const steps: Step[] = sorted.map(k => {
      const lead = leadByBucket.get(k)!;
      const chord = chordByBucket.get(k) ?? [lead];
      return {
        midiNote: lead.pitch,
        noteName: lead.name,
        duration: lead.duration,
        pad: -1,
        chordNotes: chordFromCandidates(chord),
      };
    });

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseChordRepeats(steps);
  },
};

function scoreTrack(track: {
  name?: string;
  notes: ReadonlyArray<{ midi: number; time: number; duration: number; velocity: number }>;
}): number {
  const notes = track.notes;
  if (notes.length < 4) return -Infinity;
  let overlaps = 0;
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].time < notes[i - 1].time + notes[i - 1].duration * 0.5) overlaps++;
  }
  const monophonicity = 1 - overlaps / notes.length;
  const pitchVariety = Math.min(1, new Set(notes.map(n => n.midi)).size / 12);
  const avgVelocity = notes.reduce((a, n) => a + n.velocity, 0) / notes.length;
  const nameBonus = isMelodyName(track.name ?? '') ? 1 : 0;
  return monophonicity * 2 + pitchVariety * 1.5 + avgVelocity + nameBonus * 2;
}
