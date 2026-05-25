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
  const THIRTY_DAYS = 60 * 60 * 24 * 30;
  // Default to insecure cookies (works over both HTTP and HTTPS). Necessary
  // when a TLS-terminating reverse proxy (Tailscale Serve, Caddy, etc.) sits
  // in front and proxies plain HTTP to the container — the browser still sees
  // HTTPS, but if `secure` is on and any path of the chain looks like HTTP
  // the session can fail intermittently. Self-hosted single-user app, behind
  // your own tunnel: this is fine.
  // Set COOKIE_SECURE=1 if you really want it strict.
  const secure = process.env.COOKIE_SECURE === '1';
  return {
    cookieName: 'kit_session',
    password,
    ttl: THIRTY_DAYS, // session-data sealing TTL (was 14 days by default — caused weekly logouts)
    cookieOptions: {
      secure,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS,
      path: '/',
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
