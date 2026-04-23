import * as Tone from 'tone';

let limiter: Tone.Limiter | null = null;

export function masterOut(): Tone.Limiter {
  if (!limiter) {
    limiter = new Tone.Limiter(-3).toDestination();
  }
  return limiter;
}
