'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PersonAvatar } from './PersonAvatar';
import type { Person } from '@/lib/types';

export function PhotoUploader({ person, size = 72 }: { person: Person; size?: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [stamp, setStamp] = useState(Date.now()); // cache-bust the photo route after upload
  const [flash, setFlash] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('photo', f);
    const r = await fetch(`/api/people/${person.id}/photo`, { method: 'POST', body: fd });
    setBusy(false);
    if (r.ok) {
      setStamp(Date.now());
      setFlash('Photo updated');
      setTimeout(() => setFlash(null), 1500);
      router.refresh();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'Upload failed');
    }
  }

  async function remove() {
    if (!confirm('Remove photo?')) return;
    setBusy(true);
    await fetch(`/api/people/${person.id}/photo`, { method: 'DELETE' });
    setBusy(false);
    setStamp(Date.now());
    setFlash('Photo removed');
    setTimeout(() => setFlash(null), 1500);
    router.refresh();
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Change photo"
        className="block overflow-hidden rounded-full ring-1 ring-[var(--color-line)] active:scale-95 transition-transform"
        style={{ width: size, height: size }}
      >
        {/* PersonAvatar reads from /api/photo/<id>; bust cache via the stamp by mounting with key */}
        <span key={stamp}>
          <PersonAvatar person={person} size={size} />
        </span>
      </button>
      <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-ink)] text-[var(--color-bg)] shadow-[var(--shadow-card)]">
        {busy ? (
          <span className="text-xs">…</span>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
            <path d="M12 5.5v13M5.5 12h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {person.photo_path && (
        <button
          type="button"
          onClick={remove}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg-card)] text-sm leading-none text-[var(--color-ink-faint)] shadow-[var(--shadow-card)]"
          aria-label="Remove photo"
        >
          ×
        </button>
      )}
      {flash && (
        <div role="status" aria-live="polite" className="animate-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-bg)] shadow-[var(--shadow-pop)]">
          {flash}
        </div>
      )}
    </div>
  );
}
