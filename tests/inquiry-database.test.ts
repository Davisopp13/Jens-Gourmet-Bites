import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("inquiry migration: history, idempotency, atomic rollback, edits, leases and access boundaries", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jgb-inquiry-pg-"));
  const port = "55487";
  const pg = join(dir, "data");
  const options = {
    encoding: "utf8" as const,
    stdio: ["pipe", "pipe", "pipe"] as ["pipe", "pipe", "pipe"],
  };
  const args = [
    "-h",
    dir,
    "-p",
    port,
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-X",
    "-qAt",
    "-v",
    "ON_ERROR_STOP=1",
  ];
  const sql = (query: string) =>
    execFileSync("psql", args, { ...options, input: query }).trim();
  const run = promisify(execFile);
  const admin = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const submission = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  try {
    execFileSync(
      "initdb",
      ["-D", pg, "-U", "postgres", "--auth-local=trust", "--auth-host=reject"],
      options,
    );
    execFileSync(
      "pg_ctl",
      [
        "-D",
        pg,
        "-l",
        join(dir, "postgres.log"),
        "-o",
        `-k ${dir} -p ${port} -h ''`,
        "-w",
        "start",
      ],
      options,
    );
    sql(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema public,auth to service_role,anon,authenticated;
  create table public.contact_submissions(id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text,message text not null,preferred_format text,created_at timestamptz default now());
  alter table contact_submissions enable row level security;grant all on contact_submissions to anon,authenticated;
  create policy "Anyone can submit contact form" on contact_submissions for insert with check(true);
  create policy "Authenticated users can view submissions" on contact_submissions for select to authenticated using(true);
  insert into contact_submissions(name,email,message) values('Legacy','legacy@example.com','Existing submission');insert into auth.users values('${admin}'),('${other}');`);
    sql(
      readFileSync(
        "supabase/migrations/20261102215528_inquiry_queue.sql",
        "utf8",
      ),
    );
    assert.equal(
      sql(`select count(*) from contact_submissions where status is null`),
      "1",
    );
    assert.equal(sql(`select count(*) from inquiry_notifications`), "0");
    for (const role of ["anon", "authenticated"]) {
      for (const table of [
        "contact_submissions",
        "inquiry_activity",
        "inquiry_notifications",
        "inquiry_push_subscriptions",
      ])
        assert.throws(() => sql(`set role ${role};select * from ${table}`));
      assert.equal(
        sql(
          `select has_function_privilege('${role}','create_inquiry(uuid,text,text,text,text,text,text,uuid[])','execute')`,
        ),
        "f",
      );
    }
    sql(
      `insert into inquiry_push_subscriptions(user_id,endpoint,keys) values('${admin}','https://web.push.apple.com/allowed','{}'),('${other}','https://web.push.apple.com/not-allowed','{}');`,
    );
    const create = (key = submission, fingerprint = "hash") =>
      `set role service_role;select create_inquiry('${key}','${fingerprint}','Test','test@example.com',null,'Cookies','baked',array['${admin}'::uuid]);`;
    const [one, two] = await Promise.all([
      run("psql", [...args, "-c", create()]),
      run("psql", [...args, "-c", create()]),
    ]);
    const id = one.stdout.trim();
    assert.equal(id, two.stdout.trim());
    assert.equal(sql(create()), id);
    assert.equal(
      sql(`select count(*) from contact_submissions where status='new'`),
      "1",
    );
    assert.equal(
      sql(
        `select count(*) from inquiry_notifications where inquiry_id='${id}'`,
      ),
      "2",
    );
    assert.throws(() => sql(create(submission, "changed")));
    sql(
      `create function reject_notification() returns trigger language plpgsql as $$begin raise exception 'test rollback';end$$;create trigger reject_notification before insert on inquiry_notifications for each row execute function reject_notification();`,
    );
    assert.throws(() => sql(create("dddddddd-dddd-4ddd-8ddd-dddddddddddd")));
    assert.equal(
      sql(
        `select count(*) from contact_submissions where submission_id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'`,
      ),
      "0",
    );
    sql("drop trigger reject_notification on inquiry_notifications");
    const edit = (
      version: number,
      status: string | null,
      note: string | null,
    ) =>
      `set role service_role;select edit_inquiry('${id}',${version},'${admin}','Test admin',${status ? `'${status}'` : "null"},${note ? `'${note}'` : "null"});`;
    sql(edit(1, "in_progress", null));
    sql(edit(2, null, "Private test note"));
    sql(edit(3, "done", null));
    sql(edit(4, "new", null));
    assert.equal(
      sql(
        `select status||':'||version from contact_submissions where id='${id}'`,
      ),
      "new:5",
    );
    assert.equal(
      sql(`select count(*) from inquiry_activity where inquiry_id='${id}'`),
      "4",
    );
    assert.throws(() => sql(edit(1, "done", null)));
    assert.equal(sql(`select count(*) from inquiry_notifications`), "2");
    const t1 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      t2 = "ffffffff-ffff-4fff-8fff-ffffffffffff";
    const claim = (token: string) =>
      `set role service_role;select count(*) from claim_inquiry_notifications('${id}','${token}');`;
    const claims = await Promise.all([
      run("psql", [...args, "-c", claim(t1)]),
      run("psql", [...args, "-c", claim(t2)]),
    ]);
    assert.deepEqual(claims.map((r) => Number(r.stdout.trim())).sort(), [0, 2]);
    sql(
      `update inquiry_notifications set leased_until=now()-interval '1 second',state=case when channel='email' then 'accepted' else 'failed' end;`,
    );
    assert.equal(sql(claim(t2)), "1");
    sql(`delete from inquiry_push_subscriptions where user_id='${admin}';`);
    assert.equal(
      sql(
        `select count(*) from inquiry_notifications where channel='push' and subscription_id is null`,
      ),
      "1",
    );
  } finally {
    try {
      execFileSync("pg_ctl", ["-D", pg, "-m", "fast", "-w", "stop"], options);
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});
