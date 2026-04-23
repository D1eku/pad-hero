import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import { isPercussion, isMelodyName, collapseRepeats } from './helpers';

interface TrackScore {
  trackIdx: number;
  score: number;
}

export const autoTrackStrategy: MappingStrategy = {
  key: 'auto-track',
  label: 'Auto-track (detectar melodía)',
  description:
    'Analiza todos los tracks, puntúa por monofonicidad + entropía de pitch + nombre + velocity, y usa el ganador.',
  needsTrackPick: false,
  buildSteps(midi) {
    const scores: TrackScore[] = [];
    midi.raw.tracks.forEach((track, trackIdx) => {
      if (isPercussion(track) || track.notes.length === 0) return;
      scores.push({ trackIdx, score: scoreTrack(track) });
    });

    if (scores.length === 0) throw new Error('Auto-track: no hay tracks melódicos');
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0].trackIdx;
    const track = midi.raw.tracks[winner];

    const byTime = new Map<number, typeof track.notes>();
    for (const n of track.notes) {
      const key = Math.round(n.time * 1000) / 1000;
      const list = byTime.get(key);
      if (list) list.push(n);
      else byTime.set(key, [n]);
    }

    const times = [...byTime.keys()].sort((a, b) => a - b);
    const steps: Step[] = times.map(t => {
      const notes = byTime.get(t)!;
      const pick =
        config.chordNote === 'highest'
          ? notes.reduce((a, b) => (a.midi >= b.midi ? a : b))
          : notes.reduce((a, b) => (a.midi <= b.midi ? a : b));
      return { midiNote: pick.midi, noteName: pick.name, duration: pick.duration, pad: -1 };
    });

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
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

  const pitches = notes.map(n => n.midi);
  const uniquePitches = new Set(pitches).size;
  const pitchVariety = Math.min(1, uniquePitches / 12);

  const avgVelocity = notes.reduce((a, n) => a + n.velocity, 0) / notes.length;

  const nameBonus = isMelodyName(track.name ?? '') ? 1 : 0;

  return monophonicity * 2 + pitchVariety * 1.5 + avgVelocity + nameBonus * 2;
}
