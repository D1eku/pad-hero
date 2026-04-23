# Roadmap

## v1 (actual)
- [x] Selector de canciones desde `public/songs/` via `index.json`
- [x] Parse MIDI (track 0, nota más aguda del acorde)
- [x] Mapeo automático pad por rango de pitch (4 pads)
- [x] Vista estática: tile grande + 3 siguientes + 4 pads + barra de progreso
- [x] Input Web MIDI con detección por nombre (M-VAVE)
- [x] Síntesis simple (Tone.PolySynth)
- [x] Lock de 1s en fallo + X overlay
- [x] Pausa, reiniciar, salir
- [x] Pantalla "Completado"
- [x] Log en consola de noteon para calibración de `padMidiNotes`

## v2 — Sintetizadores
- [x] `src/audio/sampler.ts` genérico con `Tone.Sampler` (lazy-load por instrumento)
- [x] Catálogo en `src/audio/instruments.ts`: piano, guitarra, xilófono, órgano, violín, arpa
- [x] Samples vía CDN de `nbrosowsky/tonejs-instruments` (MIT)
- [x] Selector de sintetizador en el menú (muta `config.synth`, persiste en `localStorage`)
- [x] Fallback al synth simple mientras los samples cargan (evita silencios iniciales)
- [ ] Modo offline: descargar samples de cada instrumento a `public/samples/<inst>/` y apuntar `baseUrl` local
- [ ] Loading indicator visible en UI mientras carga el instrumento seleccionado

## v3 — Selector de track (hecho)
- [x] Pantalla intermedia `ui/track-picker.ts` lista tracks con notas (nombre, instrumento, # de notas)
- [x] Persistencia por canción en `localStorage('pad-hero:track:<path>')` con badge "último"
- [x] Tracks vacíos ocultos (filtrados en `loader.ts`)
- [x] Skip automático si sólo hay un track con notas

## v3.1 — Usabilidad del menú
- [x] Scroll interno en lista de canciones y de tracks cuando hay muchos elementos
- [ ] Búsqueda/filtro por nombre en el selector de canciones
- [ ] Búsqueda/filtro por nombre o instrumento en el selector de tracks

## v4 — Nota del acorde
- [ ] Setting global `chordNote: 'highest' | 'lowest'` en UI de settings
- [ ] Considerar `'multi'`: requiere pulsar múltiples pads simultáneamente para acordes

## v5 — Modo caída (hecho)
- [x] `game-falling.ts`: 4 columnas con tiles apilados, animación por CSS transition en `transform`
- [x] Sin velocidad continua — las notas "caen" al siguiente slot al presionar correctamente
- [x] Línea de acierto visual (borde + glow del accent en la base del área)
- [x] Selector de `viewMode` en el menú, persistido en `localStorage`
- [x] Interfaz común entre vistas: `ui/view.ts` define `GameViewHandle` + `StartView`

## v6 — Mapeo de pads configurable
- [ ] UI de calibración: "Pulsa tus 4 pads en orden" → guarda `padMidiNotes` en localStorage
- [ ] Override de mapeo por canción (permitir decidir qué rango de pitch va a qué pad)

## v7 — Más pads
- [ ] **Selector de cantidad de pads en el menú** (4/8/16), persistido en `localStorage('pad-hero:padCount')`
- [ ] Escalado a 8 pads (split del rango en 8) — estrategias aplican a `config.padCount` en vez de 4 hardcodeado
- [ ] Escalado a 16 pads (los 16 del M-VAVE)
- [ ] Layouts visuales específicos para cada caso (CSS + placement de pads/tiles)
- [ ] Calibración: detectar automáticamente cuántos pads envían notas distintas en una secuencia de pulsos del usuario

## v8 — Scoring & timing
- [x] Streak máxima en sesión + overlay de milestones (25/100/250/500, luego cada 500)
- [ ] Combos y tiempo de reacción por nota
- [ ] Tabla de high scores por canción en localStorage (persistir max streak entre sesiones)
- [ ] **Modo con tempo** opcional: la canción corre según el MIDI original, fallos penalizan pero no detienen

## v9 — Estrategias de mapeo (Strategy pattern)

Objetivo: que la canción sea reconocible al jugarla. Hoy el mapeo lineal concentra muchas notas en el mismo pad cuando el track tiene rango estrecho, y no aprovecha información estructural del MIDI.

Diseño: introducir `src/midi/strategies/` con una interfaz común

```ts
interface MappingStrategy {
  key: string;        // id para config.mappingStrategy
  label: string;      // nombre mostrado en el selector
  needsTrackPick: boolean;  // si true, pasa por track-picker; si no, consume todos los tracks
  buildSteps(midi: LoadedMidi, trackIdx: number | null): Step[];
}
```

Cada estrategia es un archivo aparte. Un registro central (`strategies/index.ts`) las expone y el menú dibuja un selector igual que el de sonido/modo. Persistencia en `localStorage('pad-hero:mappingStrategy')`.

Orden de implementación (cada ítem es una estrategia seleccionable):

- [x] **A. Linear + track picker** (baseline) — extrae nota del acorde según `chordNote`, mapeo lineal min→max. Equivale al comportamiento actual; se consolida dentro de la interfaz.
- [x] **B. Cuantiles + track picker** — ordena pitches únicos por frecuencia de aparición y asigna pads por buckets de ~25% cada uno. Resuelve el caso "todo cae en un pad" en tracks de rango estrecho.
- [x] **C. Cuantiles + colapso de repeticiones** — además de B, fusiona steps consecutivos que caen en el mismo pad en uno solo (evita spam de la misma nota).
- [x] **D. Cuantiles + colapso + cuantización rítmica** — sobre C, cuantiza `time` a corcheas/semicorcheas usando tempo y PPQ del MIDI. Hace que el "sentir" rítmico se conserve al reducir a 4 pads.
- [x] **E. Heurística de melodía multitrack** — ignora el track picker; mezcla todos los tracks y en cada tiempo elige la nota más prominente (tracks con "melody"/"lead"/"vocal" en nombre, mayor velocity, o nota más aguda entre voces activas).
- [x] **F. Conciencia de tonalidad** — detecta tonalidad del MIDI (Krumhansl-Schmuckler) y mapea por grado de escala: tónica → pad 1, 3ª → pad 2, 5ª → pad 3, resto → pad 4.
- [x] **G. Skyline** — nota más aguda de todo el MIDI por tiempo cuantizado. Método clásico MIR.
- [x] **H. Auto-track** — scorea tracks por monofonicidad + entropía de pitch + nombre + velocity, usa el ganador como fuente de la melodía.
- [x] **I. Melody + continuidad** — variante de E con bonus por cercanía al pitch previo. Suaviza saltos entre tiempos.
- [x] **J. Voice stream** — clustering greedy de notas en voces contiguas, usa la voz más larga como melodía.
- [x] **K. Acorde completo (multitrack)** — en cada bucket, usa la nota de melodía para decidir el pad, pero al acertar **dispara todas las notas simultáneas del MIDI** (bajo + armonía + melodía). Cambia el paradigma: el mapeo sólo decide qué pad, no qué suena. Lo que suena es siempre el MIDI completo. Requiere `Step.chordNotes?: string[]` y `playNote` polifónico. Chord limitado a 4 voces para proteger CPU.
- [x] **L. Acorde + Skyline** — lead = nota más aguda; acorde del instante.
- [x] **M. Acorde + Auto-track** — lead del track mejor rankeado; acorde de todo el resto.
- [x] **N. Acorde + Continuidad** — lead con bonus por cercanía al pitch previo; acorde del instante.
- [x] **O. Acorde + Voice stream** — lead de la voz más larga (clustering); acorde de todo lo demás.

Nota de infraestructura: **master limiter** (-3dB) en `audio/master.ts` + `maxPolyphony: 16` (10 en ambient-drone) en cada PolySynth. Previene clipping y click por voice-stealing cuando los acordes + tocadas rápidas acumulan voces.

Notas de implementación:
- `loader.extractSteps` y `mapper.assignPads` pasan a ser utilidades que la estrategia A compone; el resto de estrategias las ignoran o reutilizan parcialmente.
- El track-picker sólo aparece cuando `strategy.needsTrackPick === true`.
- Añadir flag `mappingStrategy: 'linear' | 'quantile' | 'quantile-collapse' | 'quantile-collapse-quantize' | 'melody-multitrack' | 'key-aware'` a `config.ts`.

## v10 — Sonidos personalizados del usuario

Objetivo: que el jugador pueda traer sus propios sonidos, no sólo usar el catálogo fijo. No hay lógica definida aún — esta sección es un espacio de decisiones pendientes para retomar más adelante. Tres caminos, se pueden atacar por separado o combinarse.

### A. Sample packs propios (sampleadores)
- Drag-drop de una carpeta / ZIP con `.mp3` o `.wav` + manifest JSON que mapee nota → archivo.
- Almacenar los blobs en **IndexedDB** (pueden pesar MB, `localStorage` se queda corto).
- Aparecen como instrumentos adicionales en el panel de synths junto a piano/guitarras.
- **Decisiones pendientes**:
  - Formato del manifest: ¿igual al shape de `Tone.Sampler` (`{ urls: { C4: 'file.mp3', ... } }`)? ¿uno propio con más metadata (label, categoría, velocity layers)?
  - Multi-velocity layers: ¿soportar dist. por velocidad o sólo one-shot?
  - Preview antes de activarlo: botón "escuchar" en el menú.
  - Validación: detectar samples rotos y fallback limpio.

### B. Patches sintéticos (synths matemáticos)
- Editor de parámetros sobre Tone.js: oscilador (tipo, detune, count), envolvente ADSR, filtro (tipo, Q, envolvente), cadena de efectos (chorus / delay / reverb / distortion).
- Guardar con nombre en `localStorage('pad-hero:customSynths')` como JSON.
- Aparecen junto a synthwave/juno-pad/fm-dx7 en el panel.
- **Decisiones pendientes**:
  - UI: ¿sliders visuales con preview en vivo, o editor JSON crudo? (empezar por JSON es más rápido; sliders son la buena UX).
  - Hasta qué profundidad exponer Tone.js (algunas clases tienen 20+ parámetros — curar un subset).
  - Export/import como JSON para compartir presets entre usuarios.
  - Poder derivar un nuevo synth a partir de uno existente ("duplicar y modificar").

### C. Import desde URL de preset
- Pegar URL a un JSON público (gist, pastebin) → se carga como opción.
- Más barato de implementar que A o B, pero requiere que A o B defina el schema primero.
- Útil para compartir configuraciones sin tener que publicar samples pesados.

### Consideraciones transversales
- El panel de synths (actual) necesitaría una sección **"Míos"** separada de Synths / Instrumentos, con controles de borrar / renombrar / duplicar.
- Cuota de `IndexedDB`: algunos navegadores empiezan a pedir permiso a partir de ~50MB. Avisar antes de cargar paquetes grandes.
- Migración: cambios de formato del manifest obligarán a versionar presets guardados (`version: 1` en el JSON).
- Riesgo principal: un sample o patch roto puede meter ruido o colgar la UI. Todas las rutas deben tener error handling que no rompa el juego en curso — sólo deshabilitar el synth malo y seguir.
- Precedencia sobre samples de CDN: los del usuario deberían cargar primero si comparten key con uno built-in.

## v11 — Modo casual (pianola)

Objetivo: un modo secundario donde cualquier pad avanza al siguiente tiempo y dispara todo el contenido del MIDI en ese instante. Deja de ser un juego de precisión; es más bien una "pianola interactiva" para escuchar la canción a tu propio ritmo sin estresarte.

### Diseño
- Toggle en el menú (junto a `viewMode`): Normal / Casual. Persistir en `localStorage`.
- En modo casual:
  - Cualquier pad presionado avanza `stepIndex` y dispara `playNote(step.chordNotes ?? step.noteName, duration)`.
  - Sin lógica de miss/lock. Sin streak. (O streak sigue contando pero es trivialmente infinita — quizás ocultarla.)
  - Visualmente indicar que estás en casual (badge arriba).
- Estrategia recomendada por defecto en casual: `chord-multitrack` (ya suena todo).

### Decisiones pendientes
- ¿Desactivar milestones en casual? (son irrelevantes si no hay error posible).
- ¿Mantener animación de hit del pad correcto, o resaltar siempre el pad esperado para guiar?
- ¿Permitir saltar hacia atrás (pad que retrocede step)?
- Compatibilidad con vista caída: los tiles siguen bajando como siempre, cualquier pad los "absorbe".
