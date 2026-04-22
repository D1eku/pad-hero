# Canciones

**Sólo suelta archivos `.mid` (o `.midi`) en esta carpeta.** Se detectan automáticamente — no hay que tocar ningún JSON.

El nombre mostrado en el menú se deriva del nombre del archivo:
- `Beethoven-Moonlight-Sonata.mid` → `Beethoven Moonlight Sonata`
- `twinkle_twinkle.mid` → `twinkle twinkle`

Los guiones bajos y medios se convierten a espacios; la extensión se quita.

## Cómo funciona

`vite.config.ts` incluye un plugin (`pad-hero:songs-index`) que:
- En `npm run dev`: intercepta las peticiones a `/songs/index.json` y responde con el listado actual de la carpeta.
- En `npm run build`: escribe `dist/songs/index.json` al final del build.

Los archivos `.mid` se sirven tal cual (como cualquier archivo de `public/`).

## De dónde sacar MIDIs

- https://bitmidi.com/
- https://freemidi.org/
- https://musescore.com/ (exporta a MIDI)

Las mejores canciones para empezar son las que tienen una **línea de melodía pura**: un solo instrumento, notas mayormente no solapadas. Si un MIDI viene con muchos tracks y la melodía no está en el track 0, cambia `config.trackIndex` en `src/config.ts`. En v3 esto se hará desde la UI.
