import { html, raw } from 'hono/html';
import { boards } from '$config';

interface NavProps {
  board: string;
}

export const SubbackNav = (props: NavProps) => {
  const { board } = props;
  return (
    <nav class="nav">
      <ul class="nav__list">
        <li class="nav__item"><a href="/">トップ</a></li>
        <li class="nav__item"><a href={`/${board}`}>板に戻る</a></li>
      </ul>
    </nav>
  );
};

interface BadgeProps {
  count: number;
}

const ThreadBadge = ({ count }: BadgeProps) => {
  let style = '';
  if (count >= 1000) style = 'color: #cc0000; font-weight: bold;';
  else if (count >= 900) style = 'color: #cc6600;';
  else if (count >= 500) style = 'color: #666600;';
  return <span class="thread-list__count" style={style}>({count})</span>;
};

interface ThreadItemProps {
  board: string;
  id: string;
  subject: string;
  length: number;
  archived?: boolean;
}

export const ThreadItem = (props: ThreadItemProps) => {
  const { board, id, subject, length, archived = false } = props;
  return (
    <li class="thread-list__item">
      <a href={`/test/read.cgi/${board}/${id}`} class="thread-list__link">{subject}</a>
      {' '}<ThreadBadge count={length} />
      {archived && <span style="color: #999; font-size: 0.8rem; margin-left: 0.5rem;">[過去ログ]</span>}
    </li>
  );
};

interface ThreadSubject {
  id: string;
  subject: string;
  length: number;
  archived?: boolean;
}

interface StatsProps {
  subjects?: ThreadSubject[];
}

export const ThreadStats = (props: StatsProps) => {
  const { subjects = [] } = props;
  const totalThreads = subjects.length;
  const totalPosts = subjects.reduce((sum, t) => sum + (t.length ?? 0), 0);
  const activeThreads = subjects.filter(t => !t.archived).length;
  
  return (
    <div class="stats-bar">
      <p style="margin: 0; font-size: 0.875rem;">
        <strong>スレッド数:</strong> <span id="thread-count">{totalThreads}</span>
        {activeThreads !== totalThreads && ` (アクティブ: ${activeThreads})`}
        {' | '}
        <strong>総レス数:</strong> <span id="post-count">{totalPosts.toLocaleString()}</span>
      </p>
    </div>
  );
};

interface AutoRefreshProps {
  board: string;
  count: number;
}

const SubbackAutoRefresh = ({ board, count }: AutoRefreshProps) => {
  const script = `
(function(){
  var count=${count},interval=null,status=document.getElementById('auto-status');
  var btn=document.getElementById('auto-toggle');
  if(!btn||!status)return;
  function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function badge(n){
    var s='';
    if(n>=1000)s='color:#cc0000;font-weight:bold;';
    else if(n>=900)s='color:#cc6600;';
    else if(n>=500)s='color:#666600;';
    return '<span class="thread-list__count" style="'+s+'">('+n+')</span>';
  }
  function renderThread(t){
    var h='<li class="thread-list__item"><a href="/test/read.cgi/${board}/'+t.id+'" class="thread-list__link">'+esc(t.subject)+'</a> '+badge(t.length);
    if(t.archived)h+='<span style="color:#999;font-size:0.8rem;margin-left:0.5rem;">[過去ログ]</span>';
    return h+'</li>';
  }
  function check(){
    status.textContent='確認中...';
    fetch('/${board}/api/threads')
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.threads&&d.total!==count){
          var list=document.querySelector('.thread-list');
          if(list){
            list.innerHTML=d.threads.map(renderThread).join('');
          }
          count=d.total;
          var tc=document.getElementById('thread-count');
          if(tc)tc.textContent=d.total;
          var pc=document.getElementById('post-count');
          if(pc)pc.textContent=d.threads.reduce(function(s,t){return s+(t.length||0);},0).toLocaleString();
          status.textContent=d.total+'スレッド (更新)';
          setTimeout(function(){status.textContent=count+'スレッド';},3000);
        }else{
          status.textContent=count+'スレッド';
        }
      })
      .catch(function(e){status.textContent='エラー';console.error(e);});
  }
  function start(){interval=setInterval(check,10000);btn.textContent='自動更新: ON';btn.classList.add('active');check();}
  function stop(){if(interval)clearInterval(interval);interval=null;btn.textContent='自動更新: OFF';btn.classList.remove('active');}
  btn.onclick=function(){interval?stop():start();};
  start();
})();
`;
  return html`<script>${raw(script)}</script>`;
};

interface SubbackProps {
  board: string;
  subjects?: ThreadSubject[];
}

export const Subback = (props: SubbackProps) => {
  const { board, subjects = [] } = props;
  const boardConfig = boards[board];

  if (subjects.length === 0) {
    return html`
      <div>
        <div class="thread-header">
          <h1 class="thread-header__title">${boardConfig?.title?.name ?? board} - スレッド一覧</h1>
          <p class="thread-header__meta">
            <span id="auto-status">0スレッド</span>
            <button id="auto-toggle" class="auto-btn active">自動更新: ON</button>
          </p>
        </div>
        ${SubbackNav({ board })}
        <hr />
        <p style="text-align: center; padding: 2rem;">
          スレッドがありません。<a href="/${board}">新しいスレッドを立てる</a>
        </p>
        ${SubbackAutoRefresh({ board, count: 0 })}
      </div>
    `;
  }

  return html`
    <div>
      <div class="thread-header">
        <h1 class="thread-header__title">${boardConfig?.title?.name ?? board} - スレッド一覧</h1>
        <p class="thread-header__meta">
          <span id="auto-status">${subjects.length}スレッド</span>
          <button id="auto-toggle" class="auto-btn active">自動更新: ON</button>
        </p>
      </div>
      ${SubbackNav({ board })}
      <hr />
      ${ThreadStats({ subjects })}
      <ol class="thread-list">
        ${subjects.map((thread) => ThreadItem({ board, id: thread.id, subject: thread.subject, length: thread.length, archived: thread.archived }))}
      </ol>
      <hr />
      <p class="text-center"><a href="/${board}">新しいスレッドを立てる</a></p>
      ${SubbackAutoRefresh({ board, count: subjects.length })}
    </div>
  `;
};
