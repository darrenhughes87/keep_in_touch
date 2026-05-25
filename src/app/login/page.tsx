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
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={login} className="w-full max-w-sm bg-[var(--color-bg-card)] rounded-2xl shadow-sm p-8 space-y-5 border border-[var(--color-line)]">
        <div>
          <h1 className="text-2xl font-serif tracking-tight">Keep In Touch</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Just for you.</p>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        {sp.error && <p className="text-sm text-[var(--color-warm)]">That didn&apos;t match. Try again.</p>}
        <button type="submit" className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium">
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
