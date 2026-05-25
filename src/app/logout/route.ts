import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// POST only. A GET would be prefetched by Next.js when any <Link href="/logout">
// is visible on the page, silently destroying the session every time you opened
// Settings.
export async function POST(req: Request) {
  const s = await getSession();
  s.destroy();
  const url = new URL('/login', req.url);
  return NextResponse.redirect(url, { status: 303 });
}
