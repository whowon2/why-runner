# Judge VPS deploy

Target: any VPS or container platform with Docker container support and
capability support (`CAP_SYS_ADMIN`, `CAP_NET_ADMIN`). Debian/Ubuntu assumed
for VPS; platform-specific capability grants required for Railway/other
managed platforms. See notes below.

## 1. Provision box

- Debian 12 or Ubuntu 22.04+, 2GB+ RAM (sandbox submissions are sequential,
  but a bare 2GB is tight, not comfortable: Java/Portugol's nominal cap alone
  is 2GB (`JVM_MEM_KB`), so a 2GB host leaves little headroom for the OS, the
  judge process itself, and Postgres/Docker overhead once one of those
  submissions is running. `isolate`'s `--mem` limit is enforced per-process
  (`RLIMIT_AS`), not per-cgroup like the old Docker `--memory` flag, and boxes
  run with `--processes=64` — a misbehaving/forking submission can multiply
  its real host memory usage well past its nominal per-language cap, since
  there is currently no aggregate memory cap across a box's processes. Size
  the host with real margin above the language caps, not just up to them;
  3-4GB is safer than the bare minimum if budget allows.
- Add SSH key, disable password auth
- Create non-root user (judge container runs as a normal unprivileged user;
  `cap_add` in compose grants only the required Linux capabilities, not full
  root)

## 2. Install Docker (VPS only)

VPS deployments need Docker installed on the host:

```sh
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
```

Managed platforms (Railway, Fly.io, etc.) already provide a container runtime;
skip this step and see notes below on capability requirements.

## 3. Firewall (ufw)

Judge needs: outbound to Postgres (managed DB, usually 5432/tls), outbound to
Docker Hub / your registry for image pulls, SSH in. No inbound app port needed
— judge has no HTTP server, it's a DB-polling worker.

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

## Capabilities and platform requirements

Judge uses `isolate` (sandboxed execution) instead of Docker-in-Docker, so it
**does not need a host Docker daemon at runtime**. Instead, the judge container
itself needs two Linux capabilities: `CAP_SYS_ADMIN` (to manage cgroups/namespaces)
and `CAP_NET_ADMIN` (for isolate's per-box network namespace setup). The compose
files (`judge/compose.yml`, `judge/compose.prod.yml`) declare these via
`cap_add: [SYS_ADMIN, NET_ADMIN]`.

**Managed platform notes:**
- **Railway, Fly.io, Render, etc.:** Capability support is platform-dependent.
  Local Docker testing (this plan's Task 1-6) validated the mechanism works
  with elevated capabilities enabled, but Railway's specific capability grants
  are undocumented and unconfirmed. A real deploy attempt to Railway would be
  the only way to know if it grants those capabilities. Contact platform
  support if a deploy fails with permission errors on isolate startup.

## Notes / gaps to revisit

- **Known gap: no aggregate per-box memory cap.** isolate's `--mem` is enforced
  as `RLIMIT_AS` per-process, not real cgroup RSS accounting like the old
  Docker `--memory` flag (see `src/runner.rs`'s `JVM_MEM_KB` doc comment).
  Real per-box aggregate memory accounting across all of a box's processes
  would need `isolate --cg`, which needs a writable cgroup delegation this
  container doesn't have and isn't enabled here — deferred as a deployment/
  security decision during Task 5, not fixed by this branch. Combined with
  `--processes=64`, a misbehaving/forking submission can use several times its
  nominal per-language cap in real host RAM; see the RAM sizing note in
  "1. Provision box" above.
- No monitoring/alerting on judge-worker crash-looping or DB connection loss — add later (Healthchecks.io ping in main.rs loop, or `docker compose logs` shipped somewhere).
- Root CLAUDE.md's mention of a "compose.yml at repo root" is stale — it lives at `judge/compose.yml` (dev) / `judge/compose.prod.yml` (this).
- Multiple judge-worker replicas are safe (claim query uses `FOR UPDATE SKIP LOCKED`) if you need more throughput later — just scale `judge-worker` replica count in compose or run a second VPS pointed at same DB.
