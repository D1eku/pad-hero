export const config = {
  synth: 'piano' as
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
    | 'piano'
    | 'guitar-acoustic'
    | 'guitar-electric'
    | 'xylophone'
    | 'organ'
    | 'violin'
    | 'harp',

  trackIndex: 0,
  chordNote: 'highest' as 'highest' | 'lowest',

  padCount: 4,
  mistakeLockMs: 1000,

  viewMode: 'static' as 'static' | 'falling',

  midiDeviceNameHint: 'SINCO',
  padMidiNotes: [36, 37, 38, 39] as number[],

  mappingStrategy: 'quantile-collapse' as
    | 'linear'
    | 'quantile'
    | 'quantile-collapse'
    | 'quantized-collapse'
    | 'melody-multitrack'
    | 'skyline'
    | 'auto-track'
    | 'melody-continuity'
    | 'voice-stream'
    | 'key-aware'
    | 'chord-multitrack'
    | 'chord-skyline'
    | 'chord-auto-track'
    | 'chord-continuity'
    | 'chord-voice-stream',
};
