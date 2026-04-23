import './styles.css';
import type { SongInfo, MidiStatus } from './types';
import { loadMidi, type LoadedMidi } from './midi/loader';
import { STRATEGIES, getStrategy } from './midi/strategies';
import {
  initMidi,
  setPadHitHandler,
  setMidiNoteListener,
  subscribeMidiState,
  selectMidiDevice,
} from './midi/input';
import { ensureAudioStarted } from './audio/engine';
import { createGameState } from './game/state';
import { onPadHit as handlePadHit, restart as restartGame } from './game/controller';
import { renderMenu, type ViewMode, type SynthType } from './ui/menu';
import { renderTrackPicker } from './ui/track-picker';
import { renderConfig } from './ui/config';
import { startView as startStaticView } from './ui/game-static';
import { startView as startFallingView } from './ui/game-falling';
import { renderEnd } from './ui/end';
import { config } from './config';
import type { GameViewHandle } from './ui/view';

const DEFAULT_PAD_NOTES = [36, 37, 38, 39];
const PAD_NOTES_KEY = 'pad-hero:padMidiNotes';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');
const root = app;

const savedMode = localStorage.getItem('pad-hero:viewMode');
if (savedMode === 'static' || savedMode === 'falling') {
  config.viewMode = savedMode;
}

const savedSynth = localStorage.getItem('pad-hero:synth');
const validSynths: readonly string[] = [
  'simple', 'synthwave', 'juno-pad', 'fm-dx7', 'moog-bass', 'acid-303', 'prophet', 'drums',
  'dubstep-wobble', 'daft-lead', 'house-pluck', 'supersaw', 'deep-bass', 'reese',
  'psy-lead', 'ambient-drone', 'melodic-pluck', 'lofi', 'matrix',
  'ram-vocoder', 'giorgio-bass', 'ram-rhodes', 'ram-pad',
  'piano', 'guitar-acoustic', 'guitar-electric', 'xylophone', 'organ', 'violin', 'harp',
];
if (savedSynth && validSynths.includes(savedSynth)) {
  config.synth = savedSynth as typeof config.synth;
}

const savedStrategy = localStorage.getItem('pad-hero:mappingStrategy');
if (savedStrategy && STRATEGIES.some(s => s.key === savedStrategy)) {
  config.mappingStrategy = savedStrategy as typeof config.mappingStrategy;
}

const savedPadNotes = localStorage.getItem(PAD_NOTES_KEY);
if (savedPadNotes) {
  try {
    const parsed = JSON.parse(savedPadNotes);
    if (
      Array.isArray(parsed) &&
      parsed.length === config.padCount &&
      parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 127)
    ) {
      config.padMidiNotes = parsed as number[];
    }
  } catch {
    // ignore malformed saved value
  }
}

let midiStatus: MidiStatus = {
  ok: false,
  error: 'Iniciando MIDI…',
  devices: [],
  selectedId: null,
};
let cachedSongs: SongInfo[] | null = null;
let onMenuView = false;

async function loadSongList(): Promise<SongInfo[]> {
  try {
    const res = await fetch('/songs/index.json');
    if (!res.ok) return [];
    const list = (await res.json()) as { name: string; file: string }[];
    return list.map(s => ({ name: s.name, path: `/songs/${s.file}` }));
  } catch {
    return [];
  }
}

async function goMenu() {
  onMenuView = true;
  setPadHitHandler(null);
  if (!cachedSongs) cachedSongs = await loadSongList();
  renderMenu(root, {
    songs: cachedSongs,
    midiStatus,
    viewMode: config.viewMode,
    onViewMode: (mode: ViewMode) => {
      config.viewMode = mode;
      localStorage.setItem('pad-hero:viewMode', mode);
      void goMenu();
    },
    synth: config.synth,
    onSynth: (synth: SynthType) => {
      config.synth = synth;
      localStorage.setItem('pad-hero:synth', synth);
      void goMenu();
    },
    strategies: STRATEGIES.map(s => ({ key: s.key, label: s.label, description: s.description })),
    currentStrategy: config.mappingStrategy,
    onStrategy: (key: string) => {
      config.mappingStrategy = key as typeof config.mappingStrategy;
      localStorage.setItem('pad-hero:mappingStrategy', key);
      void goMenu();
    },
    onPlay: (song) => { void goTrackPicker(song); },
    onSelectDevice: (id: string) => { selectMidiDevice(id); },
    onConfig: () => { goConfig(); },
  });
}

function persistPadNotes(): void {
  localStorage.setItem(PAD_NOTES_KEY, JSON.stringify(config.padMidiNotes));
}

function goConfig(): void {
  onMenuView = false;
  setPadHitHandler(null);
  renderConfig(root, {
    padNotes: config.padMidiNotes,
    onAssign: (padIndex, note) => {
      config.padMidiNotes[padIndex] = note;
      persistPadNotes();
    },
    onReset: () => {
      config.padMidiNotes = [...DEFAULT_PAD_NOTES];
      persistPadNotes();
      goConfig();
    },
    onBack: () => { void goMenu(); },
    setMidiNoteListener,
  });
}

function trackStorageKey(song: SongInfo): string {
  return `pad-hero:track:${song.path}`;
}

async function goTrackPicker(song: SongInfo) {
  onMenuView = false;
  setPadHitHandler(null);
  try {
    const midi = await loadMidi(song.path);
    if (midi.tracks.length === 0) {
      alert('El MIDI no tiene ningún track con notas.');
      void goMenu();
      return;
    }

    const strategy = getStrategy(config.mappingStrategy);
    if (!strategy.needsTrackPick) {
      void goGame(song, midi, null);
      return;
    }

    const saved = localStorage.getItem(trackStorageKey(song));
    const savedIdx = saved != null ? Number.parseInt(saved, 10) : NaN;
    const availableIdx = new Set(midi.tracks.map(t => t.idx));
    const lastPlayedIdx: number | null = availableIdx.has(savedIdx) ? savedIdx : null;

    if (midi.tracks.length === 1) {
      const only = midi.tracks[0].idx;
      localStorage.setItem(trackStorageKey(song), String(only));
      void goGame(song, midi, only);
      return;
    }

    renderTrackPicker(root, {
      songName: song.name,
      tracks: midi.tracks,
      selectedIdx: lastPlayedIdx,
      onPick: (idx) => {
        localStorage.setItem(trackStorageKey(song), String(idx));
        void goGame(song, midi, idx);
      },
      onBack: () => { void goMenu(); },
    });
  } catch (e) {
    alert(`Error cargando el MIDI: ${(e as Error).message}`);
    void goMenu();
  }
}

async function goGame(song: SongInfo, midi: LoadedMidi, trackIdx: number | null) {
  onMenuView = false;
  try {
    await ensureAudioStarted();
    const strategy = getStrategy(config.mappingStrategy);
    const steps = strategy.buildSteps(midi, trackIdx);
    const state = createGameState(steps, song.name);

    const start = config.viewMode === 'falling' ? startFallingView : startStaticView;

    let view!: GameViewHandle;
    view = start(root, state, {
      onPause: () => {
        state.paused = !state.paused;
        view.showPaused(state.paused);
      },
      onRestart: () => {
        restartGame(state);
        view.showPaused(false);
        view.update();
      },
      onExit: () => { void goMenu(); },
      onSynth: (key) => {
        config.synth = key;
        localStorage.setItem('pad-hero:synth', key);
      },
    });

    setPadHitHandler((padIndex) => {
      view.flashPad(padIndex);
      handlePadHit(state, padIndex, (ev) => {
        if (ev.type === 'advance') {
          view.update();
        } else if (ev.type === 'miss') {
          view.showMiss();
        } else if (ev.type === 'milestone') {
          view.showMilestone(ev.message);
        } else if (ev.type === 'completed') {
          view.update();
          setTimeout(() => goEnd(song, midi, trackIdx), 500);
        }
      });
    });
  } catch (e) {
    alert(`Error cargando la canción: ${(e as Error).message}`);
    void goMenu();
  }
}

function goEnd(song: SongInfo, midi: LoadedMidi, trackIdx: number | null) {
  onMenuView = false;
  setPadHitHandler(null);
  renderEnd(root, song.name, {
    onMenu: () => { void goMenu(); },
    onReplay: () => { void goGame(song, midi, trackIdx); },
  });
}

(async () => {
  subscribeMidiState((s) => {
    midiStatus = s;
    if (onMenuView) void goMenu();
  });
  midiStatus = await initMidi();
  await goMenu();
})();
