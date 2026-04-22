export interface Step {
  midiNote: number;
  noteName: string;
  duration: number;
  pad: number;
}

export interface SongInfo {
  name: string;
  path: string;
}

export interface MidiStatus {
  ok: boolean;
  deviceName?: string;
  error?: string;
}
