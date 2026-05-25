import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface SessionData {
  loggedIn?: boolean;
}

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return {
    cookieName: 'kit_session',
    password,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export async function getSession() {
  const c = await cookies();
  return getIronSession<SessionData>(c, sessionOptions());
}

export async function requireSession() {
  const s = await getSession();
  if (!s.loggedIn) redirect('/login');
  return s;
}

export async function isLoggedIn() {
  const s = await getSession();
  return !!s.loggedIn;
}
