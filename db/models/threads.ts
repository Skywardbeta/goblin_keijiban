import { desc, eq, and, sql, like } from "drizzle-orm";
import { threads, type Thread } from '$db';
import { config } from '$config';

interface DbContext {
  db: any;
}

interface Subject {
  id: number;
  subject: string;
  length: number;
  archived: boolean | null;
  updatedAt: Date | null;
}

interface SubjectsResult {
  subjects: Subject[];
  text: string;
}

interface Stats {
  totalThreads: number;
  activeThreads: number;
  archivedThreads: number;
  totalPosts: number;
}

const first = <T>(r: T[]): T | null => r.length ? r[0] : null;

export const allThreads = ({ db }: DbContext): Promise<Thread[]> =>
  db.select().from(threads).orderBy(desc(threads.updatedAt)).all();

export const boardThreads = ({ db }: DbContext, board: string): Promise<Thread[]> =>
  db.select().from(threads).where(eq(threads.board, board)).orderBy(desc(threads.updatedAt)).all();

export const getSubjects = async ({ db }: DbContext, board: string): Promise<SubjectsResult> => {
  const data = await db.select({ id: threads.id, dat: threads.dat, archived: threads.archived, updatedAt: threads.updatedAt })
    .from(threads)
    .where(eq(threads.board, board))
    .orderBy(desc(threads.updatedAt))
    .all();

  const subjects: Subject[] = data.map(({ id, dat, archived, updatedAt }: { id: number; dat: string | null; archived: boolean | null; updatedAt: Date | null }) => {
    const lines = (dat ?? '').split('\n').filter((l: string) => l.trim());
    return { id, subject: lines[0]?.split('<>').pop() ?? '', length: lines.length, archived, updatedAt };
  });

  const activeSubjects = subjects.filter(s => !s.archived);
  return {
    subjects,
    text: activeSubjects.map(v => `${v.id}.dat<>${v.subject} (${v.length})\n`).join('')
  };
};

export const getThread = ({ db }: DbContext, id: number): Promise<Thread | null> =>
  db.select().from(threads).where(eq(threads.id, id)).limit(1).then((r: Thread[]) => first(r));

export const getDat = ({ db }: DbContext, id: number): Promise<{ dat: string | null } | null> =>
  db.select({ dat: threads.dat }).from(threads).where(eq(threads.id, id)).limit(1).then((r: { dat: string | null }[]) => first(r));

export const createThread = ({ db }: DbContext, board: string, dat: string): Promise<{ id: number; board: string } | null> =>
  db.insert(threads).values({ board, dat }).returning({ id: threads.id, board: threads.board }).then((r: { id: number; board: string }[]) => first(r));

export const archivedThread = ({ db }: DbContext, id: number): Promise<{ id: number }[]> =>
  db.update(threads).set({ archived: true }).where(eq(threads.id, id)).returning({ id: threads.id });

export const unarchiveThread = ({ db }: DbContext, id: number): Promise<{ id: number }[]> =>
  db.update(threads).set({ archived: false }).where(eq(threads.id, id)).returning({ id: threads.id });

export const updateThread = async ({ db }: DbContext, id: number, dat: string): Promise<{ id: number; board: string; dat: string | null } | null> => {
  const maxPosts = config.moderation?.maxPostsPerThread ?? 1000;
  
  const data = await db.update(threads)
    .set({ dat: sql`${threads.dat} || ${dat}`, updatedAt: new Date() })
    .where(and(eq(threads.id, id), eq(threads.archived, false)))
    .returning({ id: threads.id, board: threads.board, dat: threads.dat })
    .then((r: { id: number; board: string; dat: string | null }[]) => first(r));

  if (data?.dat?.split('\n').filter((l: string) => l.trim()).length >= maxPosts) {
    await archivedThread({ db }, id);
  }

  return data;
};

export const deleteThread = ({ db }: DbContext, id: number): Promise<{ id: number } | null> =>
  db.delete(threads).where(eq(threads.id, id)).returning({ id: threads.id }).then((r: { id: number }[]) => first(r));

export const deletePost = async ({ db }: DbContext, threadId: number, postNumber: number): Promise<{ id: number; board: string } | null> => {
  const thread = await getThread({ db }, threadId);
  if (!thread) return null;

  const lines = (thread.dat ?? '').split('\n');
  const index = postNumber - 1;
  if (index < 0 || index >= lines.length) return null;

  const parts = lines[index].split('<>');
  if (parts.length >= 4) {
    parts[0] = 'あぼーん';
    parts[3] = 'あぼーん';
    lines[index] = parts.join('<>');
  }

  return db.update(threads).set({ dat: lines.join('\n') }).where(eq(threads.id, threadId)).returning({ id: threads.id, board: threads.board }).then((r: { id: number; board: string }[]) => first(r));
};

export const searchThreads = ({ db }: DbContext, query: string, board: string | null = null): Promise<Thread[]> => {
  const pattern = `%${query}%`;
  const where = board ? and(eq(threads.board, board), like(threads.dat, pattern)) : like(threads.dat, pattern);
  return db.select().from(threads).where(where).orderBy(desc(threads.updatedAt)).limit(100).all();
};

export const getStats = async ({ db }: DbContext, board: string | null = null): Promise<Stats> => {
  const where = board ? eq(threads.board, board) : undefined;
  const data: { id: number; dat: string | null; archived: boolean | null }[] = await db.select({ id: threads.id, dat: threads.dat, archived: threads.archived }).from(threads).where(where).all();

  const totalThreads = data.length;
  const archivedThreads = data.filter(t => t.archived).length;
  const totalPosts = data.reduce((sum, t) => sum + (t.dat ?? '').split('\n').filter((l: string) => l.trim()).length, 0);

  return { totalThreads, activeThreads: totalThreads - archivedThreads, archivedThreads, totalPosts };
};
