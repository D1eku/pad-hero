export interface Step {
  midiNote: number;
  noteName: string;
  duration: number;
  pad: number;
  chordNotes?: string[];
}

export interface SongInfo {
  name: string;
  path: string;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
}

export interface MidiStatus {
  ok: boolean;
  deviceName?: string;
  error?: string;
  devices: MidiDeviceInfo[];
  selectedId: string | null;
}
