import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await getSession();
  if (s.loggedIn) redirect('/');

  async function login(formData: FormData) {
    'use server';
    const pw = String(formData.get('password') ?? '');
    const expected = process.env.SESSION_PASSWORD;
    if (!expected) throw new Error('SESSION_PASSWORD not set');
    if (timingSafeEqual(pw, expected)) {
      const s = await getSession();
      s.loggedIn = true;
      await s.save();
      redirect('/');
    }
    redirect('/login?error=1');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={login} className="animate-rise w-full max-w-sm space-y-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-8 shadow-[var(--shadow-raised)]">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--color-accent)] text-white shadow-[var(--shadow-card)]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
              <path d="M6 6h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6l-3.5 2.8V16H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="currentColor" opacity="0.95" />
            </svg>
          </span>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Keep In Touch</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Just for you.</p>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="field"
        />
        {sp.error && <p className="text-sm text-[var(--color-warm-ink)]">That didn&apos;t match. Try again.</p>}
        <button type="submit" className="w-full rounded-[var(--radius-md)] bg-[var(--color-ink)] py-3 font-medium text-[var(--color-bg)] active:scale-[.99] transition-transform">
          Open
        </button>
      </form>
    </main>
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
