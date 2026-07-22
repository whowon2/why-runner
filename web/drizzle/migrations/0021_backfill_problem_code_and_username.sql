-- Backfill problem.code (base-36 sequence, creation order) and user.username
-- (slugified name + collision suffix) for rows that predate these columns.

DO $$
DECLARE
  r RECORD;
  n BIGINT;
  digits TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM "problem" WHERE code IS NULL ORDER BY created_at ASC LOOP
    n := nextval('problem_code_seq');
    IF n = 0 THEN
      new_code := '0';
    ELSE
      new_code := '';
      WHILE n > 0 LOOP
        new_code := substr(digits, (n % 36)::int + 1, 1) || new_code;
        n := n / 36;
      END LOOP;
    END IF;
    UPDATE "problem" SET code = new_code WHERE id = r.id;
  END LOOP;
END $$;
--> statement-breakpoint

DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR r IN SELECT id, name FROM "user" WHERE username IS NULL ORDER BY created_at ASC LOOP
    base := lower(regexp_replace(regexp_replace(coalesce(r.name, ''), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));
    IF base IS NULL OR base = '' THEN
      base := 'user';
    END IF;
    candidate := base;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "user" WHERE username = candidate) LOOP
      candidate := base || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    UPDATE "user" SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;
