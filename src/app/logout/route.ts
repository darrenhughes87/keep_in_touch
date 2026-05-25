import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  s.destroy();
  return NextResponse.redirect(new URL('/login', process.env.APP_URL || 'http://localhost:3100'));
}
