# Judge VPS deploy

Target: Hetzner CX22 (or any VPS w/ Docker). Debian/Ubuntu assumed.

## 1. Provision box

- Debian 12 or Ubuntu 22.04+, 2GB+ RAM (sandbox containers get 128MB/0.5cpu each, sequential — 2GB is fine)
- Add SSH key, disable password auth
- Create non-root user w/ docker group membership (avoid running as root)

## 2. Install Docker

```sh
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
```

## 3. Firewall (ufw)

Judge needs: outbound to Postgres (managed DB, usually 5432/tls), outbound to Docker Hub / your registry for image pulls, SSH in. No inbound app port needed — judge has no HTTP server, it's a DB-polling worker.

```sh
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw enable
```

If managed Postgres (Neon/RDS) requires IP allowlisting, add this box's egress IP there.

## 4. Deploy code

```sh
mkdir -p /opt/why-runner
git clone <repo-url> /opt/why-runner
cd /opt/why-runner/judge
```

Create `.env`:

```
DATABASE_URL=postgres://user:password@<neon-host>/<db>?sslmode=require
```

(sqlx built w/ `runtime-tokio-native-tls` — sslmode=require works w/ Neon out of box, no extra CA config needed.)

## 5. Build + start

```sh
docker compose -f compose.prod.yml up -d --build
```

## 6. Enable systemd unit (survives reboot, restarts compose stack)

```sh
cp deploy/judge.service /etc/systemd/system/judge.service
systemctl daemon-reload
systemctl enable --now judge.service
```

Note: compose.prod.yml itself sets `restart: always` on judge-worker container, so Docker restarts the container on crash even without systemd touching it. systemd unit here just ensures `docker compose up -d` runs again after a host reboot (Docker daemon's own containers with restart:always also come back on daemon restart, so this is largely belt-and-suspenders — keep it anyway for explicit boot ordering after network-online).

## 7. Verify

```sh
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs -f judge-worker
```

Submit a test job from web, confirm judge picks it up (`get_next_submission` claim log line) and result lands in Postgres.

## 8. Updates

```sh
cd /opt/why-runner
git pull
cd judge
docker compose -f compose.prod.yml up -d --build
```

Consider a small deploy script or GitHub Actions runner on the box for this later; manual is fine for now.

## Notes / gaps to revisit

- No monitoring/alerting on judge-worker crash-looping or DB connection loss — add later (Healthchecks.io ping in main.rs loop, or `docker compose logs` shipped somewhere).
- Root CLAUDE.md's mention of a "compose.yml at repo root" is stale — it lives at `judge/compose.yml` (dev) / `judge/compose.prod.yml` (this).
- Multiple judge-worker replicas are safe (claim query uses `FOR UPDATE SKIP LOCKED`) if you need more throughput later — just scale `judge-worker` replica count in compose or run a second VPS pointed at same DB.
