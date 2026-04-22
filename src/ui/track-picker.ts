import type { TrackInfo } from '../midi/loader';

export interface TrackPickerParams {
  songName: string;
  tracks: TrackInfo[];
  selectedIdx: number | null;
  onPick: (idx: number) => void;
  onBack: () => void;
}

export function renderTrackPicker(root: HTMLElement, p: TrackPickerParams): void {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-track-picker';

  const h1 = document.createElement('h1');
  h1.textContent = 'Elige el track';
  container.appendChild(h1);

  const subtitle = document.createElement('p');
  subtitle.className = 'song-title';
  subtitle.textContent = p.songName;
  container.appendChild(subtitle);

  const hint = document.createElement('p');
  hint.className = 'picker-hint';
  hint.textContent = 'Normalmente la melodía es el track con más notas de un instrumento melódico (piano, voz, violín). La batería y el bajo suelen sonar raro.';
  container.appendChild(hint);

  const list = document.createElement('ul');
  list.className = 'track-list';
  for (const t of p.tracks) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'track-btn' + (t.idx === p.selectedIdx ? ' last-played' : '');
    btn.onclick = () => p.onPick(t.idx);

    const idx = document.createElement('div');
    idx.className = 'track-idx';
    idx.textContent = `#${t.idx}`;

    const info = document.createElement('div');
    info.className = 'track-info';
    const name = document.createElement('div');
    name.className = 'track-name';
    name.textContent = t.name;
    const meta = document.createElement('div');
    meta.className = 'track-meta';
    meta.textContent = `${t.instrument} · ${t.noteCount} notas`;
    info.appendChild(name);
    info.appendChild(meta);

    btn.appendChild(idx);
    btn.appendChild(info);

    if (t.idx === p.selectedIdx) {
      const badge = document.createElement('div');
      badge.className = 'track-badge';
      badge.textContent = 'último';
      btn.appendChild(badge);
    }

    li.appendChild(btn);
    list.appendChild(li);
  }
  container.appendChild(list);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.textContent = 'Volver al menú';
  backBtn.onclick = p.onBack;
  container.appendChild(backBtn);

  root.appendChild(container);
}
