import { html } from 'hono/html';
import { boards } from '$config';
import { Layout } from '$lib/layouts';

const SettingPage = ({ board, boardConfig }) => {
  const { title, nanashi, description, limit, rules, cookie, turnstile } = boardConfig;
  
  return html`
    <div class="settings-page">
      <div class="settings-header">
        <h1>板設定</h1>
      </div>
      
      <div class="settings-grid">
        <div class="settings-card">
          <h2>基本情報</h2>
          <dl class="settings-list">
            <div class="settings-item">
              <dt>板名</dt>
              <dd>${title.name}</dd>
            </div>
            <div class="settings-item">
              <dt>板ID</dt>
              <dd>${board}</dd>
            </div>
            <div class="settings-item">
              <dt>説明</dt>
              <dd>${description || '(なし)'}</dd>
            </div>
            <div class="settings-item">
              <dt>デフォルト名無し</dt>
              <dd>${nanashi}</dd>
            </div>
          </dl>
        </div>
        
        <div class="settings-card">
          <h2>文字数制限</h2>
          <dl class="settings-list">
            <div class="settings-item">
              <dt>スレッドタイトル</dt>
              <dd>${limit.subject} 文字</dd>
            </div>
            <div class="settings-item">
              <dt>名前</dt>
              <dd>${limit.name} 文字</dd>
            </div>
            <div class="settings-item">
              <dt>メール</dt>
              <dd>${limit.mail} 文字</dd>
            </div>
            <div class="settings-item">
              <dt>本文</dt>
              <dd>${limit.message} 文字</dd>
            </div>
          </dl>
        </div>
        
        <div class="settings-card">
          <h2>機能設定</h2>
          <dl class="settings-list">
            <div class="settings-item">
              <dt>Cookie認証</dt>
              <dd class="${cookie ? 'status-on' : 'status-off'}">${cookie ? 'ON' : 'OFF'}</dd>
            </div>
            <div class="settings-item">
              <dt>Turnstile認証</dt>
              <dd class="${turnstile ? 'status-on' : 'status-off'}">${turnstile ? 'ON' : 'OFF'}</dd>
            </div>
            <div class="settings-item">
              <dt>スレ立て規制</dt>
              <dd>${limit.thread} 秒</dd>
            </div>
          </dl>
        </div>
        
        <div class="settings-card">
          <h2>板ルール</h2>
          ${rules && rules.length > 0 ? html`
            <ul class="rules-list">
              ${rules.map((rule, i) => html`<li><span class="rule-num">${i + 1}.</span> ${rule}</li>`)}
            </ul>
          ` : html`<p class="no-rules">ルールなし</p>`}
        </div>
      </div>
      
      <div class="settings-nav">
        <a href="/${board}/" class="btn">← 板に戻る</a>
        <a href="/${board}/SETTING.TXT" class="btn btn-secondary">生データ (SETTING.TXT)</a>
      </div>
    </div>
    
    <style>
      .settings-page { max-width: 900px; margin: 0 auto; }
      .settings-header { text-align: center; margin-bottom: 2rem; }
      .settings-header h1 { font-size: 1.75rem; }
      .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
      .settings-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
      .settings-card h2 { font-size: 1.1rem; color: var(--accent); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--accent); }
      .settings-list { margin: 0; }
      .settings-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light); }
      .settings-item:last-child { border-bottom: none; }
      .settings-item dt { font-weight: 500; color: var(--text-secondary); }
      .settings-item dd { margin: 0; font-weight: 600; }
      .status-on { color: #22c55e; }
      .status-off { color: var(--text-muted); }
      .rules-list { margin: 0; padding: 0; list-style: none; }
      .rules-list li { padding: 0.75rem 0; border-bottom: 1px solid var(--border-light); display: flex; gap: 0.5rem; }
      .rules-list li:last-child { border-bottom: none; }
      .rule-num { color: var(--accent); font-weight: bold; min-width: 1.5rem; }
      .no-rules { color: var(--text-muted); font-style: italic; }
      .settings-nav { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
      .btn { display: inline-block; padding: 0.75rem 1.5rem; background: var(--accent); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: opacity 0.2s; }
      .btn:hover { opacity: 0.9; }
      .btn-secondary { background: var(--bg-secondary); color: var(--text); border: 1px solid var(--border); }
    </style>
  `;
};

export default {
  get: c => {
    const { board } = c.req.param();
    const boardConfig = boards[board];
    if (!boardConfig) {
      return c.text('Board not found', 404);
    }
    const { title } = boardConfig;

    return c.html(Layout({
      title: `板設定 - ${title.name}`,
      children: SettingPage({ board, boardConfig })
    }));
  },
  
  txt: c => {
    const { board } = c.req.param();
    const boardConfig = boards[board];
    if (!boardConfig) {
      return c.text('Board not found', 404);
    }
    const { title, nanashi, limit } = boardConfig;

    return c.sjis.text([
      board,
      `BBS_TITLE=${title.name ?? 'まいちゃん(管理)'}`,
      `BBS_TITLE_ORIG=${title.name ?? 'まいちゃん(管理)'}`,
      `BBS_TITLE_PICTURE=${title.logo ?? ''}`,
      `BBS_NONAME_NAME=${nanashi ?? 'まいちゃん'}`,
      `BBS_SUBJECT_COUNT=${limit.subject ?? '96'}`,
      `BBS_NAME_COUNT=${limit.name ?? '96'}`,
      `BBS_MAIL_COUNT=${limit.mail ?? '96'}`,
      `BBS_MESSAGE_COUNT=${limit.message ?? '4096'}`,
      `BBS_THREAD_TATESUGI=${limit.thread ?? '8'}`
    ].join('\n'));
  }
};