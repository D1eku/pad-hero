import { config } from '../config';
import * as synth from './synth';
import * as sampler from './sampler';
import { isSynthKey } from './synths';
import type { InstrumentKey } from './instruments';

export function playNote(notes: string | string[], duration: number): void {
  if (isSynthKey(config.synth)) {
    synth.playNote(config.synth, notes, duration);
  } else {
    sampler.playNote(config.synth as InstrumentKey, notes, duration);
  }
}
