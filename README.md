# Keep In Touch

> A quiet, self-hosted web app that surfaces the right person at the right time, so you stay close to the people you care about.

Not a social network. Not a CRM. Not another thing that pings you all day. Just a soft daily nudge toward one to three names you might be drifting from, with a one-tap link out to WhatsApp / SMS / a phone call.

Single-user. Lives on your own server. Nobody else sees what's inside.

---

## What it does

- Picks up to **three names** a day for you to reach out to, based on how long since you last spoke and how close you actually are.
- Shows a one-line **memory** from your last note about each person, so you have something real to lead with instead of *"hey, all good?"*.
- One-tap **WhatsApp / Call / SMS / Email** deep links, with smart international phone-number normalisation so contacts imported without a country code still work.
- After a chat, dictate or type a single line about it. Future-you will thank you in six weeks.
- **Voice briefing** reads today's names aloud in about twenty seconds, hands-free.
- **Suggest a natural opener** for any contact, drawing on your latest note about them.
- **Polish dictation** turns rambling voice notes into one or two clean sentences in British English, distilling what you meant while keeping your voice. One-tap undo.
- **Star people you message often** so they don't appear in daily suggestions. Every 30 days the app gently checks: *"Still keeping in touch with X?"* — one tap to confirm or to release them back to the normal schedule.
- **Full-text search** across every note and name you've ever written. Search "chemo" and find the right person instantly.
- **Opt-in morning push notification** (one per day, never more, soft body, silent on empty days).
- **Android share-target**: share any text or link from any app into KIT as a private note.
- **Installable PWA** with offline shell, photo uploads, optional moments capture, year scroll, full JSON export.

## The principles (the anti-features matter as much as the features)

- **No streaks.** Missing a day is not a failure.
- **No badges, XP, leaderboards, social feed, share buttons.**
- **No notifications by default.** Push is opt-in and capped at one soft message per day.
- **Empty days stay silent** — no "you're all caught up!" alerts, no nudges to engage.
- **No "overdue" or "late".** The strongest word the app uses is "drifting".
- **Cadence is a suggestion, never a deadline.** *"You're all caught up"* is a real, reachable state.
- **Time-neutral.** No "Good morning" assumptions — you might open the app at any hour.
- **Your data stays on your hardware.** Nothing leaves the box unless you set up the optional AI features.

---

## Tech

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind v4 + a small set of hand-rolled components |
| DB | SQLite via better-sqlite3 (WAL mode, FTS5 for note search) |
| Auth | Single password + 30-day signed cookie (iron-session) |
| Voice | Browser Web Speech API for dictation; SpeechSynthesis for the briefing |
| Optional AI | Anthropic Claude Haiku — for opener suggestions, voice briefing scripts, and dictation cleanup |
| Push | Native Web Push via VAPID (one-time setup with `pnpm vapid`) |
| Deploy | Docker (single arm64 image by default, swap to multi-arch in one line), single compose file |
| PWA | Installable web app + Android share target + service worker |

No analytics. No tracking. No telemetry. No upselling. No account creation.

---

## Quick start (local development)

You'll need Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
# edit .env.local:
#   SESSION_PASSWORD=something only you know
#   SESSION_SECRET=$(openssl rand -base64 48)
pnpm dev
```

Open <http://localhost:3100>. The default development password is in `.env.example` — change it.

### Optional — generate keys for the AI + push features

```bash
pnpm vapid                              # prints VAPID keypair for Web Push
# then add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT to .env.local
# also add ANTHROPIC_API_KEY=...      # for opener / briefing / dictation polish
```

Without these keys, the relevant features show graceful fallback UI explaining how to enable them. Everything else still works.

---

## Deploying for real

This app is built to live on a small server you control: a Raspberry Pi, a $5 VPS, your homelab box. See [DEPLOY.md](DEPLOY.md) for two end-to-end paths:

- **Path A** — GitHub Actions builds an arm64 image on a native ARM runner (~90s warm), your server pulls it. Best if you'll iterate on the app.
- **Path B** — Build the image directly on the server. Fastest if you just want it up.

Either path takes about 15 minutes the first time. After that, updates are automatic (if you use Watchtower) or one SSH command.

For first-time setup the app walks you through a five-step wizard. Add the people you'd be devastated to lose touch with, then the people you'd love to see more of, then you're in.

Day-to-day use is documented in [HOW-TO.md](HOW-TO.md) (written for an Android phone, but works fine on any device with a browser).

---

## Project layout

```
src/
├── app/               Next.js App Router pages and API routes
│   ├── api/             every server endpoint
│   │   ├── people/      CRUD + star + snooze + interactions + photo + opener
│   │   ├── notes/       per-note edit/delete
│   │   ├── clean-note/  Haiku dictation polish
│   │   ├── push/        VAPID key + subscribe/unsubscribe
│   │   ├── cron/        morning suggestions + morning push
│   │   ├── briefing/    voice briefing script
│   │   ├── moments/     optional gratitude capture
│   │   ├── import/      vCard parse + commit
│   │   └── export/      full JSON dump
│   ├── people/          list, detail, add, edit
│   ├── onboarding/      first-run wizard
│   ├── search/          full-text search across notes
│   ├── settings/        cadences, country code, push, AI status
│   ├── import/          vCard upload + pick-list
│   ├── moments/         optional gratitude capture
│   ├── year/            year-in-review scroll
│   └── share/           Android share-target landing page
├── components/        React components (server + client)
└── lib/               db, schema, queries, scoring, vcard parser, phone normaliser, anthropic client, push
public/
├── manifest.webmanifest
├── sw.js              service worker (PWA shell cache + push handler)
└── icon.svg
scripts/
├── backup.ts          SQLite snapshot + photos tarball
├── run-suggestions.ts cron entry to recompute today's list
└── generate-vapid.ts  prints a fresh VAPID keypair
Dockerfile             multi-stage build, outputs Next.js standalone
docker-compose.yml     production stack (kit-web + kit-cron)
.github/workflows/     GitHub Actions: native-ARM build + push image
```

---

## Privacy

This is the most intimate dataset you'll ever generate. Treat it accordingly.

- **Self-hosted by design.** The default deploy puts everything on your hardware.
- **No third-party calls** unless you explicitly set `ANTHROPIC_API_KEY`. Even then, only the most recent note about one person and that person's first name are sent on each "Suggest opener" or "Polish dictation" tap. Anthropic's API is zero-data-retention by default.
- **Web Push** uses VAPID keys you generate and own. The push payload is encrypted end-to-end; Google / Apple's push relays cannot read the body. Notification bodies are intentionally generic ("3 people, if you have a spare ten minutes") and never expose names on your lock screen.
- **No analytics**, no error reporting, no telemetry. The app does not phone home.
- **Backups** snapshot a single SQLite file plus your photo folder. Take it with you.
- **Export** the full database as JSON from Settings at any time.

For exposing the app to your phone over the public internet, the safest path is a private tunnel like [Tailscale](https://tailscale.com), which avoids opening any inbound ports. Otherwise put it behind something like Cloudflare Tunnel or a reverse proxy with a real TLS cert.

---

## Star feature explained

The single feature that bends KIT around real life. For people you message every day already, you don't need the app reminding you — you're in touch by default.

Tap the ☆ next to anyone's name on their detail page. They become starred (★), skip the daily suggestion list entirely, and sink to the bottom of the People list marked with a star. Their layer (Inner / Close / etc.) stays unchanged — they're still in your inner circle, just self-managed.

Every 30 days the home screen shows a soft amber card: *"Still keeping in touch with Sarah?"* with two buttons:

- **Yes, still close** — resets the 30-day timer, no other change
- **Surface them again** — removes the star, returns them to the normal schedule

This prevents the trap of starring someone, drifting apart silently, and only noticing six months later. The app politely double-checks without nagging.

---

## Contributing

This is a small personal-scale app. The scope is deliberately tiny and the anti-features list is load-bearing. Please read the principles above before opening a PR that adds a notification, a streak counter, a social feature, or any flavour of gamification — those will be politely declined.

Genuine improvements gratefully welcomed:

- Bug fixes, accessibility, performance
- Additional import formats (Google Contacts OAuth, CSV)
- Better keyboard navigation
- Dark mode
- Translations (the app is currently English-only; layer names and TTS default to en-GB)
- Better TTS voice handling on iOS (Web Speech API support is partial)
- iOS PWA-specific quirks (the app works on iOS Chrome/Safari but is designed for Android Chrome)

---

## License

MIT. Do whatever you like with it. No warranty.

If you build something on top of this and it helps you stay closer to the people who matter, that's the whole point.
