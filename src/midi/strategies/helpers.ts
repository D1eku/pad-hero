import type { Step } from '../../types';

interface TrackLike {
  name?: string;
  channel: number;
  instrument: { percussion: boolean; family: string; name?: string };
  notes: ReadonlyArray<{ midi: number; time: number; duration: number; name: string; velocity: number }>;
}

export function isPercussion(track: TrackLike): boolean {
  if (track.channel === 9) return true;
  if (track.instrument?.percussion) return true;
  const fam = track.instrument?.family?.toLowerCase() ?? '';
  if (fam === 'drums') return true;
  const name = (track.name ?? '').toLowerCase();
  return /drum|perc|batter[ií]a/.test(name);
}

export function isBassLike(track: TrackLike): boolean {
  const fam = track.instrument?.family?.toLowerCase() ?? '';
  if (fam === 'bass') return true;
  const name = (track.name ?? '').toLowerCase();
  return /\bbass\b|\bbajo\b/.test(name);
}

export function isMelodyName(name: string): boolean {
  const t = name.toLowerCase();
  return /melody|melod[ií]a|lead|vocal|solo|voice|voz|main/.test(t);
}

export function collapseRepeats(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.pad === s.pad) last.duration += s.duration;
    else out.push(s);
  }
  return out;
}

export function collapseChordRepeats(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.pad === s.pad) {
      last.duration += s.duration;
      if (s.chordNotes) {
        const merged = new Set([...(last.chordNotes ?? []), ...s.chordNotes]);
        last.chordNotes = [...merged];
      }
    } else {
      out.push(s);
    }
  }
  return out;
}

const MAX_CHORD_VOICES = 4;

export function chordFromCandidates(candidates: { pitch: number; name: string }[]): string[] {
  const sorted = [...candidates].sort((a, b) => b.pitch - a.pitch);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of sorted) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    out.push(c.name);
    if (out.length >= MAX_CHORD_VOICES) break;
  }
  return out;
}
