import { linearStrategy } from './linear';
import { quantileStrategy } from './quantile';
import { quantileCollapseStrategy } from './quantile-collapse';
import { quantizedCollapseStrategy } from './quantized-collapse';
import { melodyMultitrackStrategy } from './melody-multitrack';
import { skylineStrategy } from './skyline';
import { autoTrackStrategy } from './auto-track';
import { melodyContinuityStrategy } from './melody-continuity';
import { voiceStreamStrategy } from './voice-stream';
import { keyAwareStrategy } from './key-aware';
import { chordMultitrackStrategy } from './chord-multitrack';
import { chordSkylineStrategy } from './chord-skyline';
import { chordAutoTrackStrategy } from './chord-auto-track';
import { chordContinuityStrategy } from './chord-continuity';
import { chordVoiceStreamStrategy } from './chord-voice-stream';
import type { MappingStrategy } from './types';

export const STRATEGIES: MappingStrategy[] = [
  linearStrategy,
  quantileStrategy,
  quantileCollapseStrategy,
  quantizedCollapseStrategy,
  melodyMultitrackStrategy,
  skylineStrategy,
  autoTrackStrategy,
  melodyContinuityStrategy,
  voiceStreamStrategy,
  keyAwareStrategy,
  chordMultitrackStrategy,
  chordSkylineStrategy,
  chordAutoTrackStrategy,
  chordContinuityStrategy,
  chordVoiceStreamStrategy,
];

const byKey = new Map(STRATEGIES.map(s => [s.key, s]));

export function getStrategy(key: string): MappingStrategy {
  return byKey.get(key) ?? linearStrategy;
}

export type { MappingStrategy };
