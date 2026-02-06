import { Hono } from 'hono';
import { board, test, admin } from '$routes';
import { config, boards } from '$config';
import { Layout, Board } from '$lib/layouts';
import { 
  realIP, 
  sjisResponse, 
  rateLimit, 
  csrf, 
  securityHeaders,
  requestLogger 
} from '$lib/middlewares';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// ========================================
// Global Middlewares (order matters)
// ========================================

// Security headers (first for all responses)
app.use('*', securityHeaders());

app.use('*', requestLogger());

app.use('*', realIP());

app.use('*', sjisResponse());

// Skip CSRF for special endpoints (bbs.cgi uses Shift-JIS, admin handles its own)
app.use('*', csrf({ skipPaths: ['/test/bbs.cgi', '/admin'] }));

app.post('*', rateLimit({ 
  windowMs: 60000,  // 1 minute window
  max: 10,          // 10 requests per minute
  message: 'ＥＲＲＯＲ: 書き込み頻度が高すぎます。1分後に再試行してください。'
}));


app.get('/', (c: any) => {
  const boardList = Object.entries(boards).map(([key, data]) => ({
    key,
    name: data.title?.name ?? key,
    description: data.description ?? ''
  }));

  return c.html(
    <Layout title={config.app.name} siteName={false} csrfToken={c.csrfToken}>
      <div class="thread-header">
        <h1 class="thread-header__title">{config.app.name}</h1>
        <p class="thread-header__meta">2ちゃんねる互換掲示板</p>
      </div>
      
      <hr />
      
      <h2>板一覧</h2>
      
      <ul class="board-list">
        {boardList.map(({ key, name, description }) => (
          <li class="board-list__item">
            <a href={`/${key}`} class="board-list__link">
              <span>{name}</span>
              {description && <small>{description}</small>}
            </a>
          </li>
        ))}
      </ul>
      
      {boardList.length === 0 && (
        <p class="text-center">板がありません</p>
      )}
    </Layout>
  );
});

// Mount sub-routes
app.route('/test', test);
app.route('/admin', admin);
app.route(`/:board{${Object.keys(boards).join('|')}}`, board);

app.get(`/:board{${Object.keys(boards).join('|')}/?}`, (c: any) => {
  const boardName = c.req.param('board').replace(/\/$/, '');
  const boardConfig = boards[boardName];
  
  if (!boardConfig) {
    return c.notFound();
  }

  return c.html(
    <Layout 
      title={boardConfig.title?.name ?? boardName}
      csrfToken={c.csrfToken}
    >
      <Board board={boardName} csrfToken={c.csrfToken} />
    </Layout>
  );
});


app.notFound((c: any) => {
  return c.html(
    <Layout title="404 Not Found">
      <div class="thread-header">
        <h1 class="thread-header__title">404 - ページが見つかりません</h1>
      </div>
      <hr />
      <p class="text-center">
        お探しのページは存在しないか、削除された可能性があります。
      </p>
      <p class="text-center">
        <a href="/">トップページに戻る</a>
      </p>
    </Layout>,
    404
  );
});

app.onError((err: Error, c: any) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  
  return c.html(
    <Layout title="500 Server Error">
      <div class="thread-header">
        <h1 class="thread-header__title">500 - サーバーエラー</h1>
      </div>
      <hr />
      <p class="text-center">
        予期せぬエラーが発生しました。しばらく経ってから再試行してください。
      </p>
      <p class="text-center">
        <a href="/">トップページに戻る</a>
      </p>
    </Layout>,
    500
  );
});

export default app;
