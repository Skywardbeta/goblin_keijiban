import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const $timestamp = (name: string) => {
  return integer(name, { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`);
};

export const threads = sqliteTable('threads', {
  id: integer('id').primaryKey().default(sql`(strftime('%s', 'now'))`),
  archived: integer('archived', { mode: 'boolean' }).default(false).notNull(),
  board: text('board').notNull(),
  dat: text('dat'),
  createdAt: $timestamp('created_at').notNull(),
  updatedAt: $timestamp('updated_at').notNull(),
});

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
