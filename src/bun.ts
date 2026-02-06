import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import APP from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? 'localhost';
const DB_PATH = process.env.DB ?? 'database.sqlite';

const sqlite = new Database(DB_PATH, { create: true });

const initSQL = `
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY DEFAULT (strftime('%s', 'now')),
  archived INTEGER NOT NULL DEFAULT 0,
  board TEXT NOT NULL,
  dat TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_threads_board ON threads(board);
CREATE INDEX IF NOT EXISTS idx_threads_active ON threads(board, archived, updated_at DESC);
`;

try {
  sqlite.exec(initSQL);
} catch (e) {

}

const db = drizzle(sqlite);

const app = new Hono();

app.use('*', async (c: any, next) => {
  c.db = db;
  c.env = {
    UID_SECRET: process.env.UID_SECRET,
    CSRF_SECRET: process.env.CSRF_SECRET,
  };
  await next();
});

app.route('/', APP);

console.log(`
╔════════════════════════════════════════════════╗
║        ゴブリン掲示板 - MyChan Server           ║
╠════════════════════════════════════════════════╣
║ Server running at:                             ║
║    http://${HOST}:${PORT.toString().padEnd(29)}║
║                                                ║
║  Database: ${DB_PATH.padEnd(32)}               ║
║  Environment: ${(process.env.NODE_ENV ?? 'development').padEnd(28)}║
╚════════════════════════════════════════════════╝
`);

export default {
  port: PORT,
  hostname: HOST,
  fetch: app.fetch,
};
