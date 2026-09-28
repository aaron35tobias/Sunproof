// Pre-shift inspection checkpoints. Supervisors edit the list; it is stored on the server
// (InspectionTemplate) and cached here so workers can still see it offline.
import type { Checkpoint } from '@/types';

export const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  { id: 'ppe', label: 'PPE available and correctly worn' },
  { id: 'equipment', label: 'Tools and equipment inspected' },
  { id: 'access', label: 'Access routes and exits clear' },
  { id: 'heat_plan', label: 'Heat controls and water available' },
];

export const MAX_CHECKPOINT_LENGTH = 160;
const CACHE_KEY = 'fieldguard_checkpoints';

export function cachedCheckpoints(): Checkpoint[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return Array.isArray(saved) ? saved : DEFAULT_CHECKPOINTS;
  } catch { return DEFAULT_CHECKPOINTS; }
}

export function cacheCheckpoints(list: Checkpoint[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* storage blocked */ }
}
