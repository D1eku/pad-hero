import { buildSynth, type SynthKey } from './synths';

interface SynthInstance {
  trigger: (notes: string | string[], dur: number) => void;
}

const cache = new Map<SynthKey, SynthInstance>();

function getOrCreate(key: SynthKey): SynthInstance {
  const cached = cache.get(key);
  if (cached) return cached;
  const instance = buildSynth(key);
  cache.set(key, instance);
  return instance;
}

export function playNote(key: SynthKey, notes: string | string[], duration: number): void {
  const d = Math.min(Math.max(duration, 0.15), 1.5);
  getOrCreate(key).trigger(notes, d);
}
