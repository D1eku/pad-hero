import type { Step } from '../../types';
import type { LoadedMidi } from '../loader';

export interface MappingStrategy {
  key: string;
  label: string;
  description: string;
  needsTrackPick: boolean;
  buildSteps(midi: LoadedMidi, trackIdx: number | null): Step[];
}
