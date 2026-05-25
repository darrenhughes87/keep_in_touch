import Link from 'next/link';

export function TopNav({ title, back }: { title?: string; back?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)]/85 backdrop-blur border-b border-[var(--color-line)] safe-top">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        {back ? (
          <Link href={back} aria-label="Back" className="text-[var(--color-ink-soft)] -ml-1 px-2 py-1">
            ←
          </Link>
        ) : (
          <Link href="/" aria-label="Home" className="text-xl font-serif tracking-tight">
            Keep In Touch
          </Link>
        )}
        {title && <h1 className="text-base font-medium flex-1 truncate">{title}</h1>}
        {!back && (
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/people" className="px-2 py-1 text-[var(--color-ink-soft)]">People</Link>
            <Link href="/search" className="px-2 py-1 text-[var(--color-ink-soft)]" aria-label="Search">🔍</Link>
            <Link href="/settings" className="px-2 py-1 text-[var(--color-ink-soft)]" aria-label="Settings">⚙</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
