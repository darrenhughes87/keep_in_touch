import type { Person } from '@/lib/types';

const PALETTE = [
  'oklch(85% 0.08 30)',
  'oklch(85% 0.08 80)',
  'oklch(85% 0.08 130)',
  'oklch(85% 0.08 180)',
  'oklch(85% 0.08 230)',
  'oklch(85% 0.08 280)',
  'oklch(85% 0.08 330)',
];

export function PersonAvatar({ person, size = 48 }: { person: Pick<Person, 'name' | 'photo_path' | 'id'>; size?: number }) {
  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const colour = PALETTE[person.id % PALETTE.length];

  if (person.photo_path) {
    // Cache-bust on photo_path change so freshly uploaded photos appear immediately.
    const v = encodeURIComponent(person.photo_path);
    return (
      <img
        src={`/api/photo/${person.id}?v=${v}`}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{ width: size, height: size, background: colour, fontSize: size * 0.4 }}
      className="rounded-full flex items-center justify-center text-[var(--color-ink)] font-medium"
    >
      {initials || '·'}
    </div>
  );
}
