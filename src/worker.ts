import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import APP from './app.tsx';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c: any, next) => {
  c.db = drizzle(c.env.DB);
  await next();
});

app.route('/', APP);

export default app;
