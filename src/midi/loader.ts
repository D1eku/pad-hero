import { Midi } from '@tonejs/midi';
import type { Step } from '../types';
import { config } from '../config';

export interface TrackInfo {
  idx: number;
  name: string;
  instrument: string;
  noteCount: number;
}

export interface LoadedMidi {
  tracks: TrackInfo[];
  extractSteps(trackIdx: number): Step[];
}

export async function loadMidi(url: string): Promise<LoadedMidi> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fallo al descargar ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  const midi = new Midi(buf);

  const tracks: TrackInfo[] = midi.tracks
    .map((t, i): TrackInfo => ({
      idx: i,
      name: t.name || `Track ${i}`,
      instrument: t.instrument?.name ?? 'sin instrumento',
      noteCount: t.notes.length,
    }))
    .filter(t => t.noteCount > 0);

  console.log(
    `[MIDI] Tracks con notas: ` +
      tracks.map(t => `#${t.idx} "${t.name}" (${t.instrument}, ${t.noteCount}n)`).join(', ')
  );

  function extractSteps(trackIdx: number): Step[] {
    const track = midi.tracks[trackIdx];
    if (!track || track.notes.length === 0) {
      throw new Error(`Track ${trackIdx} vacío o inexistente`);
    }

    const byTime = new Map<number, typeof track.notes>();
    for (const n of track.notes) {
      const key = Math.round(n.time * 1000) / 1000;
      const bucket = byTime.get(key);
      if (bucket) bucket.push(n);
      else byTime.set(key, [n]);
    }

    const sortedTimes = [...byTime.keys()].sort((a, b) => a - b);
    const steps: Step[] = sortedTimes.map(t => {
      const notes = byTime.get(t)!;
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

    if (steps.length === 0) {
      throw new Error(`Track ${trackIdx} no produjo steps`);
    }
    return steps;
  }

  return { tracks, extractSteps };
}
