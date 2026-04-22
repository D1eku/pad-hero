import type { SongInfo, MidiStatus } from '../types';
import { INSTRUMENTS, type InstrumentKey } from '../audio/instruments';

export type ViewMode = 'static' | 'falling';
export type SynthType = 'simple' | InstrumentKey;

export interface MenuParams {
  songs: SongInfo[];
  midiStatus: MidiStatus;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  synth: SynthType;
  onSynth: (synth: SynthType) => void;
  onPlay: (song: SongInfo) => void;
}

export function renderMenu(root: HTMLElement, params: MenuParams): void {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-menu';

  const title = document.createElement('h1');
  title.textContent = 'PAD HERO';
  container.appendChild(title);

  const status = document.createElement('div');
  status.className = 'midi-status ' + (params.midiStatus.ok ? 'ok' : 'err');
  status.textContent = params.midiStatus.ok
    ? `Conectado: ${params.midiStatus.deviceName}`
    : `MIDI: ${params.midiStatus.error ?? 'no disponible'}`;
  container.appendChild(status);

  const modeWrap = document.createElement('div');
  modeWrap.className = 'mode-selector';
  const modeLabel = document.createElement('span');
  modeLabel.className = 'label';
  modeLabel.textContent = 'Modo:';
  modeWrap.appendChild(modeLabel);

  const modes: { key: ViewMode; label: string }[] = [
    { key: 'static', label: 'Estático' },
    { key: 'falling', label: 'Caída' },
  ];
  for (const m of modes) {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (params.viewMode === m.key ? ' active' : '');
    btn.textContent = m.label;
    btn.onclick = () => params.onViewMode(m.key);
    modeWrap.appendChild(btn);
  }
  container.appendChild(modeWrap);

  const synthWrap = document.createElement('div');
  synthWrap.className = 'mode-selector';
  const synthLabel = document.createElement('span');
  synthLabel.className = 'label';
  synthLabel.textContent = 'Sonido:';
  synthWrap.appendChild(synthLabel);

  const synths: { key: SynthType; label: string }[] = [
    { key: 'simple', label: 'Simple' },
    ...(Object.entries(INSTRUMENTS) as [InstrumentKey, { label: string }][]).map(
      ([key, inst]) => ({ key: key as SynthType, label: inst.label })
    ),
  ];
  for (const s of synths) {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (params.synth === s.key ? ' active' : '');
    btn.textContent = s.label;
    btn.onclick = () => params.onSynth(s.key);
    synthWrap.appendChild(btn);
  }
  container.appendChild(synthWrap);

  const sub = document.createElement('h2');
  sub.textContent = 'Elige una canción';
  container.appendChild(sub);

  if (params.songs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent =
      'No hay canciones. Agrega un .mid en public/songs/ y recarga.';
    container.appendChild(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'song-list';
    for (const song of params.songs) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = song.name;
      btn.disabled = !params.midiStatus.ok;
      btn.onclick = () => params.onPlay(song);
      li.appendChild(btn);
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  root.appendChild(container);
}
