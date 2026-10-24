export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{ success: boolean; results?: T[] }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Env {
  DB?: D1Database;
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const ALLOWED_KEYS = [
  'applications',
  'representatives',
  'accounts',
  'adminPasswords',
  'activityLogs',
  'formSettings',
] as const;

async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS kdu_app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS student_applications (
        reference_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        student_id TEXT NOT NULL,
        program TEXT NOT NULL,
        department TEXT NOT NULL,
        batch_season TEXT NOT NULL,
        batch_year TEXT NOT NULL,
        phone TEXT,
        facebook_url TEXT,
        doc_category TEXT,
        doc_file_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        current_step INTEGER NOT NULL DEFAULT 2,
        reviewed_by TEXT,
        reviewed_at TEXT,
        submitted_at TEXT NOT NULL,
        custom_fields_json TEXT
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS representatives (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        dept_id TEXT NOT NULL,
        role TEXT NOT NULL,
        term TEXT NOT NULL,
        fb_url TEXT,
        email TEXT,
        photo_url TEXT,
        updated_at TEXT NOT NULL
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS rep_accounts (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rep_name TEXT,
        department TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_by TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL,
        updated_at TEXT
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS admin_credentials (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        updated_at TEXT NOT NULL
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )`
    ),
  ]);
}

async function syncRelationalTables(
  db: D1Database,
  payload: Record<string, unknown>,
  now: string
): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  // 1. Sync student_applications table
  if (Array.isArray(payload.applications)) {
    statements.push(db.prepare('DELETE FROM student_applications'));
    for (const rawApp of payload.applications) {
      const app = (rawApp || {}) as Record<string, unknown>;
      const formData = ((app.formData || {}) as Record<string, unknown>);
      const doc = ((app.document || {}) as Record<string, unknown>);
      const customFields = formData.customFieldValues || formData.customValues || {};

      statements.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO student_applications (
              reference_id, full_name, student_id, program, department,
              batch_season, batch_year, phone, facebook_url, doc_category,
              doc_file_name, status, current_step, reviewed_by, reviewed_at,
              submitted_at, custom_fields_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            String(app.referenceId || ''),
            String(formData.fullName || ''),
            String(formData.studentId || ''),
            String(formData.program || ''),
            String(formData.department || ''),
            String(formData.batchSeason || ''),
            String(formData.batchYear || ''),
            String(formData.phone || ''),
            String(formData.facebookUrl || ''),
            String(doc.docCategory || ''),
            String(doc.fileName || ''),
            String(app.status || 'pending'),
            Number(app.currentStep || 2),
            app.reviewedBy ? String(app.reviewedBy) : null,
            app.reviewedAt ? String(app.reviewedAt) : null,
            String(app.submittedAt || now),
            JSON.stringify(customFields)
          )
      );
    }
  }

  // 2. Sync representatives table
  if (Array.isArray(payload.representatives)) {
    statements.push(db.prepare('DELETE FROM representatives'));
    for (const rawRep of payload.representatives) {
      const rep = (rawRep || {}) as Record<string, unknown>;
      statements.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO representatives (
              id, name, dept_id, role, term, fb_url, email, photo_url, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            String(rep.id || ''),
            String(rep.name || ''),
            String(rep.deptId || ''),
            String(rep.role || 'Primary'),
            String(rep.term || ''),
            String(rep.fbUrl || ''),
            String(rep.email || ''),
            rep.photoUrl ? String(rep.photoUrl) : null,
            now
          )
      );
    }
  }

  // 3. Sync rep_accounts table
  if (Array.isArray(payload.accounts)) {
    statements.push(db.prepare('DELETE FROM rep_accounts'));
    for (const rawAcc of payload.accounts) {
      const acc = (rawAcc || {}) as Record<string, unknown>;
      statements.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO rep_accounts (
              id, username, password, rep_name, department, email,
              status, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            String(acc.id || acc.username || ''),
            String(acc.username || ''),
            String(acc.password || ''),
            String(acc.repName || acc.username || ''),
            String(acc.department || ''),
            String(acc.email || ''),
            String(acc.status || 'active'),
            String(acc.createdBy || 'admin'),
            String(acc.createdAt || now),
            String(acc.updatedAt || now)
          )
      );
    }
  }

  // 4. Sync admin_credentials table
  if (payload.adminPasswords && typeof payload.adminPasswords === 'object') {
    const passwords = payload.adminPasswords as Record<string, string>;
    for (const [username, password] of Object.entries(passwords)) {
      const role =
        username === 'admin' || username === 'superadmin' || username === 'lead'
          ? 'Super Admin'
          : 'Representative';
      statements.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO admin_credentials (
              username, password, role, updated_at
            ) VALUES (?, ?, ?, ?)`
          )
          .bind(username, String(password), role, now)
      );
    }
  }

  // 5. Sync activity_logs table
  if (Array.isArray(payload.activityLogs)) {
    for (const rawLog of payload.activityLogs.slice(0, 100)) {
      const log = (rawLog || {}) as Record<string, unknown>;
      if (log.id) {
        statements.push(
          db
            .prepare(
              `INSERT OR REPLACE INTO activity_logs (
                id, actor_id, actor_name, action, details, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?)`
            )
            .bind(
              String(log.id),
              String(log.actorId || 'admin'),
              String(log.actorName || 'Admin'),
              String(log.action || 'ACTION'),
              String(log.details || ''),
              String(log.timestamp || now)
            )
        );
      }
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

async function getKeyJson<T>(db: D1Database, key: string, fallback: T): Promise<T> {
  const row = await db
    .prepare('SELECT value FROM kdu_app_state WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();
  if (!row || !row.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function setKeyJson(db: D1Database, key: string, value: unknown, now: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO kdu_app_state (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`
    )
    .bind(key, JSON.stringify(value), now)
    .run();
}

export async function handleApiStateRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!env || !env.DB) {
    return new Response(
      JSON.stringify({
        ok: false,
        d1Connected: false,
        message:
          'Cloudflare D1 binding (DB) not found. Bind your D1 database with variable name "DB".',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const db = env.DB;

  try {
    await ensureSchema(db);

    if (request.method === 'GET') {
      const { results } = await db
        .prepare('SELECT key, value, updated_at FROM kdu_app_state')
        .all<{ key: string; value: string; updated_at: string }>();

      const data: Record<string, unknown> = {};
      let latestUpdatedAt = '';

      for (const row of results || []) {
        try {
          data[row.key] = JSON.parse(row.value);
          if (row.updated_at > latestUpdatedAt) {
            latestUpdatedAt = row.updated_at;
          }
        } catch {
          // Ignore malformed JSON row
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          d1Connected: true,
          data,
          updatedAt: latestUpdatedAt || new Date().toISOString(),
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = (await request.json()) as Record<string, unknown>;
      const now = new Date().toISOString();

      // Atomic action: Submit a new student application without overwriting concurrent submissions
      if (body.action === 'submit_application' && body.application) {
        const currentApps = await getKeyJson<Array<Record<string, unknown>>>(
          db,
          'applications',
          []
        );
        const incomingApp = body.application as Record<string, unknown>;
        const filtered = currentApps.filter(
          (a) => a.referenceId !== incomingApp.referenceId
        );
        const updatedApps = [incomingApp, ...filtered];
        await setKeyJson(db, 'applications', updatedApps, now);
        await syncRelationalTables(db, { applications: updatedApps }, now);

        return new Response(
          JSON.stringify({
            ok: true,
            d1Connected: true,
            applications: updatedApps,
            updatedAt: now,
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Atomic action: Approve or reject a student application + record activity log
      if (body.action === 'review_application' && body.referenceId && body.decision) {
        const currentApps = await getKeyJson<Array<Record<string, unknown>>>(
          db,
          'applications',
          []
        );
        const decision = body.decision as string;
        const updatedApps = currentApps.map((app) =>
          app.referenceId === body.referenceId
            ? {
                ...app,
                status: decision,
                currentStep: decision === 'approved' ? 4 : 3,
                reviewedBy: body.reviewedBy || 'admin',
                reviewedAt: body.reviewedAt || now,
              }
            : app
        );
        await setKeyJson(db, 'applications', updatedApps, now);

        let updatedLogs: Array<Record<string, unknown>> | undefined;
        if (body.logEntry) {
          const currentLogs = await getKeyJson<Array<Record<string, unknown>>>(
            db,
            'activityLogs',
            []
          );
          updatedLogs = [
            body.logEntry as Record<string, unknown>,
            ...currentLogs,
          ].slice(0, 500);
          await setKeyJson(db, 'activityLogs', updatedLogs, now);
        }

        await syncRelationalTables(
          db,
          {
            applications: updatedApps,
            ...(updatedLogs ? { activityLogs: updatedLogs } : {}),
          },
          now
        );

        return new Response(
          JSON.stringify({
            ok: true,
            d1Connected: true,
            applications: updatedApps,
            updatedAt: now,
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Standard key-value state sync for allowed collections + organized SQL table sync
      const statements: D1PreparedStatement[] = [];
      const payload = (body.data && typeof body.data === 'object' ? body.data : body) as Record<
        string,
        unknown
      >;

      for (const key of ALLOWED_KEYS) {
        if (key in payload && payload[key] !== undefined) {
          statements.push(
            db
              .prepare(
                `INSERT INTO kdu_app_state (key, value, updated_at)
                 VALUES (?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET
                   value = excluded.value,
                   updated_at = excluded.updated_at`
              )
              .bind(key, JSON.stringify(payload[key]), now)
          );
        }
      }

      if (statements.length > 0) {
        await db.batch(statements);
      }

      await syncRelationalTables(db, payload, now);

      return new Response(
        JSON.stringify({
          ok: true,
          d1Connected: true,
          updatedAt: now,
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
      { status: 405, headers: CORS_HEADERS }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        d1Connected: false,
        error: error instanceof Error ? error.message : 'D1 Database Error',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// Cloudflare Pages Function Handler (mounted automatically at /api/state on Cloudflare Pages)
export const onRequest = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  return handleApiStateRequest(context.request, context.env);
};
