# Pad Hero

Juego musical tipo *Guitar Hero* / *Piano Tiles* que se juega con los **pads de un controlador MIDI**. Eliges una canción (un archivo `.mid`), el juego reparte sus notas entre 4 pads y tú las tocas una por una para que la canción avance.

No hay tempo ni límite de tiempo: **la canción espera por ti**. Cada acierto hace sonar la nota siguiente de la melodía, así que al tocar bien vas "interpretando" la canción con tus pads.

## Qué hace

- Lee archivos MIDI y extrae la melodía del track que elijas.
- Reparte las notas entre 4 pads según su altura. Hay varias estrategias de reparto (por cuantiles, *skyline*, continuidad melódica, acordes, etc.) que se eligen en el menú.
- Suena con más de 30 sintetizadores e instrumentos: piano, guitarra, violín, arpa, órgano, synthwave, acid 303, supersaw, presets inspirados en Daft Punk y más.
- Tiene dos vistas: **estática** (una nota grande con las siguientes en fila) y **caída** (4 columnas donde las notas bajan al acertar).
- Lleva la racha de aciertos y muestra hitos (25, 100, 250, 500…).
- Guarda en el navegador tus preferencias: dispositivo MIDI, instrumento, vista, estrategia, track por canción y asignación de pads.

## Requisitos

- **Un controlador MIDI con al menos 4 pads o teclas.** Se desarrolló con un M-VAVE SMK-25 II, pero sirve cualquier teclado o pad controller USB/Bluetooth MIDI. **Sin un dispositivo MIDI no se puede jugar**: los pads no responden al teclado ni al mouse.
- **Un navegador con Web MIDI API**: Chrome, Edge u Opera (ver [Compatibilidad](#compatibilidad)).
- **Node.js 20.19+ o 22.12+** y npm, para ejecutarlo en local (lo exige Vite 8).
- **Conexión a internet** para los instrumentos basados en samples (piano, guitarra, violín, etc.), que se descargan desde un CDN. Los sintetizadores funcionan sin conexión.

## Cómo iniciarlo

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto [http://localhost:5173](http://localhost:5173)).

Para una build de producción:

```bash
npm run build
npm run preview
```

## Cómo se juega

1. **Conecta el controlador MIDI antes de abrir la página** y acepta el permiso de MIDI cuando el navegador lo pida.
2. En el menú, revisa que tu dispositivo aparezca seleccionado. Si hay varios, elige el correcto.
3. **Configura tus pads** (solo la primera vez): pulsa el engranaje ⚙, haz clic en cada pad en pantalla y toca el pad físico que quieres asignarle. Por defecto se usan las notas MIDI 36, 37, 38 y 39.
4. Elige la vista, el instrumento y la estrategia de mapeo, y luego una canción.
5. Si el MIDI tiene varios tracks, elige el que tenga la melodía. El juego recuerda tu elección para esa canción.
6. **Toca el pad que indica la nota actual.**
   - Si aciertas, suena la nota y avanzas.
   - Si fallas, aparece una ✗ y los pads se bloquean 1 segundo.
7. Usa **Pausa**, **Reiniciar** y **Salir** cuando quieras. Al terminar la canción puedes volver a jugarla o regresar al menú.

### Agregar canciones

Copia cualquier archivo `.mid` o `.midi` en `public/songs/`. Aparece en el menú automáticamente, sin tocar ninguna configuración. Más detalles en [`public/songs/README.md`](public/songs/README.md).

Funcionan mejor los MIDIs con una melodía clara de un solo instrumento.

## Compatibilidad

| Navegador | Estado |
| --- | --- |
| Chrome / Edge / Opera (escritorio) | ✅ Soportado |
| Chrome en Android | ✅ Debería funcionar con un controlador MIDI USB (OTG) |
| Firefox | ⚠️ Soporta Web MIDI desde la versión 108, pero exige un permiso de sitio extra. No se ha probado |
| Safari (macOS / iOS) | ❌ No soporta Web MIDI API |

- El navegador solo da acceso a Web MIDI en `localhost` o por **HTTPS**.
- El audio arranca después de la primera interacción con la página (política de autoplay de los navegadores).

## Stack

Vite · TypeScript (vanilla, sin framework) · [Tone.js](https://tonejs.github.io/) · [@tonejs/midi](https://github.com/Tonejs/Midi) · Web MIDI API

## Licencia

El código de este proyecto usa la licencia [Apache 2.0](LICENSE). Puedes usarlo, modificarlo, hacer fork y usarlo con fines comerciales, siempre que **mantengas el archivo [`NOTICE`](NOTICE) y des crédito visible al autor original** ([D1eku](https://github.com/D1eku)).

**Ojo con las canciones:** los archivos MIDI de `public/songs/` son transcripciones de canciones con derechos de autor (Daft Punk, Queen, Radiohead, bandas sonoras, etc.) y **no están cubiertos por la licencia Apache**. Se incluyen solo como ejemplo para uso personal. Si vas a distribuir o monetizar el juego, quítalos y usa canciones de dominio público o con licencia adecuada.
