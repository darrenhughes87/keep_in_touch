# Keep In Touch

> A quiet, self-hosted web app that surfaces the right person at the right time, so you stay close to the people you care about.

Not a social network. Not a CRM. Not another thing that pings you all day. Just a soft daily nudge toward one to three names you might be drifting from, with a one-tap link out to WhatsApp / SMS / a phone call.

Single-user. Lives on your own server. Nobody else sees what's inside.

---

## What it does

- Every morning, picks up to **three names** for you to reach out to, based on how long since you last spoke and how close you actually are.
- For each person, shows a one-line **memory** from your last note about them, so you have something real to lead with instead of *"hey, all good?"*.
- Tap **WhatsApp** / **Call** / **SMS** / **Email** to open the right app, pre-targeted at that person.
- After a chat, dictate or type a single line about it. Future-you will thank you in six weeks.
- An optional **morning voice briefing** reads today's names aloud in about twenty seconds, hands-free.
- Suggest a natural opener for any contact, drawing on your latest note about them (optional, uses Claude Haiku).
- Search across every note you've ever written. Full-text, instant.

## The principles (the anti-features matter as much as the features)

- **No streaks.** Missing a day is not a failure.
- **No badges, XP, leaderboards, social feed, share buttons.**
- **No notifications by default.** One pull-based morning view. You open it when you open it.
- **No "overdue" or "late".** The strongest word the app uses is "drifting".
- **Cadence is a suggestion, never a deadline.** *"You're all caught up"* is a real, reachable state.
- **Your data stays on your hardware.** Nothing leaves the box unless you set up the optional AI features.

---

## Tech

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind v4 + a small set of hand-rolled components |
| DB | SQLite via better-sqlite3 (WAL mode, FTS5 for note search) |
| Auth | Single password + 30-day signed cookie (iron-session) |
| Voice | Browser Web Speech API for dictation; SpeechSynthesis for the morning briefing |
| Optional AI | Anthropic Claude Haiku, for opener suggestions and the natural-voice briefing script |
| Deploy | Docker (multi-arch image, amd64 + arm64), single compose file |
| PWA | Installable web app + Android share target |

No analytics. No tracking. No telemetry.

---

## Quick start (local development)

You'll need Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
# edit .env.local: set SESSION_PASSWORD to something only you know
#                  set SESSION_SECRET to `openssl rand -base64 48`
pnpm dev
```

Open `http://localhost:3100`. The default development password (`happy`) is in `.env.example` — change it.

---

## Deploying for real

This app is built to live on a small server you control: a Raspberry Pi, a $5 VPS, your homelab box. See [DEPLOY.md](DEPLOY.md) for two end-to-end paths:

- **Path A** — GitHub Actions builds a multi-arch image, your server pulls it. Best if you'll iterate on the app.
- **Path B** — Build the image directly on the server. Fastest if you just want it up.

Either path takes about 15 minutes the first time. After that, updates are automatic (if you use Watchtower) or one SSH command.

For first-time setup the app walks you through a five-step wizard. Add the people you'd be devastated to lose touch with, then the people you'd love to see more of, then you're in.

Day-to-day use is documented in [HOW-TO.md](HOW-TO.md) (written for an Android phone, but works fine on any device with a browser).

---

## Project layout

```
src/
├── app/               Next.js App Router pages and API routes
│   ├── api/             every server endpoint (CRUD, briefing, opener, export, etc.)
│   ├── people/          person list, detail, add, edit
│   ├── onboarding/      first-run wizard
│   ├── search/          full-text search across notes
│   ├── settings/        cadences, quiet days, etc.
│   ├── import/          vCard upload + pick-list
│   ├── moments/         optional gratitude capture
│   ├── year/            end-of-year reach-out + moments scroll
│   └── share/           Android share-target landing page
├── components/        React components
└── lib/               db, queries, scoring, vcard parser, optional Anthropic client
public/
├── manifest.webmanifest
├── sw.js              service worker (PWA shell cache + push handler)
└── icon.svg
scripts/
├── backup.ts          SQLite snapshot + photos tarball
└── run-suggestions.ts cron entry to recompute today's list
Dockerfile             multi-stage build, outputs Next.js standalone
docker-compose.yml     production stack
.github/workflows/     GitHub Actions: build + push multi-arch image
```

---

## Privacy

This is the most intimate dataset you'll ever generate. Treat it accordingly.

- **Self-hosted by design.** The default deploy puts everything on your hardware.
- **No third-party calls** unless you explicitly set `ANTHROPIC_API_KEY`. Even then, only the most recent note about one person (and that person's first name) is sent on each "Suggest opener" tap. Anthropic's API is configured for zero data retention by default.
- **No analytics**, no error reporting, no telemetry. The app does not phone home.
- **Backups** (see DEPLOY.md) snapshot a single SQLite file. Take it with you.
- **Export** the full database as JSON from Settings at any time.

For exposing the app to your phone over the public internet, the safest path is a private tunnel like [Tailscale](https://tailscale.com), which avoids opening any inbound ports. Otherwise put it behind something like Cloudflare Tunnel or a reverse proxy with a real TLS cert.

---

## Contributing

This is a small personal-scale app. The scope is deliberately tiny and the anti-features list is load-bearing. Please read [HOW-TO.md](HOW-TO.md) §"The principles" before opening a PR that adds a notification, a streak counter, a social feature, or any flavour of gamification — those will be politely declined.

Genuine improvements gratefully welcomed: bug fixes, accessibility, performance, additional import formats (Google Contacts API would be great), better keyboard navigation, dark mode, translations, better TTS voice handling on iOS.

---

## License

MIT. Do whatever you like with it. No warranty.

If you build something on top of this and it helps you stay closer to the people who matter, that's the whole point.
