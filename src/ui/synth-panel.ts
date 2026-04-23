import { SYNTHS, type SynthKey, type SynthType } from '../audio/synths';
import { INSTRUMENTS, type InstrumentKey } from '../audio/instruments';

export interface SynthPanelHandle {
  element: HTMLElement;
  setActive: (key: SynthType) => void;
}

export function createSynthPanel(
  initial: SynthType,
  onSelect: (key: SynthType) => void,
): SynthPanelHandle {
  const panel = document.createElement('div');
  panel.className = 'synth-panel';

  const buttons = new Map<SynthType, HTMLButtonElement>();

  function highlight(key: SynthType) {
    for (const [k, b] of buttons) b.classList.toggle('active', k === key);
  }

  function makeButton(key: SynthType, label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'synth-btn';
    btn.textContent = label;
    btn.onclick = () => {
      highlight(key);
      onSelect(key);
    };
    if (key === initial) btn.classList.add('active');
    buttons.set(key, btn);
    return btn;
  }

  function makeSection(title: string, entries: [SynthType, string][]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'synth-panel-section';
    const heading = document.createElement('div');
    heading.className = 'synth-panel-section-title';
    heading.textContent = title;
    section.appendChild(heading);
    for (const [key, label] of entries) section.appendChild(makeButton(key, label));
    return section;
  }

  const synthEntries: [SynthType, string][] = (
    Object.entries(SYNTHS) as [SynthKey, { label: string }][]
  ).map(([k, v]) => [k, v.label]);
  const instEntries: [SynthType, string][] = (
    Object.entries(INSTRUMENTS) as [InstrumentKey, { label: string }][]
  ).map(([k, v]) => [k, v.label]);

  panel.appendChild(makeSection('Synths', synthEntries));
  panel.appendChild(makeSection('Instrumentos', instEntries));

  return {
    element: panel,
    setActive: highlight,
  };
}
