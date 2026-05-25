import type { Layer } from '@/lib/types';
import { LAYER_LABELS } from '@/lib/types';

export function LayerPill({ layer }: { layer: Layer }) {
  const cls: Record<Layer, string> = {
    inner: 'bg-[var(--color-warm-soft)] text-[var(--color-warm)]',
    close: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    good: 'bg-stone-100 text-stone-700',
    acquaintance: 'bg-stone-50 text-stone-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls[layer]}`}>
      {LAYER_LABELS[layer]}
    </span>
  );
}
