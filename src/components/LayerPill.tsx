import type { Layer } from '@/lib/types';
import { LAYER_LABELS } from '@/lib/types';

export function LayerPill({ layer }: { layer: Layer }) {
  const cls: Record<Layer, string> = {
    inner: 'bg-[var(--color-warm-soft)] text-[var(--color-warm-ink)]',
    close: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]',
    good: 'bg-[var(--color-good-soft)] text-[var(--color-good)]',
    acquaintance: 'bg-[var(--color-bg-sunken)] text-[var(--color-ink-faint)]',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls[layer]}`}>
      {LAYER_LABELS[layer]}
    </span>
  );
}
