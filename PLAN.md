# Plan: pad-hero

Juego tipo Piano Tiles / Guitar Hero para teclado MIDI. Avanza nota a nota al pulsar el pad correcto — no hay tempo, la canción espera por ti.

## Stack
- **Vite + TypeScript** (vanilla, sin React)
- **Tone.js** — síntesis y scheduling de audio
- **@tonejs/midi** — parser de archivos `.mid`
- **Web MIDI API** (nativo del navegador) — entrada del teclado
- **DOM + CSS** — UI

## Estructura

```
pad-hero/
├── public/songs/           # .mid files + index.json
├── src/
│   ├── main.ts             # entry + router entre vistas (menu → game → end)
│   ├── types.ts            # Step, SongInfo, MidiStatus
│   ├── config.ts           # feature flags + roadmap de configuración futura
│   ├── styles.css
│   ├── midi/
│   │   ├── loader.ts       # fetch + parse .mid → Step[]
│   │   ├── mapper.ts       # asigna pad 0..3 por rango de pitch
│   │   └── input.ts        # Web MIDI → onPadHit (+ log de noteon al console)
│   ├── audio/
│   │   ├── engine.ts       # Tone.start() en user gesture
│   │   ├── synth.ts        # Tone.PolySynth (v1, en uso)
│   │   ├── piano.ts        # stub para Sampler + soundfont (v2)
│   │   └── index.ts        # dispatcher según config.synth
│   ├── game/
│   │   ├── state.ts        # GameState + currentStep/upcomingSteps
│   │   ├── controller.ts   # onPadHit → advance | miss | completed
│   │   └── progress.ts     # %
│   └── ui/
│       ├── view.ts         # tipos compartidos (GameViewHandle, StartView, PAD_COLORS)
│       ├── menu.ts         # selector canción + estado MIDI + selector de modo
│       ├── track-picker.ts # pantalla intermedia de selección de track MIDI
│       ├── game-static.ts  # vista estática
│       ├── game-falling.ts # vista con caída (4 columnas, tiles que bajan al acertar)
│       └── end.ts          # "Completado"
├── PLAN.md
└── ROADMAP.md
```

## Flujo

1. **Bootstrap** (`main.ts`): `initMidi()` pide permiso al navegador y engancha el primer input cuyo nombre contenga "M-VAVE" (config `midiDeviceNameHint`); si no, el primer input disponible.
2. **Menú**: lista canciones desde `public/songs/index.json`. Click → `goGame(song)`.
3. **Carga**:
   - `ensureAudioStarted()` desbloquea audio (política de autoplay exige user gesture).
   - `loadMidiFile` parsea el `.mid` → `Step[]`. De cada acorde toma la nota más aguda.
   - `assignPads` divide el rango de pitch de la canción en 4 buckets → pad 0..3.
4. **Game loop** (event-driven, sin tempo):
   - `setPadHitHandler(onPadHit)` engancha el dispatcher.
   - Pad correcto → `playNote` + `stepIndex++` + re-render.
   - Pad incorrecto → X overlay + `locked = true` por `mistakeLockMs` (1000 ms). Sin sonido.
   - Última nota → vista final.
5. **Final**: "¡Completado!" con "Jugar de nuevo" y "Volver al menú".

## Mapeo MIDI pad → índice

Los pads del M-VAVE SMK-II 25 envían notas MIDI específicas. `config.padMidiNotes` es un array de 4 valores para los pads 1-4.

**Calibración**: `midi/input.ts` hace `console.log` de cada noteon. Conecta el teclado, abre DevTools (F12) → Console, pulsa los 4 pads y anota los números. Actualiza `config.padMidiNotes`.

Valores iniciales: `[36, 37, 38, 39]` — comunes en pads estilo GM drum kit.

## Decisiones registradas (revisitables en `config.ts`)

| Flag | Valor actual | Plan futuro |
|---|---|---|
| `synth` | `'simple'` (PolySynth) | v2: `'piano'` con Sampler + soundfont, selector UI |
| `trackIndex` | sin uso directo — ahora el usuario elige en UI, elección guardada en `localStorage('pad-hero:track:<path>')` | — |
| `chordNote` | `'highest'` | v4: selector (más grave / multi-pad) |
| `viewMode` | `'static'` (default) | `'falling'` ya disponible — selector en el menú, persiste en localStorage |
| `padCount` | `4` | v7: 8, 16 |
| `mistakeLockMs` | `1000` | config avanzada |
| `padMidiNotes` | `[36..39]` | v6: UI de calibración + persistencia |

## Correr

```bash
npm run dev      # dev server localhost:5173 + HMR
npm run build    # tsc + vite build
npm run preview  # preview del bundle de producción
```

Navegadores soportados:
- **Chrome, Edge (y derivados Chromium — Brave, Opera, Vivaldi)**: funciona out-of-the-box. Al entrar al menú muestran un prompt estándar de permiso, se acepta y listo.
- **Firefox**: requiere activar `dom.webmidi.enabled` en `about:config` **y** puede seguir exigiendo un site-permission add-on. Para dev local se recomienda usar Chrome/Edge.
- **Safari**: no soporta Web MIDI API. No funciona.

El primer clic en una canción desbloquea el audio (política de autoplay).

## Añadir canciones

**Suelta un `.mid` o `.midi` en `public/songs/` y recarga.** Se detecta automáticamente.

Cómo: un plugin en `vite.config.ts` (`pad-hero:songs-index`) sirve `/songs/index.json` dinámicamente en dev a partir del contenido real de la carpeta, y lo escribe en `dist/songs/index.json` al hacer build. El nombre de cada canción se deriva del filename (guiones/underscores → espacios, sin extensión).

## Notas técnicas

- **No hay tempo**: el tiempo del MIDI se usa sólo para ordenar las notas y para determinar duración. La progresión entre notas depende 100% del jugador.
- **Acordes**: se colapsan a una sola nota (la más aguda por defecto). El tiempo de las notas simultáneas se quantiza a ms para agrupar correctamente.
- **Lock tras fallo**: durante `mistakeLockMs`, `onPadHit` retorna temprano. Una vez liberado, el jugador puede seguir intentando.
