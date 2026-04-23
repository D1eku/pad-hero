import * as Tone from 'tone';
import type { InstrumentKey } from './instruments';
import { masterOut } from './master';

export type SynthKey =
  | 'simple'
  | 'synthwave'
  | 'juno-pad'
  | 'fm-dx7'
  | 'moog-bass'
  | 'acid-303'
  | 'prophet'
  | 'drums'
  | 'dubstep-wobble'
  | 'daft-lead'
  | 'house-pluck'
  | 'supersaw'
  | 'deep-bass'
  | 'reese'
  | 'psy-lead'
  | 'ambient-drone'
  | 'melodic-pluck'
  | 'lofi'
  | 'matrix'
  | 'ram-vocoder'
  | 'giorgio-bass'
  | 'ram-rhodes'
  | 'ram-pad';
export type SynthType = SynthKey | InstrumentKey;

export const SYNTHS: Record<SynthKey, { label: string }> = {
  simple: { label: 'Simple' },
  synthwave: { label: 'Synthwave' },
  'juno-pad': { label: 'Juno Pad' },
  'fm-dx7': { label: 'FM DX7' },
  'moog-bass': { label: 'Moog Bass' },
  'acid-303': { label: 'Acid 303' },
  prophet: { label: 'Prophet Pad' },
  drums: { label: 'Batería' },
  'dubstep-wobble': { label: 'Dubstep Wobble' },
  'daft-lead': { label: 'Daft Lead' },
  'house-pluck': { label: 'House Pluck' },
  supersaw: { label: 'Supersaw' },
  'deep-bass': { label: 'Deep Bass' },
  reese: { label: 'Reese Bass' },
  'psy-lead': { label: 'Psy Lead' },
  'ambient-drone': { label: 'Ambient Drone' },
  'melodic-pluck': { label: 'Melodic Pluck' },
  lofi: { label: 'Lo-fi' },
  matrix: { label: 'Matrix' },
  'ram-vocoder': { label: 'RAM Vocoder' },
  'giorgio-bass': { label: 'Giorgio Bass' },
  'ram-rhodes': { label: 'RAM Rhodes' },
  'ram-pad': { label: 'RAM Pad' },
};

interface SynthInstance {
  trigger: (notes: string | string[], dur: number) => void;
}

export function isSynthKey(key: string): key is SynthKey {
  return key in SYNTHS;
}

export function buildSynth(key: SynthKey): SynthInstance {
  switch (key) {
    case 'simple': {
      const s = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.4 },
      }).connect(masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'synthwave': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.8 },
        filter: { Q: 2, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.05,
          decay: 0.4,
          sustain: 0.25,
          release: 1.0,
          baseFrequency: 300,
          octaves: 3,
        },
      });
      const chorus = new Tone.Chorus({ frequency: 2.5, delayTime: 4, depth: 0.7 }).start();
      const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.25, wet: 0.3 });
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.22 });
      s.chain(chorus, delay, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'juno-pad': {
      const voice = {
        oscillator: { type: 'sawtooth' as const },
        envelope: { attack: 0.25, decay: 0.3, sustain: 0.7, release: 1.4 },
        filter: { Q: 1, type: 'lowpass' as const, rolloff: -12 as const },
        filterEnvelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.5,
          release: 1.2,
          baseFrequency: 500,
          octaves: 2,
        },
      };
      const s = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 1.005,
        vibratoAmount: 0.1,
        vibratoRate: 5,
        voice0: voice,
        voice1: voice,
      });
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
      s.chain(reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'fm-dx7': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.5 },
        modulation: { type: 'square' },
        modulationEnvelope: {
          attack: 0.005,
          decay: 0.2,
          sustain: 0.15,
          release: 0.4,
        },
      }).connect(masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'moog-bass': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.4, release: 0.3 },
        filter: { Q: 6, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.15,
          release: 0.5,
          baseFrequency: 90,
          octaves: 2.5,
        },
      }).connect(masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'acid-303': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
        filter: { Q: 12, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.005,
          decay: 0.25,
          sustain: 0.05,
          release: 0.3,
          baseFrequency: 80,
          octaves: 4,
        },
      });
      const distortion = new Tone.Distortion({ distortion: 0.25, wet: 0.35 });
      const delay = new Tone.FeedbackDelay({ delayTime: '16n', feedback: 0.2, wet: 0.15 });
      s.chain(distortion, delay, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'prophet': {
      const voice = {
        oscillator: { type: 'fatsawtooth' as const, count: 2, spread: 20 },
        envelope: { attack: 0.4, decay: 0.6, sustain: 0.75, release: 2.2 },
        filter: { Q: 1.5, type: 'lowpass' as const, rolloff: -24 as const },
        filterEnvelope: {
          attack: 0.5,
          decay: 0.6,
          sustain: 0.5,
          release: 2.0,
          baseFrequency: 400,
          octaves: 2.5,
        },
      };
      const s = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 1.01,
        vibratoAmount: 0.05,
        vibratoRate: 3.5,
        voice0: voice,
        voice1: voice,
      });
      const chorus = new Tone.Chorus({ frequency: 0.8, delayTime: 5, depth: 0.6 }).start();
      const reverb = new Tone.Reverb({ decay: 5, wet: 0.45 });
      s.chain(chorus, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'drums': {
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 8,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
      }).connect(masterOut());
      const snare = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      }).connect(masterOut());
      const hatClosed = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.2,
      }).connect(masterOut());
      const hatOpen = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.35, release: 0.05 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(masterOut());
      return {
        trigger: (notes, dur) => {
          const arr = typeof notes === 'string' ? [notes] : notes;
          for (const note of arr) {
            const midi = Tone.Frequency(note).toMidi();
            if (midi < 48) {
              kick.triggerAttackRelease(note, Math.min(dur, 0.3));
            } else if (midi < 60) {
              snare.triggerAttackRelease(Math.min(dur, 0.25));
            } else if (midi < 72) {
              hatClosed.triggerAttackRelease('C7', '32n');
            } else {
              hatOpen.triggerAttackRelease('C7', '16n');
            }
          }
        },
      };
    }
    case 'dubstep-wobble': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 20 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
        filter: { Q: 4, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.5,
          release: 0.3,
          baseFrequency: 100,
          octaves: 3,
        },
      });
      const autoFilter = new Tone.AutoFilter({
        frequency: '8n',
        baseFrequency: 150,
        octaves: 4,
        type: 'sine',
        depth: 1,
      }).start();
      const distortion = new Tone.Distortion({ distortion: 0.4, wet: 0.5 });
      s.chain(autoFilter, distortion, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'daft-lead': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 4,
        modulationIndex: 14,
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.3 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.3 },
      });
      const phaser = new Tone.Phaser({ frequency: 0.7, octaves: 3, baseFrequency: 800 });
      const delay = new Tone.FeedbackDelay({ delayTime: '16n', feedback: 0.2, wet: 0.2 });
      s.chain(phaser, delay, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'house-pluck': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 10 },
        envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.18 },
        filter: { Q: 3, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.001,
          decay: 0.18,
          sustain: 0.05,
          release: 0.2,
          baseFrequency: 700,
          octaves: 2.5,
        },
      });
      const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.2 });
      s.chain(reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'supersaw': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'fatsawtooth', count: 7, spread: 40 },
        envelope: { attack: 0.04, decay: 0.3, sustain: 0.6, release: 0.8 },
        filter: { Q: 1, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.7,
          release: 1,
          baseFrequency: 800,
          octaves: 2.5,
        },
      });
      const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.8 }).start();
      const reverb = new Tone.Reverb({ decay: 3, wet: 0.35 });
      s.chain(chorus, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'deep-bass': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.85, release: 0.3 },
        filter: { Q: 1, type: 'lowpass', rolloff: -12 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.15,
          sustain: 0.5,
          release: 0.3,
          baseFrequency: 180,
          octaves: 1.5,
        },
      }).connect(masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'reese': {
      const voice = {
        oscillator: { type: 'sawtooth' as const },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.85, release: 0.25 },
        filter: { Q: 1, type: 'lowpass' as const, rolloff: -24 as const },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.6,
          release: 0.3,
          baseFrequency: 250,
          octaves: 1.5,
        },
      };
      const s = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 0.5,
        vibratoAmount: 0.02,
        vibratoRate: 6,
        voice0: voice,
        voice1: voice,
      });
      const distortion = new Tone.Distortion({ distortion: 0.2, wet: 0.3 });
      s.chain(distortion, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'psy-lead': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0.4, release: 0.2 },
        filter: { Q: 9, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.002,
          decay: 0.15,
          sustain: 0.3,
          release: 0.2,
          baseFrequency: 500,
          octaves: 3,
        },
      });
      const distortion = new Tone.Distortion({ distortion: 0.3, wet: 0.4 });
      const delay = new Tone.FeedbackDelay({ delayTime: '16n', feedback: 0.25, wet: 0.2 });
      s.chain(distortion, delay, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'ambient-drone': {
      const voice = {
        oscillator: { type: 'sine' as const },
        envelope: { attack: 2, decay: 0.5, sustain: 0.9, release: 4 },
        filter: { Q: 0.5, type: 'lowpass' as const, rolloff: -12 as const },
        filterEnvelope: {
          attack: 3,
          decay: 1,
          sustain: 0.6,
          release: 4,
          baseFrequency: 600,
          octaves: 1.5,
        },
      };
      const s = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 1.003,
        vibratoAmount: 0.08,
        vibratoRate: 2,
        voice0: voice,
        voice1: voice,
      });
      const chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 6, depth: 0.9 }).start();
      const reverb = new Tone.Reverb({ decay: 10, wet: 0.65 });
      s.chain(chorus, reverb, masterOut());
      s.maxPolyphony = 10;
      return {
        trigger: (n, d) => s.triggerAttackRelease(n, Math.max(d, 1.5)),
      };
    }
    case 'melodic-pluck': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2.5,
        modulationIndex: 8,
        envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.4 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
      });
      const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: 0.3 });
      const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 });
      s.chain(delay, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'lofi': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.3, release: 0.8 },
        filter: { Q: 0.5, type: 'lowpass', rolloff: -12 },
        filterEnvelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.3,
          release: 0.8,
          baseFrequency: 1000,
          octaves: 1,
        },
      });
      const distortion = new Tone.Distortion({ distortion: 0.08, wet: 0.3 });
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 });
      s.chain(distortion, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'matrix': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.5,
        modulationIndex: 22,
        envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.6 },
        modulation: { type: 'sawtooth' },
        modulationEnvelope: {
          attack: 0.005,
          decay: 0.25,
          sustain: 0.35,
          release: 0.5,
        },
      });
      const distortion = new Tone.Distortion({ distortion: 0.35, wet: 0.35 });
      const chorus = new Tone.Chorus({ frequency: 0.4, delayTime: 4, depth: 0.4 }).start();
      const reverb = new Tone.Reverb({ decay: 3, wet: 0.3 });
      s.chain(distortion, chorus, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'ram-vocoder': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 6,
        envelope: { attack: 0.01, decay: 0.25, sustain: 0.7, release: 0.8 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.6 },
      });
      const chorus = new Tone.Chorus({ frequency: 1.2, delayTime: 3.5, depth: 0.7 }).start();
      const phaser = new Tone.Phaser({ frequency: 0.5, octaves: 2, baseFrequency: 600 });
      const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0.2 });
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 });
      s.chain(chorus, phaser, delay, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'giorgio-bass': {
      const s = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.18 },
        filter: { Q: 4, type: 'lowpass', rolloff: -24 },
        filterEnvelope: {
          attack: 0.005,
          decay: 0.2,
          sustain: 0.4,
          release: 0.3,
          baseFrequency: 180,
          octaves: 3,
        },
      });
      const delay = new Tone.FeedbackDelay({ delayTime: '16n', feedback: 0.35, wet: 0.28 });
      const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.15 });
      s.chain(delay, reverb, masterOut());
      s.maxPolyphony = 8;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'ram-rhodes': {
      const s = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 5,
        envelope: { attack: 0.003, decay: 0.9, sustain: 0.2, release: 1.5 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.003, decay: 0.6, sustain: 0.1, release: 1.2 },
      });
      const chorus = new Tone.Chorus({ frequency: 0.8, delayTime: 4, depth: 0.6 }).start();
      const tremolo = new Tone.Tremolo({ frequency: 3.5, depth: 0.25 }).start();
      const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });
      s.chain(chorus, tremolo, reverb, masterOut());
      s.maxPolyphony = 16;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
    case 'ram-pad': {
      const voice = {
        oscillator: { type: 'fatsawtooth' as const, count: 3, spread: 25 },
        envelope: { attack: 0.6, decay: 0.8, sustain: 0.8, release: 2.5 },
        filter: { Q: 1.2, type: 'lowpass' as const, rolloff: -24 as const },
        filterEnvelope: {
          attack: 0.8,
          decay: 0.9,
          sustain: 0.55,
          release: 2.2,
          baseFrequency: 350,
          octaves: 2.5,
        },
      };
      const s = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 1.01,
        vibratoAmount: 0.06,
        vibratoRate: 4,
        voice0: voice,
        voice1: voice,
      });
      const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 5, depth: 0.8 }).start();
      const reverb = new Tone.Reverb({ decay: 6, wet: 0.5 });
      s.chain(chorus, reverb, masterOut());
      s.maxPolyphony = 12;
      return { trigger: (n, d) => s.triggerAttackRelease(n, d) };
    }
  }
}
