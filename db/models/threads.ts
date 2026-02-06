import { desc, eq, and, sql, like } from "drizzle-orm";
import { threads } from '$db';
import { config } from '$config';

const first = r => r.length ? r[0] : null;

export const allThreads = ({ db }) =>
  db.select().from(threads).orderBy(desc(threads.updatedAt)).all();

export const boardThreads = ({ db }, board) =>
  db.select().from(threads).where(eq(threads.board, board)).orderBy(desc(threads.updatedAt)).all();

export const getSubjects = async ({ db }, board) => {
  const data = await db.select({ id: threads.id, dat: threads.dat, archived: threads.archived, updatedAt: threads.updatedAt })
    .from(threads)
    .where(eq(threads.board, board))
    .orderBy(desc(threads.updatedAt))
    .all();

  const subjects = data.map(({ id, dat, archived, updatedAt }) => {
    const lines = dat.split('\n').filter(l => l.trim());
    return { id, subject: lines[0]?.split('<>').pop() ?? '', length: lines.length, archived, updatedAt };
  });

  const activeSubjects = subjects.filter(s => !s.archived);
  return {
    subjects,
    text: activeSubjects.map(v => `${v.id}.dat<>${v.subject} (${v.length})\n`).join('')
  };
};

export const getThread = ({ db }, id) =>
  db.select().from(threads).where(eq(threads.id, id)).limit(1).then(r => first(r));

export const getDat = ({ db }, id) =>
  db.select({ dat: threads.dat }).from(threads).where(eq(threads.id, id)).limit(1).then(r => first(r));

export const createThread = ({ db }, board, dat) =>
  db.insert(threads).values({ board, dat }).returning({ id: threads.id, board: threads.board }).then(r => first(r));

export const archivedThread = ({ db }, id) =>
  db.update(threads).set({ archived: true }).where(eq(threads.id, id)).returning({ id: threads.id });

export const unarchiveThread = ({ db }, id) =>
  db.update(threads).set({ archived: false }).where(eq(threads.id, id)).returning({ id: threads.id });

export const updateThread = async ({ db }, id, dat) => {
  const maxPosts = config.moderation?.maxPostsPerThread ?? 1000;
  
  const data = await db.update(threads)
    .set({ dat: sql`${threads.dat} || ${dat}`, updatedAt: new Date() })
    .where(and(eq(threads.id, id), eq(threads.archived, false)))
    .returning({ id: threads.id, board: threads.board, dat: threads.dat })
    .then(r => first(r));

  if (data?.dat.split('\n').filter(l => l.trim()).length >= maxPosts) {
    await archivedThread({ db }, id);
  }

  return data;
};

export const deleteThread = ({ db }, id) =>
  db.delete(threads).where(eq(threads.id, id)).returning({ id: threads.id }).then(r => first(r));

export const deletePost = async ({ db }, threadId, postNumber) => {
  const thread = await getThread({ db }, threadId);
  if (!thread) return null;

  const lines = thread.dat.split('\n');
  const index = postNumber - 1;
  if (index < 0 || index >= lines.length) return null;

  const parts = lines[index].split('<>');
  if (parts.length >= 4) {
    parts[0] = 'あぼーん';
    parts[3] = 'あぼーん';
    lines[index] = parts.join('<>');
  }

  return db.update(threads).set({ dat: lines.join('\n') }).where(eq(threads.id, threadId)).returning({ id: threads.id, board: threads.board }).then(r => first(r));
};

export const searchThreads = ({ db }, query, board = null) => {
  const pattern = `%${query}%`;
  const where = board ? and(eq(threads.board, board), like(threads.dat, pattern)) : like(threads.dat, pattern);
  return db.select().from(threads).where(where).orderBy(desc(threads.updatedAt)).limit(100).all();
};

export const getStats = async ({ db }, board = null) => {
  const where = board ? eq(threads.board, board) : undefined;
  const data = await db.select({ id: threads.id, dat: threads.dat, archived: threads.archived }).from(threads).where(where).all();

  const totalThreads = data.length;
  const archivedThreads = data.filter(t => t.archived).length;
  const totalPosts = data.reduce((sum, t) => sum + t.dat.split('\n').filter(l => l.trim()).length, 0);

  return { totalThreads, activeThreads: totalThreads - archivedThreads, archivedThreads, totalPosts };
};
