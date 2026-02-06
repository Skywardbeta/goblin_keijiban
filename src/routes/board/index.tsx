import { Hono } from 'hono';
import { boards } from '$config';
import { Layout, Board, Subback } from '$lib/layouts';
import { getSubjects } from '$db';
import subject from './subject';
import setting from './setting';
import dat from './dat';

const app = new Hono();

// 2ch-compatible API endpoints
app.get('/subject.txt', subject.get);
app.get('/SETTING.TXT', setting.txt);
app.get('/dat/:id{[0-9]+\\.dat}', dat.get);

// Settings page (HTML UI)
app.get('/setting', setting.get);

// API endpoint for auto-refresh
app.get('/api/threads', async c => {
  const { board } = c.req.param();
  const { subjects } = await getSubjects(c, board);
  return c.json({ threads: subjects ?? [], total: subjects?.length ?? 0 });
});

app.get('/subback.html', async c => {
  const { board } = c.req.param();
  const boardConfig = boards[board];

  if (!boardConfig) {
    return c.notFound();
  }

  const { subjects } = await getSubjects(c, board);

  return c.html(
    <Layout 
      title={`${boardConfig.title?.name ?? board} - スレッド一覧`}
      csrfToken={c.csrfToken}
    >
      <Subback board={board} subjects={subjects ?? []} />
    </Layout>
  );
});

export default app;
