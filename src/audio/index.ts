import { config } from '../config';
import * as simple from './synth';
import * as sampler from './sampler';

export function playNote(noteName: string, duration: number): void {
  if (config.synth === 'simple') {
    simple.playNote(noteName, duration);
  } else {
    sampler.playNote(config.synth, noteName, duration);
  }
}
