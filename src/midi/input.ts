import { config } from '../config';
import type { MidiStatus } from '../types';

export type PadHitHandler = (padIndex: number) => void;
export type MidiStateListener = (status: MidiStatus) => void;

const SAVED_DEVICE_KEY = 'pad-hero:midiDeviceName';

let access: MIDIAccess | null = null;
let currentHandler: PadHitHandler | null = null;
let selectedInput: MIDIInput | null = null;
let stateListener: MidiStateListener | null = null;
let lastError: string | null = null;

function isThrough(name: string | null | undefined): boolean {
  return !!name && /midi through/i.test(name);
}

function listAllInputs(): MIDIInput[] {
  if (!access) return [];
  return [...access.inputs.values()];
}

function listSelectableInputs(): MIDIInput[] {
  return listAllInputs().filter(i => !isThrough(i.name) && i.state === 'connected');
}

function computeStatus(): MidiStatus {
  const selectable = listSelectableInputs();
  const devices = selectable.map(i => ({ id: i.id, name: i.name ?? 'MIDI device' }));
  if (!selectedInput || selectedInput.state !== 'connected') {
    return {
      ok: false,
      error: lastError ?? (devices.length === 0
        ? 'Ningún dispositivo MIDI conectado.'
        : 'Selecciona un dispositivo MIDI.'),
      devices,
      selectedId: null,
    };
  }
  return {
    ok: true,
    deviceName: selectedInput.name ?? 'MIDI device',
    devices,
    selectedId: selectedInput.id,
  };
}

function emit(): void {
  stateListener?.(computeStatus());
}

function handleMessage(ev: MIDIMessageEvent): void {
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
}

function attachInput(input: MIDIInput): void {
  if (selectedInput && selectedInput !== input) {
    selectedInput.onmidimessage = null;
  }
  selectedInput = input;
  input.onmidimessage = handleMessage;
  if (input.name) localStorage.setItem(SAVED_DEVICE_KEY, input.name);
  console.log(`[MIDI] usando dispositivo: "${input.name}"`);
}

function detachInput(): void {
  if (selectedInput) {
    selectedInput.onmidimessage = null;
    selectedInput = null;
  }
}

function pickAutoInput(): MIDIInput | null {
  const inputs = listSelectableInputs();
  if (inputs.length === 0) return null;
  const savedName = localStorage.getItem(SAVED_DEVICE_KEY);
  if (savedName) {
    const byName = inputs.find(i => i.name === savedName);
    if (byName) return byName;
  }
  const hint = config.midiDeviceNameHint.toLowerCase();
  const byHint = inputs.find(i => i.name?.toLowerCase().includes(hint));
  if (byHint) return byHint;
  return inputs[0];
}

export function selectMidiDevice(id: string): void {
  if (!access) return;
  const input = listAllInputs().find(i => i.id === id);
  if (input && !isThrough(input.name)) {
    attachInput(input);
    emit();
  }
}

export function subscribeMidiState(cb: MidiStateListener | null): void {
  stateListener = cb;
}

export function getMidiStatus(): MidiStatus {
  return computeStatus();
}

export async function initMidi(): Promise<MidiStatus> {
  if (!('requestMIDIAccess' in navigator)) {
    console.warn('[MIDI] requestMIDIAccess no existe — navegador no soporta Web MIDI');
    lastError = 'Web MIDI API no soportada en este navegador';
    return computeStatus();
  }
  try {
    access = await navigator.requestMIDIAccess();
    console.log('[MIDI] requestMIDIAccess OK');
  } catch (e) {
    console.error('[MIDI] requestMIDIAccess falló', e);
    lastError = `Acceso MIDI denegado: ${(e as Error).message}`;
    return computeStatus();
  }

  access.onstatechange = (ev: MIDIConnectionEvent) => {
    const p = ev.port;
    if (p) {
      console.log(`[MIDI] statechange: "${p.name}" type=${p.type} state=${p.state} conn=${p.connection}`);
    }
    if (selectedInput && selectedInput.state !== 'connected') {
      detachInput();
    }
    if (!selectedInput) {
      const auto = pickAutoInput();
      if (auto) attachInput(auto);
    }
    emit();
  };

  const allInputs = listAllInputs();
  console.log(
    `[MIDI] ${allInputs.length} input(s) detectado(s): ` +
      (allInputs.length
        ? allInputs
            .map(i => `"${i.name ?? '?'}" (manuf="${i.manufacturer ?? '?'}", state=${i.state})`)
            .join(' | ')
        : '<ninguno>')
  );

  const auto = pickAutoInput();
  if (auto) attachInput(auto);

  lastError = null;
  return computeStatus();
}

export function setPadHitHandler(handler: PadHitHandler | null): void {
  currentHandler = handler;
}
