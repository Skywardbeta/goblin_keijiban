import { Hono } from 'hono';
import { config, boards } from '$config';
import { Layout } from '$lib/layouts';
import { sha256, parseDat } from '$lib/utils';
import { allThreads, boardThreads, getThread, deleteThread, deletePost, archivedThread, unarchiveThread, getStats } from '$db';
import { rateLimit, generateCSRFToken, validateCSRFToken } from '$lib/middlewares';

const app = new Hono();
globalThis.__adminSessions = globalThis.__adminSessions ?? new Map();
const adminSessions = globalThis.__adminSessions;
const SESSION_EXPIRY = 3600000;
const isHttps = process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true';

const generateSessionToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password) => {
  const expectedHash = config.moderation?.adminPasswordHash;
  if (!expectedHash) return false;
  const { hex } = await sha256(password);
  return hex === expectedHash;
};

const getSessionToken = (c) => {
  return c.req.header('Cookie')?.match(/admin_session=([^;]+)/)?.[1];
};

const requireAuth = async (c, next) => {
  const sessionToken = getSessionToken(c);
  if (!sessionToken || !adminSessions.has(sessionToken)) return c.redirect('/admin/login');
  
  const session = adminSessions.get(sessionToken);
  if (Date.now() > session.expiry) {
    adminSessions.delete(sessionToken);
    return c.redirect('/admin/login');
  }
  
  session.expiry = Date.now() + SESSION_EXPIRY;
  c.adminSession = session;
  c.sessionToken = sessionToken;
  c.csrfToken = await generateCSRFToken();
  await next();
};

const requireCsrf = async (c, next) => {
  const body = await c.req.parseBody();
  c.parsedBody = body;
  
  const valid = await validateCSRFToken(body._csrf);
  if (!valid) {
    return c.text('Invalid CSRF token', 403);
  }
  await next();
};

app.get('/login', async (c) => {
  const error = c.req.query('error');
  const loginCsrf = await generateCSRFToken();
  
  return c.html(
    <Layout title="管理者ログイン" showHeader={false} showFooter={false}>
      <div style="max-width: 400px; margin: 2rem auto; padding: 1rem;">
        <div class="thread-header">
          <h1 class="thread-header__title">管理者ログイン</h1>
        </div>
        {error && <p style="color: #cc0000; text-align: center; margin: 1rem 0;">ログインに失敗しました</p>}
        <form action="/admin/login" method="POST" class="form">
          <input type="hidden" name="_csrf" value={loginCsrf} />
          <div class="form__group">
            <div class="form__row">
              <label class="form__label" for="password">パスワード</label>
              <input type="password" id="password" name="password" class="form__input" required autocomplete="current-password" />
            </div>
          </div>
          <div class="form__actions">
            <button type="submit" class="form__submit">ログイン</button>
          </div>
        </form>
        <p style="text-align: center; margin-top: 1rem;"><a href="/">トップに戻る</a></p>
      </div>
    </Layout>
  );
});

app.post('/login', 
  rateLimit({ windowMs: 60000, max: 5, keyPrefix: 'admin-login', message: 'ログイン試行回数が多すぎます' }),
  async (c) => {
    const body = await c.req.parseBody();
    
    const loginCsrf = body._csrf;
    const csrfValid = await validateCSRFToken(loginCsrf);
    if (!csrfValid) {
      return c.redirect('/admin/login?error=csrf');
    }
    
    const password = body.password;
    if (!password || !(await verifyPassword(password))) {
      return c.redirect('/admin/login?error=1');
    }
    
    const token = generateSessionToken();
    adminSessions.set(token, { 
      createdAt: Date.now(), 
      expiry: Date.now() + SESSION_EXPIRY
    });
    
    const cookieFlags = `Path=/admin; HttpOnly; SameSite=Strict; Max-Age=3600${isHttps ? '; Secure' : ''}`;
    c.header('Set-Cookie', `admin_session=${token}; ${cookieFlags}`);
    return c.redirect('/admin');
  }
);

app.post('/logout', requireAuth, requireCsrf, (c) => {
  adminSessions.delete(c.sessionToken);
  c.header('Set-Cookie', `admin_session=; Path=/admin; HttpOnly; Max-Age=0${isHttps ? '; Secure' : ''}`);
  return c.redirect('/');
});

app.get('/', requireAuth, async (c) => {
  const stats = await getStats(c);
  
  return c.html(
    <Layout title="管理ダッシュボード" showHeader={false} csrfToken={c.csrfToken}>
      <div class="thread-header">
        <h1 class="thread-header__title">管理ダッシュボード</h1>
        <p class="thread-header__meta">
          <form action="/admin/logout" method="POST" style="display: inline;">
            <input type="hidden" name="_csrf" value={c.csrfToken} />
            <button type="submit" style="background: none; border: none; color: #cc0000; cursor: pointer; text-decoration: underline;">ログアウト</button>
          </form>
        </p>
      </div>
      <nav class="nav">
        <ul class="nav__list">
          <li class="nav__item"><a href="/">サイトトップ</a></li>
          <li class="nav__item"><a href="/admin">ダッシュボード</a></li>
          <li class="nav__item"><a href="/admin/threads">スレッド管理</a></li>
        </ul>
      </nav>
      <hr />
      <h2>統計情報</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin: 1rem 0;">
        <div class="form" style="text-align: center;">
          <p style="font-size: 1.8rem; font-weight: 600; color: #333;">{stats.totalThreads}</p>
          <p style="color: #666; font-size: 0.85rem;">総スレッド数</p>
        </div>
        <div class="form" style="text-align: center;">
          <p style="font-size: 1.8rem; font-weight: 600; color: #2a2;">{stats.activeThreads}</p>
          <p style="color: #666; font-size: 0.85rem;">アクティブ</p>
        </div>
        <div class="form" style="text-align: center;">
          <p style="font-size: 1.8rem; font-weight: 600; color: #888;">{stats.archivedThreads}</p>
          <p style="color: #666; font-size: 0.85rem;">過去ログ</p>
        </div>
        <div class="form" style="text-align: center;">
          <p style="font-size: 1.8rem; font-weight: 600; color: #06c;">{stats.totalPosts}</p>
          <p style="color: #666; font-size: 0.85rem;">総レス数</p>
        </div>
      </div>
      <hr />
      <h2>板一覧</h2>
      <ul class="board-list">
        {Object.keys(boards).map(key => (
          <li class="board-list__item">
            <a href={`/admin/threads?board=${key}`}>{boards[key].title?.name ?? key}</a>
          </li>
        ))}
      </ul>
    </Layout>
  );
});

app.get('/threads', requireAuth, async (c) => {
  const board = c.req.query('board');
  let threadList = (board && boards[board]) ? await boardThreads(c, board) : await allThreads(c);
  
  const threads = threadList.map(t => {
    const lines = t.dat.split('\n').filter(l => l.trim());
    return { ...t, subject: lines[0]?.split('<>').pop() ?? '', postCount: lines.length };
  });
  
  return c.html(
    <Layout title="スレッド管理" showHeader={false} csrfToken={c.csrfToken}>
      <div class="thread-header">
        <h1 class="thread-header__title">スレッド管理</h1>
      </div>
      <nav class="nav">
        <ul class="nav__list">
          <li class="nav__item"><a href="/admin">ダッシュボード</a></li>
          <li class="nav__item">
            <select onchange="location.href='/admin/threads?board='+this.value" style="padding: 0.25rem;">
              <option value="">全ての板</option>
              {Object.keys(boards).map(key => (
                <option value={key} selected={board === key}>{boards[key].title?.name ?? key}</option>
              ))}
            </select>
          </li>
        </ul>
      </nav>
      <hr />
      <p>{threads.length}件のスレッド</p>
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 0.5rem; text-align: left; border: 1px solid #e0e0e0;">ID</th>
            <th style="padding: 0.5rem; text-align: left; border: 1px solid #e0e0e0;">板</th>
            <th style="padding: 0.5rem; text-align: left; border: 1px solid #e0e0e0;">タイトル</th>
            <th style="padding: 0.5rem; text-align: center; border: 1px solid #e0e0e0;">レス</th>
            <th style="padding: 0.5rem; text-align: center; border: 1px solid #e0e0e0;">状態</th>
            <th style="padding: 0.5rem; text-align: center; border: 1px solid #e0e0e0;">操作</th>
          </tr>
        </thead>
        <tbody>
          {threads.map(t => (
            <tr style="background: #fff;">
              <td style="padding: 0.5rem; border: 1px solid #e8e8e8;">
                <a href={`/test/read.cgi/${t.board}/${t.id}`} target="_blank">{t.id}</a>
              </td>
              <td style="padding: 0.5rem; border: 1px solid #e8e8e8;">{t.board}</td>
              <td style="padding: 0.5rem; border: 1px solid #e8e8e8;">{t.subject.substring(0, 50)}{t.subject.length > 50 ? '...' : ''}</td>
              <td style="padding: 0.5rem; text-align: center; border: 1px solid #e8e8e8;">{t.postCount}</td>
              <td style="padding: 0.5rem; text-align: center; border: 1px solid #e8e8e8;">
                {t.archived ? <span style="color: #888;">過去ログ</span> : <span style="color: #2a2;">アクティブ</span>}
              </td>
              <td style="padding: 0.5rem; text-align: center; border: 1px solid #e8e8e8;">
                <form action={`/admin/thread/${t.id}/toggle-archive`} method="POST" style="display: inline;">
                  <input type="hidden" name="_csrf" value={c.csrfToken} />
                  <button type="submit" style="font-size: 0.8rem; padding: 0.25rem 0.5rem; cursor: pointer; background: #f5f5f5; border: 1px solid #ccc; border-radius: 3px;">
                    {t.archived ? '復元' : 'アーカイブ'}
                  </button>
                </form>
                {' '}
                <form action={`/admin/thread/${t.id}/delete`} method="POST" style="display: inline;" onsubmit="return confirm('本当に削除しますか？')">
                  <input type="hidden" name="_csrf" value={c.csrfToken} />
                  <button type="submit" style="font-size: 0.8rem; padding: 0.25rem 0.5rem; background: #d44; color: white; border: none; cursor: pointer; border-radius: 3px;">削除</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
});

app.post('/thread/:id/toggle-archive', requireAuth, requireCsrf, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const thread = await getThread(c, id);
  if (!thread) return c.text('Thread not found', 404);
  
  if (thread.archived) {
    await unarchiveThread(c, id);
  } else {
    await archivedThread(c, id);
  }
  
  return c.redirect('/admin/threads?board=' + thread.board);
});

app.post('/thread/:id/delete', requireAuth, requireCsrf, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const thread = await getThread(c, id);
  if (!thread) return c.text('Thread not found', 404);
  
  const board = thread.board;
  await deleteThread(c, id);
  return c.redirect('/admin/threads?board=' + board);
});

app.post('/thread/:id/post/:postNum/delete', requireAuth, requireCsrf, async (c) => {
  const threadId = parseInt(c.req.param('id'), 10);
  const postNum = parseInt(c.req.param('postNum'), 10);
  const thread = await getThread(c, threadId);
  if (!thread) return c.text('Thread not found', 404);
  
  const result = await deletePost(c, threadId, postNum);
  if (!result) return c.text('Post not found', 404);
  
  return c.redirect(`/test/read.cgi/${thread.board}/${threadId}`);
});

export default app;
