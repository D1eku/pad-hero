import './styles.css';
import type { SongInfo, MidiStatus } from './types';
import { loadMidi, type LoadedMidi } from './midi/loader';
import { assignPads } from './midi/mapper';
import { initMidi, setPadHitHandler } from './midi/input';
import { ensureAudioStarted } from './audio/engine';
import { createGameState } from './game/state';
import { onPadHit as handlePadHit, restart as restartGame } from './game/controller';
import { renderMenu, type ViewMode, type SynthType } from './ui/menu';
import { renderTrackPicker } from './ui/track-picker';
import { startView as startStaticView } from './ui/game-static';
import { startView as startFallingView } from './ui/game-falling';
import { renderEnd } from './ui/end';
import { config } from './config';
import type { GameViewHandle } from './ui/view';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');
const root = app;

const savedMode = localStorage.getItem('pad-hero:viewMode');
if (savedMode === 'static' || savedMode === 'falling') {
  config.viewMode = savedMode;
}

const savedSynth = localStorage.getItem('pad-hero:synth');
const validSynths: readonly string[] = [
  'simple', 'piano', 'guitar-acoustic', 'xylophone', 'organ', 'violin', 'harp',
];
if (savedSynth && validSynths.includes(savedSynth)) {
  config.synth = savedSynth as typeof config.synth;
}

let midiStatus: MidiStatus = { ok: false, error: 'Iniciando MIDI…' };

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
  setPadHitHandler(null);
  const songs = await loadSongList();
  renderMenu(root, {
    songs,
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
    onPlay: (song) => { void goTrackPicker(song); },
  });
}

function trackStorageKey(song: SongInfo): string {
  return `pad-hero:track:${song.path}`;
}

async function goTrackPicker(song: SongInfo) {
  setPadHitHandler(null);
  try {
    const midi = await loadMidi(song.path);
    if (midi.tracks.length === 0) {
      alert('El MIDI no tiene ningún track con notas.');
      void goMenu();
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

async function goGame(song: SongInfo, midi: LoadedMidi, trackIdx: number) {
  try {
    await ensureAudioStarted();
    const steps = midi.extractSteps(trackIdx);
    assignPads(steps);
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
    });

    setPadHitHandler((padIndex) => {
      view.flashPad(padIndex);
      handlePadHit(state, padIndex, (ev) => {
        if (ev.type === 'advance') {
          view.update();
        } else if (ev.type === 'miss') {
          view.showMiss();
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

function goEnd(song: SongInfo, midi: LoadedMidi, trackIdx: number) {
  setPadHitHandler(null);
  renderEnd(root, song.name, {
    onMenu: () => { void goMenu(); },
    onReplay: () => { void goGame(song, midi, trackIdx); },
  });
}

(async () => {
  midiStatus = await initMidi();
  await goMenu();
})();
