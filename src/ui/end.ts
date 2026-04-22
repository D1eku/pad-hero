export interface EndCallbacks {
  onMenu: () => void;
  onReplay: () => void;
}

export function renderEnd(root: HTMLElement, songName: string, cb: EndCallbacks): void {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-end';

  const h1 = document.createElement('h1');
  h1.textContent = '¡Completado!';
  container.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = songName;
  container.appendChild(p);

  const btns = document.createElement('div');
  btns.className = 'controls';
  const replay = document.createElement('button');
  replay.textContent = 'Jugar de nuevo';
  replay.onclick = cb.onReplay;
  const menu = document.createElement('button');
  menu.textContent = 'Volver al menú';
  menu.onclick = cb.onMenu;
  btns.appendChild(replay);
  btns.appendChild(menu);
  container.appendChild(btns);

  root.appendChild(container);
}
