import Link from 'next/link';

export function TopNav({ title, back }: { title?: string; back?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-line-soft)] safe-top">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-2">
        {back ? (
          <>
            <Link
              href={back}
              aria-label="Back"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink-soft)] active:bg-[var(--color-bg-sunken)] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
                <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {title && <h1 className="text-[17px] font-serif font-medium flex-1 truncate">{title}</h1>}
          </>
        ) : (
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-white shadow-[var(--shadow-card)]">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden>
                <path d="M6 6h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6l-3.5 2.8V16H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="currentColor" opacity="0.95" />
              </svg>
            </span>
            <span className="text-lg font-serif font-medium tracking-tight">Keep In Touch</span>
          </Link>
        )}
      </div>
    </header>
  );
}
