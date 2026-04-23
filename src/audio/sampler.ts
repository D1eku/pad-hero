import * as Tone from 'tone';
import * as simple from './synth';
import { INSTRUMENTS, type InstrumentKey } from './instruments';

type Entry = { sampler: Tone.Sampler; loaded: boolean };
const cache = new Map<InstrumentKey, Entry>();

function getOrCreate(key: InstrumentKey): Entry {
  const existing = cache.get(key);
  if (existing) return existing;
  const inst = INSTRUMENTS[key];
  const entry: Entry = { sampler: null as unknown as Tone.Sampler, loaded: false };
  entry.sampler = new Tone.Sampler({
    urls: inst.urls,
    baseUrl: inst.baseUrl,
    onload: () => { entry.loaded = true; },
  }).toDestination();
  cache.set(key, entry);
  return entry;
}

export function preload(key: InstrumentKey): void {
  getOrCreate(key);
}

export function playNote(key: InstrumentKey, notes: string | string[], duration: number): void {
  const e = getOrCreate(key);
  const d = Math.min(Math.max(duration, 0.15), 1.5);
  if (e.loaded) {
    e.sampler.triggerAttackRelease(notes, d);
  } else {
    simple.playNote('simple', notes, d);
  }
}
