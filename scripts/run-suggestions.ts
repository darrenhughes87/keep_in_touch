// Recompute today's suggestions. Run nightly at 06:30.
import { computeSuggestionsFor } from '@/lib/queries';
import { todayIso } from '@/lib/time';

const out = computeSuggestionsFor(todayIso());
console.log(`[suggestions] computed ${out.length} for ${todayIso()}`);
