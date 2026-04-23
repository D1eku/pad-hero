import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import { isPercussion, collapseRepeats } from './helpers';

const QUANTIZE_MS = 40;

export const skylineStrategy: MappingStrategy = {
  key: 'skyline',
  label: 'Skyline (nota más aguda)',
  description:
    'En cada instante, elige la nota más aguda de todo el MIDI. Se basa en que la melodía casi siempre ocupa la voz superior.',
  needsTrackPick: false,
  buildSteps(midi) {
    const buckets = new Map<number, { pitch: number; duration: number; name: string }>();
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      for (const n of track.notes) {
        const bucket = Math.round((n.time * 1000) / QUANTIZE_MS);
        const cur = buckets.get(bucket);
        if (!cur || n.midi > cur.pitch) {
          buckets.set(bucket, { pitch: n.midi, duration: n.duration, name: n.name });
        }
      }
    }

    if (buckets.size === 0) throw new Error('Skyline: no hay notas melódicas');

    const sorted = [...buckets.keys()].sort((a, b) => a - b);
    const steps: Step[] = sorted.map(k => {
      const b = buckets.get(k)!;
      return { midiNote: b.pitch, noteName: b.name, duration: b.duration, pad: -1 };
    });

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};
