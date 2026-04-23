import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';

export const quantizedCollapseStrategy: MappingStrategy = {
  key: 'quantized-collapse',
  label: 'Cuantizado + colapso',
  description:
    'Snap a semicorcheas según tempo del MIDI, agrupa notas cercanas, luego cuantiles + colapso. Más claro rítmicamente.',
  needsTrackPick: true,
  buildSteps(midi, trackIdx) {
    if (trackIdx == null) throw new Error('quantized-collapse requires a track index');
    const track = midi.raw.tracks[trackIdx];
    if (!track || track.notes.length === 0) {
      throw new Error(`Track ${trackIdx} vacío o inexistente`);
    }

    const bpm = midi.raw.header.tempos[0]?.bpm ?? 120;
    const sixteenth = 60 / bpm / 4;

    const byBucket = new Map<number, typeof track.notes>();
    for (const n of track.notes) {
      const bucket = Math.round(n.time / sixteenth);
      const list = byBucket.get(bucket);
      if (list) list.push(n);
      else byBucket.set(bucket, [n]);
    }

    const sortedBuckets = [...byBucket.keys()].sort((a, b) => a - b);
    const steps: Step[] = sortedBuckets.map(b => {
      const notes = byBucket.get(b)!;
      const pick =
        config.chordNote === 'highest'
          ? notes.reduce((a, b) => (a.midi >= b.midi ? a : b))
          : notes.reduce((a, b) => (a.midi <= b.midi ? a : b));
      return {
        midiNote: pick.midi,
        noteName: pick.name,
        duration: pick.duration,
        pad: -1,
      };
    });

    if (steps.length === 0) throw new Error(`Track ${trackIdx} no produjo steps`);

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};

function collapseRepeats(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.pad === s.pad) last.duration += s.duration;
    else out.push(s);
  }
  return out;
}
