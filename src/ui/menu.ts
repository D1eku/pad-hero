import type { SongInfo, MidiStatus } from '../types';
import { INSTRUMENTS, type InstrumentKey } from '../audio/instruments';
import { SYNTHS, type SynthKey, type SynthType } from '../audio/synths';

export type ViewMode = 'static' | 'falling';
export type { SynthType };

export interface StrategyOption {
  key: string;
  label: string;
  description: string;
}

export interface MenuParams {
  songs: SongInfo[];
  midiStatus: MidiStatus;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  synth: SynthType;
  onSynth: (synth: SynthType) => void;
  strategies: StrategyOption[];
  currentStrategy: string;
  onStrategy: (key: string) => void;
  onPlay: (song: SongInfo) => void;
  onSelectDevice: (id: string) => void;
  onConfig: () => void;
}

const GEAR_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

export function renderMenu(root: HTMLElement, params: MenuParams): void {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-menu';

  container.appendChild(buildHeader(params));
  container.appendChild(buildBody(params));

  root.appendChild(container);
}

function buildHeader(params: MenuParams): HTMLElement {
  const header = document.createElement('header');
  header.className = 'menu-header';

  const brand = document.createElement('div');
  brand.className = 'menu-header-brand';

  const title = document.createElement('h1');
  title.textContent = 'PAD HERO';
  brand.appendChild(title);

  const midi = document.createElement('div');
  midi.className = 'menu-header-midi ' + (params.midiStatus.ok ? 'ok' : 'err');

  const midiDot = document.createElement('span');
  midiDot.className = 'midi-dot';
  midi.appendChild(midiDot);

  if (params.midiStatus.devices.length > 1) {
    const select = document.createElement('select');
    select.className = 'device-select';
    for (const dev of params.midiStatus.devices) {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.textContent = dev.name;
      if (dev.id === params.midiStatus.selectedId) opt.selected = true;
      select.appendChild(opt);
    }
    select.onchange = () => params.onSelectDevice(select.value);
    midi.appendChild(select);
  } else {
    const label = document.createElement('span');
    label.className = 'midi-label';
    label.textContent = params.midiStatus.ok
      ? params.midiStatus.deviceName ?? 'MIDI conectado'
      : params.midiStatus.error ?? 'MIDI no disponible';
    midi.appendChild(label);
  }

  brand.appendChild(midi);
  header.appendChild(brand);

  const modes = document.createElement('div');
  modes.className = 'menu-header-modes';
  const modeLabel = document.createElement('span');
  modeLabel.className = 'menu-header-modes-label';
  modeLabel.textContent = 'Modo';
  modes.appendChild(modeLabel);

  const modeList: { key: ViewMode; label: string }[] = [
    { key: 'static', label: 'Estático' },
    { key: 'falling', label: 'Caída' },
  ];
  for (const m of modeList) {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (params.viewMode === m.key ? ' active' : '');
    btn.textContent = m.label;
    btn.onclick = () => params.onViewMode(m.key);
    modes.appendChild(btn);
  }
  header.appendChild(modes);

  const configBtn = document.createElement('button');
  configBtn.type = 'button';
  configBtn.className = 'menu-header-config';
  configBtn.title = 'Configuración';
  configBtn.setAttribute('aria-label', 'Configuración');
  configBtn.innerHTML = GEAR_SVG;
  configBtn.onclick = () => params.onConfig();
  header.appendChild(configBtn);

  return header;
}

function buildBody(params: MenuParams): HTMLElement {
  const body = document.createElement('div');
  body.className = 'menu-body';

  body.appendChild(buildSoundPanel(params));
  body.appendChild(buildSongPanel(params));
  body.appendChild(buildMappingPanel(params));

  return body;
}

function buildSoundPanel(params: MenuParams): HTMLElement {
  const panel = createPanel('Sonido');

  const synthEntries = Object.entries(SYNTHS) as [SynthKey, { label: string }][];
  const instEntries = Object.entries(INSTRUMENTS) as [InstrumentKey, { label: string }][];

  panel.content.appendChild(
    buildSection(
      'Synths',
      synthEntries.map(([k, v]) => [k, v.label]),
      params.synth,
      key => params.onSynth(key as SynthType),
    ),
  );
  panel.content.appendChild(
    buildSection(
      'Instrumentos',
      instEntries.map(([k, v]) => [k, v.label]),
      params.synth,
      key => params.onSynth(key as SynthType),
    ),
  );
  return panel.root;
}

function buildSongPanel(params: MenuParams): HTMLElement {
  const panel = createPanel('Canción');

  if (params.songs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No hay canciones. Agrega un .mid en public/songs/ y recarga.';
    panel.content.appendChild(empty);
    return panel.root;
  }

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
  panel.content.appendChild(list);
  return panel.root;
}

function buildMappingPanel(params: MenuParams): HTMLElement {
  const panel = createPanel('Mapeo');
  for (const s of params.strategies) {
    const btn = document.createElement('button');
    btn.className = 'panel-btn' + (params.currentStrategy === s.key ? ' active' : '');
    btn.textContent = s.label;
    btn.title = s.description;
    btn.onclick = () => params.onStrategy(s.key);
    panel.content.appendChild(btn);
  }
  return panel.root;
}

function createPanel(title: string): { root: HTMLElement; content: HTMLElement } {
  const root = document.createElement('section');
  root.className = 'menu-panel';

  const heading = document.createElement('div');
  heading.className = 'menu-panel-title';
  heading.textContent = title;
  root.appendChild(heading);

  const content = document.createElement('div');
  content.className = 'menu-panel-content';
  root.appendChild(content);

  return { root, content };
}

function buildSection(
  title: string,
  entries: [string, string][],
  activeKey: string,
  onSelect: (key: string) => void,
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'menu-panel-section';

  const heading = document.createElement('div');
  heading.className = 'menu-panel-section-title';
  heading.textContent = title;
  section.appendChild(heading);

  for (const [key, label] of entries) {
    const btn = document.createElement('button');
    btn.className = 'panel-btn' + (activeKey === key ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => onSelect(key);
    section.appendChild(btn);
  }
  return section;
}
