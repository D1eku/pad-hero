export const config = {
  synth: 'piano' as 'simple' | 'piano' | 'guitar-acoustic' | 'xylophone' | 'organ' | 'violin' | 'harp',

  trackIndex: 0,
  chordNote: 'highest' as 'highest' | 'lowest',

  padCount: 4,
  mistakeLockMs: 1000,

  viewMode: 'static' as 'static' | 'falling',

  midiDeviceNameHint: 'M-VAVE',
  padMidiNotes: [36, 37, 38, 39] as number[],
};
