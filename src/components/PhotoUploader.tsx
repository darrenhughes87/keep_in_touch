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
    router.refresh();
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label="Change photo"
        className="block rounded-full overflow-hidden active:scale-95 transition"
        style={{ width: size, height: size }}
      >
        {/* PersonAvatar reads from /api/photo/<id>; bust cache via the stamp by mounting with key */}
        <span key={stamp}>
          <PersonAvatar person={person} size={size} />
        </span>
      </button>
      <span className="absolute -bottom-1 -right-1 bg-[var(--color-ink)] text-white rounded-full w-7 h-7 flex items-center justify-center text-xs pointer-events-none">
        {busy ? '…' : '+'}
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
          className="absolute -top-2 -right-2 bg-white text-[var(--color-ink-faint)] border border-[var(--color-line)] rounded-full w-6 h-6 text-xs"
          aria-label="Remove photo"
        >
          ×
        </button>
      )}
    </div>
  );
}
