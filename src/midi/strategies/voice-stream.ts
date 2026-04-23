import { config } from '../../config';
import type { Step } from '../../types';
import type { MappingStrategy } from './types';
import { buildQuantileMap } from './quantile';
import { isPercussion, collapseRepeats } from './helpers';

interface Note {
  pitch: number;
  time: number;
  duration: number;
  name: string;
}

interface Stream {
  notes: Note[];
  lastPitch: number;
  lastEndTime: number;
}

const MAX_GAP_SEC = 0.6;
const MAX_INTERVAL = 12;

export const voiceStreamStrategy: MappingStrategy = {
  key: 'voice-stream',
  label: 'Voice stream',
  description:
    'Agrupa las notas del MIDI en "voces" contiguas por proximidad temporal y tonal, y usa la voz más larga como melodía.',
  needsTrackPick: false,
  buildSteps(midi) {
    const all: Note[] = [];
    for (const track of midi.raw.tracks) {
      if (isPercussion(track)) continue;
      for (const n of track.notes) {
        all.push({ pitch: n.midi, time: n.time, duration: n.duration, name: n.name });
      }
    }
    all.sort((a, b) => a.time - b.time || b.pitch - a.pitch);

    const streams: Stream[] = [];
    for (const n of all) {
      let best: Stream | null = null;
      let bestCost = Infinity;
      for (const s of streams) {
        const gap = n.time - s.lastEndTime;
        if (gap > MAX_GAP_SEC) continue;
        const interval = Math.abs(n.pitch - s.lastPitch);
        if (interval > MAX_INTERVAL) continue;
        const cost = interval + Math.max(0, gap) * 8;
        if (cost < bestCost) {
          bestCost = cost;
          best = s;
        }
      }
      if (best) {
        best.notes.push(n);
        best.lastPitch = n.pitch;
        best.lastEndTime = Math.max(best.lastEndTime, n.time + n.duration);
      } else {
        streams.push({
          notes: [n],
          lastPitch: n.pitch,
          lastEndTime: n.time + n.duration,
        });
      }
    }

    if (streams.length === 0) throw new Error('Voice-stream: no hay notas');
    streams.sort((a, b) => b.notes.length - a.notes.length);
    const winner = streams[0];

    const steps: Step[] = winner.notes.map(n => ({
      midiNote: n.pitch,
      noteName: n.name,
      duration: n.duration,
      pad: -1,
    }));

    const pads = config.padCount;
    const pitchToPad = buildQuantileMap(steps, pads);
    for (const s of steps) s.pad = pitchToPad.get(s.midiNote) ?? 0;
    return collapseRepeats(steps);
  },
};
