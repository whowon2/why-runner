#!/usr/bin/env bash
# Throwaway Postgres for benchmarks that write. Never touches web/.env's DB.
#   bench/lib/bench-db.sh up     # start + migrate + bench triggers
#   bench/lib/bench-db.sh down   # remove the container
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME=whyrunner-bench-db
PORT=5444
export BENCH_DATABASE_URL="postgres://bench:bench@localhost:$PORT/bench"

case "${1:-up}" in
  down) docker rm -f "$NAME" >/dev/null 2>&1 || true; exit 0 ;;
  url) echo "$BENCH_DATABASE_URL"; exit 0 ;;
esac

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p "$PORT:5432" \
  -e POSTGRES_USER=bench -e POSTGRES_PASSWORD=bench -e POSTGRES_DB=bench \
  --tmpfs /var/lib/postgresql/data postgres:16 >/dev/null
for _ in $(seq 60); do
  PGPASSWORD=bench psql -h localhost -p "$PORT" -U bench bench -qtAc 'select 1' >/dev/null 2>&1 && break
  sleep 0.5
done

# Apply the web app's migrations in journal order.
python3 - "$ROOT/web/drizzle/migrations" <<'PY' | PGPASSWORD=bench psql -h localhost -p "$PORT" -U bench bench -q -v ON_ERROR_STOP=1 >/dev/null
import json, sys, pathlib
d = pathlib.Path(sys.argv[1])
for e in json.loads((d / "meta/_journal.json").read_text())["entries"]:
    print((d / f"{e['tag']}.sql").read_text().replace("--> statement-breakpoint", ""))
    print(";")
PY

# Bench-only instrumentation: exact claim/finish timestamps per submission.
PGPASSWORD=bench psql -h localhost -p "$PORT" -U bench bench -q -v ON_ERROR_STOP=1 <<'SQL'
ALTER TABLE submission ADD COLUMN bench_inserted_at timestamptz DEFAULT clock_timestamp(),
  ADD COLUMN bench_claimed_at timestamptz, ADD COLUMN bench_finished_at timestamptz;
CREATE FUNCTION bench_stamp() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'RUNNING' AND OLD.status IS DISTINCT FROM 'RUNNING' THEN
    NEW.bench_claimed_at := clock_timestamp();
  ELSIF OLD.status = 'RUNNING' AND NEW.status <> 'RUNNING' THEN
    NEW.bench_finished_at := clock_timestamp();
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER bench_stamp BEFORE UPDATE ON submission FOR EACH ROW EXECUTE FUNCTION bench_stamp();
INSERT INTO "user"(id, name, email, email_verified, created_at, updated_at, username)
VALUES ('bench-user', 'Bench', 'bench@example.invalid', true, now(), now(), 'bench')
ON CONFLICT DO NOTHING;
SQL
echo "$BENCH_DATABASE_URL"
