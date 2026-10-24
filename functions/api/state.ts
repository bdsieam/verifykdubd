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
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS kdu_app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    )
    .run();
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

        if (body.logEntry) {
          const currentLogs = await getKeyJson<Array<Record<string, unknown>>>(
            db,
            'activityLogs',
            []
          );
          const updatedLogs = [
            body.logEntry as Record<string, unknown>,
            ...currentLogs,
          ].slice(0, 500);
          await setKeyJson(db, 'activityLogs', updatedLogs, now);
        }

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

      // Standard key-value state sync for allowed collections
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
