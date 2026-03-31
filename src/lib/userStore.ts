import { createClient, type Client as LibsqlClient } from "@libsql/client";
import { db, initDb } from "@/db";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string | null;
  avatar: string | null;
};

type PasswordResetRow = {
  id: string;
  user_id: string;
  expires_at: string;
  used: number;
};

let tursoClient: LibsqlClient | null = null;
let tursoReady: Promise<void> | null = null;

function hasTursoConfig() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

function getTursoClient() {
  if (!hasTursoConfig()) return null;
  if (!tursoClient) {
    tursoClient = createClient({
      url: String(process.env.TURSO_DATABASE_URL),
      authToken: String(process.env.TURSO_AUTH_TOKEN),
    });
  }
  return tursoClient;
}

async function ensureTursoReady() {
  const client = getTursoClient();
  if (!client) return;
  if (!tursoReady) {
    tursoReady = (async () => {
      await client.batch(
        [
          `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'customer',
            avatar TEXT,
            wallet_balance REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
          );
        `,
          `
          CREATE TABLE IF NOT EXISTS password_resets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            token_hash TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
          );
        `,
          "CREATE INDEX IF NOT EXISTS idx_users_email_ci ON users(email);",
          "CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);",
        ],
        "write"
      );
    })();
  }
  await tursoReady;
}

function ensureLocalDbReady() {
  try {
    initDb();
  } catch {}
}

export const userStore = {
  isTursoEnabled() {
    return hasTursoConfig();
  },

  async findUserByEmail(email: string): Promise<UserRow | undefined> {
    const normalizedEmail = email.trim().toLowerCase();
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      const result = await client.execute({
        sql: `
          SELECT id, name, email, password, role, phone, avatar
          FROM users
          WHERE lower(email) = lower(?)
          LIMIT 1
        `,
        args: [normalizedEmail],
      });
      if (!result.rows.length) return undefined;
      const row = result.rows[0];
      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        password: String(row.password),
        role: String(row.role),
        phone: row.phone ? String(row.phone) : null,
        avatar: row.avatar ? String(row.avatar) : null,
      };
    }

    ensureLocalDbReady();
    return db.$client
      .prepare(
        "SELECT id, name, email, password, role, phone, avatar FROM users WHERE lower(email) = lower(?) LIMIT 1"
      )
      .get(normalizedEmail) as UserRow | undefined;
  },

  async createUser(input: {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string | null;
    role: string;
  }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      await client.execute({
        sql: `
          INSERT INTO users (id, name, email, password, phone, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          input.id,
          input.name,
          normalizedEmail,
          input.password,
          input.phone,
          input.role,
        ],
      });
      return;
    }

    ensureLocalDbReady();
    db.$client
      .prepare("INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)")
      .run(input.id, input.name, normalizedEmail, input.password, input.phone, input.role);
  },

  async createPasswordReset(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
  }) {
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      await client.execute({
        sql: `
          INSERT INTO password_resets (id, user_id, token_hash, expires_at, used)
          VALUES (?, ?, ?, ?, 0)
        `,
        args: [input.id, input.userId, input.tokenHash, input.expiresAt],
      });
      return;
    }

    ensureLocalDbReady();
    db.$client
      .prepare(
        "INSERT INTO password_resets (id, user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?, 0)"
      )
      .run(input.id, input.userId, input.tokenHash, input.expiresAt);
  },

  async findPasswordResetByTokenHash(tokenHash: string): Promise<PasswordResetRow | undefined> {
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      const result = await client.execute({
        sql: `
          SELECT id, user_id, expires_at, used
          FROM password_resets
          WHERE token_hash = ?
          LIMIT 1
        `,
        args: [tokenHash],
      });
      if (!result.rows.length) return undefined;
      const row = result.rows[0];
      return {
        id: String(row.id),
        user_id: String(row.user_id),
        expires_at: String(row.expires_at),
        used: Number(row.used ?? 0),
      };
    }

    ensureLocalDbReady();
    return db.$client
      .prepare(
        "SELECT id, user_id, expires_at, used FROM password_resets WHERE token_hash = ? LIMIT 1"
      )
      .get(tokenHash) as PasswordResetRow | undefined;
  },

  async updateUserPassword(userId: string, hashedPassword: string) {
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      await client.execute({
        sql: "UPDATE users SET password = ? WHERE id = ?",
        args: [hashedPassword, userId],
      });
      return;
    }

    ensureLocalDbReady();
    db.$client.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);
  },

  async markPasswordResetUsed(id: string) {
    const client = getTursoClient();
    if (client) {
      await ensureTursoReady();
      await client.execute({
        sql: "UPDATE password_resets SET used = 1 WHERE id = ?",
        args: [id],
      });
      return;
    }

    ensureLocalDbReady();
    db.$client.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(id);
  },
};
