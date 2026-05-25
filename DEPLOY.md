# Deploy Keep In Touch

Two paths. **Path A** uses GitHub Actions to build a multi-arch image, your server pulls it. **Path B** builds the image directly on the server. Pick whichever fits.

Whatever you pick, the runtime requirements are tiny: ~150MB RAM, ~100MB disk plus your database. It runs comfortably on a Raspberry Pi 4/5, a Mac mini, or the smallest VPS you can rent.

---

## Prerequisites

- A server you can reach over SSH
- Docker + Docker Compose installed on the server
- A reverse proxy or tunnel if you want HTTPS from the outside (Caddy, Nginx, Traefik, Cloudflare Tunnel, Tailscale Serve, etc.)
- (Path A only) A GitHub account with this repo pushed to it

---

## Path A — GitHub Actions + container registry (recommended for ongoing use)

Pushes to `main` trigger a multi-arch (amd64 + arm64) build that gets pushed to `ghcr.io/<your-username>/<repo-name>:latest`. Your server pulls that image.

### 1. Push the repo to GitHub

```bash
git init
git add .
git commit -m "Keep In Touch v1"
gh repo create <your-username>/<repo-name> --private --source=. --push
```

The included workflow at `.github/workflows/build.yml` will fire on the first push. Watch it under the **Actions** tab; first build takes ~6 minutes (subsequent builds are cached at ~90 seconds).

### 2. Make the image accessible to your server

You have two options:

**A. Make the package public** (simplest)
- GitHub → your profile → **Packages** → click the package → ⚙ → *Change visibility* → **Public**.
- Your server can now `docker pull` without authentication.

**B. Keep it private** (more secure)
- Generate a GitHub Personal Access Token with `read:packages` scope.
- On the server: `echo $TOKEN | docker login ghcr.io -u <your-username> --password-stdin`

### 3. On the server, set up the stack

```bash
ssh you@your-server
sudo mkdir -p /opt/keep_in_touch
cd /opt/keep_in_touch
```

Copy these files from your local checkout onto the server:

```bash
# from your laptop
scp docker-compose.yml .env.example you@your-server:/opt/keep_in_touch/
ssh you@your-server "cd /opt/keep_in_touch && sudo mv .env.example .env && sudo chmod 600 .env"
```

### 4. Fill in `.env`

```bash
sudo nano /opt/keep_in_touch/.env
```

Set:

| Variable | Value |
|---|---|
| `SESSION_PASSWORD` | The password you'll type to open the app |
| `SESSION_SECRET` | A long random string (32+ chars). Generate: `openssl rand -base64 48` |
| `CRON_SECRET` | Another random string |
| `ANTHROPIC_API_KEY` | *(optional)* From <https://console.anthropic.com>. Enables natural openers + voice briefings |
| `IMAGE` | `ghcr.io/<your-username>/<repo-name>:latest` |
| `TZ` | Your timezone, e.g. `Europe/London`, `America/New_York` |

### 5. Start it

```bash
cd /opt/keep_in_touch
sudo docker compose pull
sudo docker compose up -d
sudo docker compose logs -f kit-web
```

You should see:

```
▲ Next.js 15.4.3
- Local:   http://0.0.0.0:3100
✓ Ready in 1.2s
```

Confirm:

```bash
curl http://localhost:3100/api/health
# → {"ok":true,"ts":...}
```

### 6. Expose it (HTTPS)

The container listens on `:3100`. Put it behind whichever proxy or tunnel you already use. A few examples:

**Caddy** (any host with port 80/443 open):

```caddyfile
kit.example.com {
    reverse_proxy localhost:3100
}
```

**Tailscale Serve** (no public ports, only your devices):

```bash
sudo tailscale serve --bg --https=443 http://localhost:3100
```

Then reach it at `https://<hostname>.<tailnet>.ts.net`.

**Cloudflare Tunnel** (no public ports, public hostname):

```bash
cloudflared tunnel route dns <tunnel-name> kit.example.com
# then in your tunnel config, route kit.example.com to http://localhost:3100
```

### 7. Install on your phone

1. Open the URL in Chrome on your phone.
2. ⋮ menu → **Add to Home screen** → **Install**.
3. Open from the new icon. Runs full-screen.
4. Enter your `SESSION_PASSWORD`. 30-day session.
5. Walk the onboarding wizard.

### 8. Future updates

Push to `main` → GitHub Actions builds → pull on the server:

```bash
ssh you@your-server "cd /opt/keep_in_touch && sudo docker compose pull && sudo docker compose up -d"
```

Or, for auto-updates, run [Watchtower](https://containrrr.dev/watchtower/) on the server — the compose stack labels `kit-web` for it, so updates land within Watchtower's polling interval (5 min by default).

---

## Path B — build on the server directly (no CI)

For a one-off install or if you don't want GitHub Actions in the loop.

```bash
# laptop → server
rsync -av --exclude node_modules --exclude .next --exclude data \
  ./ you@your-server:/opt/keep_in_touch-src/

# on the server
ssh you@your-server
sudo mkdir -p /opt/keep_in_touch
sudo cp /opt/keep_in_touch-src/docker-compose.yml /opt/keep_in_touch/
sudo cp /opt/keep_in_touch-src/.env.example /opt/keep_in_touch/.env
sudo chmod 600 /opt/keep_in_touch/.env
sudo nano /opt/keep_in_touch/.env   # fill in secrets (see Path A step 4)

# build the image locally
cd /opt/keep_in_touch-src
sudo docker build -t keep_in_touch:local .

# start
cd /opt/keep_in_touch
sudo docker compose up -d
```

(The compose file defaults to the `keep_in_touch:local` image when `IMAGE` isn't set.)

Future updates: `rsync` the new source, `docker build`, `docker compose up -d`. About 4 minutes per update on a Pi 5, much faster on a real CPU.

---

## Backups

The database is a single SQLite file at `/var/lib/docker/volumes/keep_in_touch_kit_data/_data/kit.db` (the exact path depends on your docker root). Photos live alongside it.

### Manual one-off

From inside the app: **Settings → Export everything (JSON)** downloads the entire database as a JSON file.

### Nightly snapshot

A drop-in cron job (run on the host, not in the container):

```bash
#!/bin/bash
# /etc/cron.daily/keep_in_touch_backup
set -e
DEST=/var/backups/keep_in_touch
DATE=$(date +%F)
mkdir -p "$DEST"
docker exec kit-web sqlite3 /data/kit.db ".backup /data/kit-snapshot.db"
tar -czf "$DEST/kit-$DATE.tar.gz" \
  -C /var/lib/docker/volumes/keep_in_touch_kit_data/_data .
find "$DEST" -name 'kit-*.tar.gz' -mtime +30 -delete
```

Pipe `$DEST` into rclone, restic, BorgBackup, or whatever you already use.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose pull` says `denied` | Image is private. Either make the GitHub package public, or `docker login ghcr.io` with a PAT that has `read:packages`. |
| `Error: SESSION_SECRET must be at least 32 characters` | `.env` is missing or short. `openssl rand -base64 48` gives 64 chars. |
| Login always fails | `SESSION_PASSWORD` mismatch, or trailing newline in `.env`. Re-edit, no quotes around the value. |
| Container restarts in a loop | `docker compose logs kit-web` — most likely a missing required env var. |
| Hostname doesn't resolve | DNS issue with your proxy/tunnel. Hit `http://<server-ip>:3100` directly first to confirm the app is reachable. |
| Voice briefing button silent | First TTS call needs a real user tap. Chrome supports it out of the box; Brave needs it enabled in settings. |
| Voice dictation says "not supported" | Chrome on Android only. Firefox / Samsung Internet don't ship the Web Speech API. |
| Watchtower not updating | Confirm Watchtower can see the `com.centurylinklabs.watchtower.enable: "true"` label (it's set in the supplied compose). `docker logs watchtower` will tell you what it found. |

---

## File map on the server

```
/opt/keep_in_touch/
├── docker-compose.yml       service definitions
└── .env                     secrets and config (chmod 600)

/var/lib/docker/volumes/keep_in_touch_kit_data/_data/
├── kit.db                   your entire database
├── kit.db-wal               write-ahead log (transient)
├── kit.db-shm
└── photos/                  any contact photos you upload
```

Backing up that one volume backs up everything.

---

## TL;DR (Path A)

```bash
# laptop
git init && git add . && git commit -m init
gh repo create <user>/<repo> --private --source=. --push
# wait ~6 min for first build; make package public

# server
sudo mkdir -p /opt/keep_in_touch && cd $_
# copy docker-compose.yml + .env.example, fill in .env
sudo docker compose pull
sudo docker compose up -d

# expose via your proxy of choice
# phone: open URL → Add to Home Screen → onboard
```

You're done.
