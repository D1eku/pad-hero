const CDN_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';

function urls(notes: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of notes) {
    const file = n.replace('#', 's') + '.mp3';
    out[n] = file;
  }
  return out;
}

export const INSTRUMENTS = {
  piano: {
    label: 'Piano',
    baseUrl: CDN_BASE + 'piano/',
    urls: urls(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']),
  },
  'guitar-acoustic': {
    label: 'Guitarra',
    baseUrl: CDN_BASE + 'guitar-acoustic/',
    urls: urls(['A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5']),
  },
  'guitar-electric': {
    label: 'Guitarra eléctrica',
    baseUrl: CDN_BASE + 'guitar-electric/',
    urls: urls(['E2', 'F#2', 'A2', 'C#3', 'E3', 'F#3', 'A3', 'C#4', 'E4', 'F#4', 'A4', 'C#5', 'E5']),
  },
  xylophone: {
    label: 'Xilófono',
    baseUrl: CDN_BASE + 'xylophone/',
    urls: urls(['G4', 'C5', 'G5', 'C6', 'G6', 'C7', 'G7', 'C8']),
  },
  organ: {
    label: 'Órgano',
    baseUrl: CDN_BASE + 'organ/',
    urls: urls(['C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5']),
  },
  violin: {
    label: 'Violín',
    baseUrl: CDN_BASE + 'violin/',
    urls: urls(['G4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6', 'E6', 'G6', 'A6', 'C7']),
  },
  harp: {
    label: 'Arpa',
    baseUrl: CDN_BASE + 'harp/',
    urls: urls(['C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'A4', 'C5', 'E5', 'G5', 'B5', 'D6', 'F6', 'A6']),
  },
} as const;

export type InstrumentKey = keyof typeof INSTRUMENTS;
