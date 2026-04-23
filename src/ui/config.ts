export interface ConfigParams {
  padNotes: number[];
  onAssign: (padIndex: number, note: number) => void;
  onReset: () => void;
  onBack: () => void;
  setMidiNoteListener: (cb: ((note: number) => void) | null) => void;
}

export function renderConfig(root: HTMLElement, p: ConfigParams): void {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-config';

  const h1 = document.createElement('h1');
  h1.textContent = 'Configurar pads';
  container.appendChild(h1);

  const hint = document.createElement('p');
  hint.className = 'picker-hint';
  hint.textContent =
    'Haz clic en un pad y toca la tecla o pad del controlador MIDI que quieras asignar. Esc para cancelar.';
  container.appendChild(hint);

  let listeningPad: number | null = null;
  const cards: HTMLButtonElement[] = [];

  const currentNotes = [...p.padNotes];

  function paint(): void {
    for (let i = 0; i < 4; i++) {
      const card = cards[i];
      const noteEl = card.querySelector('.config-pad-note') as HTMLElement;
      if (listeningPad === i) {
        card.classList.add('listening');
        noteEl.textContent = 'Esperando nota…';
      } else {
        card.classList.remove('listening');
        noteEl.textContent = `MIDI ${currentNotes[i]}`;
      }
    }
  }

  function stopListening(): void {
    listeningPad = null;
    p.setMidiNoteListener(null);
    paint();
  }

  function startListening(i: number): void {
    listeningPad = i;
    p.setMidiNoteListener((note) => {
      const dupIdx = currentNotes.findIndex((n, idx) => idx !== i && n === note);
      if (dupIdx >= 0) {
        currentNotes[dupIdx] = currentNotes[i];
        p.onAssign(dupIdx, currentNotes[dupIdx]);
      }
      currentNotes[i] = note;
      p.onAssign(i, note);
      stopListening();
    });
    paint();
  }

  const grid = document.createElement('div');
  grid.className = 'config-pads';
  for (let i = 0; i < 4; i++) {
    const btn = document.createElement('button');
    btn.className = 'config-pad';
    btn.type = 'button';
    btn.innerHTML = `
      <div class="config-pad-label">Pad ${i + 1}</div>
      <div class="config-pad-note"></div>
    `;
    btn.onclick = () => {
      if (listeningPad === i) stopListening();
      else startListening(i);
    };
    cards.push(btn);
    grid.appendChild(btn);
  }
  container.appendChild(grid);
  paint();

  const actions = document.createElement('div');
  actions.className = 'config-actions';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'back-btn';
  resetBtn.textContent = 'Restaurar defaults';
  resetBtn.onclick = () => {
    cleanup();
    p.onReset();
  };
  actions.appendChild(resetBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.textContent = 'Volver al menú';
  backBtn.onclick = () => {
    cleanup();
    p.onBack();
  };
  actions.appendChild(backBtn);

  container.appendChild(actions);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && listeningPad !== null) {
      e.preventDefault();
      stopListening();
    }
  };
  window.addEventListener('keydown', onKey);

  function cleanup(): void {
    stopListening();
    window.removeEventListener('keydown', onKey);
  }

  root.appendChild(container);
}
