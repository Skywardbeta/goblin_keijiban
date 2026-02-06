import { getThread } from '$db';

export default {
  get: async c => {
    const { board } = c.req.param();
    const id = c.req.param('id').replace('.dat', '');

    const thread = await getThread(c, id);

    if (!thread || thread.board !== board) {
      return c.sjis.text('ＥＲＲＯＲ: データの取得に失敗しました。', 404);
    }

    return c.sjis.text(thread.dat);
  }
};