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
- [ ] Escalado a 8 pads (split del rango en 8)
- [ ] Escalado a 16 pads (los 16 del M-VAVE)
- [ ] Layouts visuales específicos para cada caso

## v8 — Scoring & timing
- [ ] Combos, tiempo de reacción por nota, streak máxima
- [ ] Tabla de high scores por canción en localStorage
- [ ] **Modo con tempo** opcional: la canción corre según el MIDI original, fallos penalizan pero no detienen
