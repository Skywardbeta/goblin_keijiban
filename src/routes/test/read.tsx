import { getThread } from '$db';
import { parseDat, parseRange } from '$lib/utils';
import { Layout, Read } from '$lib/layouts';
import { boards } from '$config';

export default {
  // API endpoint for fetching new posts (for auto-refresh)

  api: async c => {
    const board = c.req.param('boardName');
    const id = c.req.param('id');
    const after = parseInt(c.req.query('after') || '0', 10);

    if (!(board in boards)) return c.json({ error: 'Board not found' }, 404);

    const data = await getThread(c, id);
    if (!data || data.board !== board) return c.json({ error: 'Thread not found' }, 404);

    const { comments } = parseDat(data.dat);
    const newComments = comments.filter(p => p.id > after);

    return c.json({ 
      posts: newComments,
      total: comments.length,
      archived: data.archived
    });
  },

  get: async c => {
    const board = c.req.param('boardName');
    const [id, range] = c.req.param('id').split('/');

    if (!(board in boards)) return c.notFound();

    const data = await getThread(c, id);

    if (!data || data.board !== board) {
      return c.html(
        <Layout title="エラー">
          <div class="thread-header"><h1 class="thread-header__title">エラー</h1></div>
          <hr />
          <p class="text-center">スレッドが見つかりませんでした。</p>
          <p class="text-center"><a href={`/${board}/subback.html`}>スレッド一覧に戻る</a></p>
        </Layout>,
        404
      );
    }

    let { subject, comments } = parseDat(data.dat);

    if (range) {
      const parsed = parseRange(`${id}/${range}`);
      if (parsed.res) {
        const resNumbers = parsed.res.map(n => parseInt(n, 10));
        comments = comments.filter(comment => resNumbers.includes(comment.id));
      } else if (parsed.last) {
        comments = comments.slice(-parsed.last);
      } else if (parsed.start || parsed.end) {
        const startNum = parsed.start || 1;
        const endNum = parsed.end || comments.length;
        comments = comments.filter(comment => comment.id >= startNum && comment.id <= endNum);
      }
    }

    const boardConfig = boards[board];

    return c.html(
      <Layout title={`${subject || 'Thread'} - ${boardConfig?.title?.name ?? board}`} csrfToken={c.csrfToken}>
        <Read id={id} board={board} subject={subject} comments={comments} archived={data.archived} csrfToken={c.csrfToken} />
      </Layout>
    );
  }
};
