import * as Tone from 'tone';

const synth = new Tone.PolySynth(Tone.Synth, {
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.4 },
}).toDestination();

export function playNote(noteName: string, duration: number) {
  const d = Math.min(Math.max(duration, 0.15), 1.5);
  synth.triggerAttackRelease(noteName, d);
}
