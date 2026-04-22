import { config } from '../config';
import type { MidiStatus } from '../types';

export type PadHitHandler = (padIndex: number) => void;

let currentHandler: PadHitHandler | null = null;

export async function initMidi(): Promise<MidiStatus> {
  if (!('requestMIDIAccess' in navigator)) {
    console.warn('[MIDI] requestMIDIAccess no existe — navegador no soporta Web MIDI');
    return { ok: false, error: 'Web MIDI API no soportada en este navegador' };
  }
  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess();
    console.log('[MIDI] requestMIDIAccess OK');
  } catch (e) {
    console.error('[MIDI] requestMIDIAccess falló', e);
    return { ok: false, error: `Acceso MIDI denegado: ${(e as Error).message}` };
  }

  access.onstatechange = (ev: MIDIConnectionEvent) => {
    const p = ev.port;
    if (!p) return;
    console.log(`[MIDI] statechange: "${p.name}" type=${p.type} state=${p.state} conn=${p.connection}`);
  };

  const allInputs = [...access.inputs.values()];
  console.log(
    `[MIDI] ${allInputs.length} input(s) detectado(s): ` +
      (allInputs.length
        ? allInputs
            .map(i => `"${i.name ?? '?'}" (manuf="${i.manufacturer ?? '?'}", state=${i.state}, conn=${i.connection})`)
            .join(' | ')
        : '<ninguno>')
  );

  let chosen: MIDIInput | null = null;
  const hint = config.midiDeviceNameHint.toLowerCase();
  for (const input of allInputs) {
    if (input.name?.toLowerCase().includes(hint)) {
      chosen = input;
      console.log(`[MIDI] match por hint "${config.midiDeviceNameHint}": "${input.name}"`);
      break;
    }
  }
  if (!chosen && allInputs.length > 0) {
    chosen = allInputs[0];
    console.log(`[MIDI] sin match con hint — usando primer input: "${chosen.name}"`);
  }
  if (!chosen) {
    return {
      ok: false,
      error:
        'Ningún dispositivo MIDI conectado. Conéctalo, refresca la pestaña y acepta el permiso.',
    };
  }

  chosen.onmidimessage = (ev: MIDIMessageEvent) => {
    const data = ev.data;
    if (!data || data.length < 3) return;
    const status = data[0];
    const note = data[1];
    const velocity = data[2];
    const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
    if (!isNoteOn) return;
    console.log(`[MIDI] noteon note=${note} vel=${velocity}`);
    const padIndex = config.padMidiNotes.indexOf(note);
    if (padIndex >= 0 && currentHandler) {
      currentHandler(padIndex);
    }
  };

  return { ok: true, deviceName: chosen.name ?? 'MIDI device' };
}

export function setPadHitHandler(handler: PadHitHandler | null) {
  currentHandler = handler;
}
