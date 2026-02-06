import { html, raw } from 'hono/html';
import { boards } from '$config';
import type { Comment } from 'types';

const escapeHtml = (s: string | null | undefined): string => {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const escapeAttr = (v: string | null | undefined): string => v ? v.replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';

const renderMessage = (message: string | null | undefined): string => {
  if (!message) return '';
  
  let out = message.replace(/<br>/gi, '\n');
  out = escapeHtml(out);
  out = out.replace(/\n/g, '<br>');
  
  out = out.replace(
    /(?:h?ttps?:\/\/|www\.)[^\s<>"'&]+/gi,
    (m) => {
      let href = m;
      if (!href.match(/^https?:\/\//i)) href = 'https://' + href;
      return `<a href="${href.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${m}</a>`;
    }
  );
  
  out = out.replace(/&gt;&gt;(\d+)/g, '<a href="#post-$1" class="anchor">&gt;&gt;$1</a>');
  out = out.replace(/(^|<br>)(&gt;[^<]*)/g, '$1<span class="quote">$2</span>');
  
  return out;
};

interface KakikomiFormProps {
  board: string;
  id: string;
  archived?: boolean;
  csrfToken?: string;
}

export const KakikomiForm = (props: KakikomiFormProps) => {
  const { board, id, archived = false, csrfToken = '' } = props;
  const boardConfig = boards[board];
  const limits = boardConfig?.limit ?? {};

  if (archived) {
    return (
      <div class="form form--disabled">
        <div class="form__notice">
          <strong>このスレッドは過去ログです</strong>
          <p>書き込みはできません</p>
        </div>
      </div>
    );
  }

  return (
    <form action="/test/bbs.cgi" method="POST" accept-charset="Shift_JIS" class="form">
      <h3 class="form__title">書き込む</h3>
      <input type="hidden" name="bbs" value={board} />
      <input type="hidden" name="key" value={id} />
      {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}
      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="name-reply">名前</label>
          <input type="text" id="name-reply" name="FROM" class="form__input" maxlength={limits.name ?? 96} placeholder={boardConfig?.nanashi ?? '名無し'} />
        </div>
      </div>
      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="mail-reply">メール</label>
          <input type="text" id="mail-reply" name="mail" class="form__input" maxlength={limits.mail ?? 96} placeholder="省略可（sageで下げ）" />
        </div>
      </div>
      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="message-reply">本文</label>
          <textarea id="message-reply" name="MESSAGE" class="form__textarea" maxlength={limits.message ?? 4096} required placeholder="本文を入力" />
        </div>
        <p class="form__hint">最大{limits.message ?? 4096}文字</p>
      </div>
      <div class="form__actions">
        <button type="submit" name="submit" value="書き込む" class="form__submit">書き込む</button>
      </div>
    </form>
  );
};

interface PostProps {
  id: number;
  name: string;
  mail?: string;
  rawDate: string;
  uid?: string;
  message: string;
  isOP?: boolean;
}

export const Post = (props: PostProps) => {
  const { id, name, mail, rawDate, uid, message, isOP = false } = props;
  const isSage = mail?.toLowerCase() === 'sage';

  return (
    <article class={`post ${isOP ? 'post--op' : ''}`} id={`post-${id}`}>
      <header class="post__header">
        <span class="post__number">{id}</span>
        {mail && !isSage ? (
          <a href={`mailto:${escapeAttr(mail)}`} class="post__mail">{name}</a>
        ) : (
          <span class={`post__name ${isSage ? 'post__name--sage' : ''}`}>{name}</span>
        )}
        <time class="post__date">{rawDate}</time>
        {uid && <span class="post__uid">ID:{uid}</span>}
      </header>
      <div class="post__body">{raw(renderMessage(message))}</div>
    </article>
  );
};

interface CommentsProps {
  comments?: Comment[];
}

export const Comments = (props: CommentsProps) => {
  const { comments = [] } = props;
  if (comments.length === 0) return <p>レスがありません</p>;
  return (
    <section class="comments">
      {comments.map((comment, index) => <Post {...comment} isOP={index === 0} />)}
    </section>
  );
};

interface ThreadNavProps {
  board: string;
  id: string;
  totalPosts?: number;
}

export const ThreadNav = (props: ThreadNavProps) => {
  const { board, id, totalPosts = 0 } = props;
  return (
    <nav class="nav">
      <ul class="nav__list">
        <li class="nav__item"><a href="/">トップ</a></li>
        <li class="nav__item"><a href={`/${board}`}>板に戻る</a></li>
        <li class="nav__item"><a href={`/${board}/subback.html`}>スレ一覧</a></li>
        <li class="nav__item"><a href={`/${board}/dat/${id}.dat`}>DAT</a></li>
        <li class="nav__item"><span>{totalPosts}レス</span></li>
      </ul>
    </nav>
  );
};

interface AutoRefreshProps {
  board: string;
  id: string;
  count: number;
}

const AutoRefreshScript = ({ board, id, count }: AutoRefreshProps) => {
  const script = `
(function(){
  var count=${count},interval=null,status=document.getElementById('auto-status');
  var btn=document.getElementById('auto-toggle');
  if(!btn||!status)return;
  function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function renderMsg(m){
    if(!m)return'';
    var o=m.replace(/<br>/gi,'\\n');
    o=esc(o);
    o=o.replace(/\\n/g,'<br>');
    o=o.replace(/(?:h?ttps?:\\/\\/|www\\.)[^\\s<>"'&]+/gi,function(u){
      var h=u.match(/^https?:\\/\\//i)?u:'https://'+u;
      return'<a href="'+h.replace(/"/g,'&quot;')+'" target="_blank" rel="noopener noreferrer">'+u+'</a>';
    });
    o=o.replace(/&gt;&gt;(\\d+)/g,'<a href="#post-$1" class="anchor">&gt;&gt;$1</a>');
    o=o.replace(/(^|<br>)(&gt;[^<]*)/g,'$1<span class="quote">$2</span>');
    return o;
  }
  function addPost(p){
    var c=document.querySelector('.comments');if(!c)return;
    var sage=p.mail&&p.mail.toLowerCase()==='sage';
    var h='<article class="post" id="post-'+p.id+'"><header class="post__header">'
      +'<span class="post__number">'+p.id+'</span>';
    if(p.mail&&!sage)h+='<a href="mailto:'+esc(p.mail)+'" class="post__mail">'+esc(p.name)+'</a>';
    else h+='<span class="post__name'+(sage?' post__name--sage':'')+'">'+esc(p.name)+'</span>';
    h+='<time class="post__date">'+esc(p.rawDate)+'</time>';
    if(p.uid)h+='<span class="post__uid">ID:'+esc(p.uid)+'</span>';
    h+='</header><div class="post__body">'+renderMsg(p.message)+'</div></article>';
    c.insertAdjacentHTML('beforeend',h);
  }
  function check(){
    status.textContent='確認中...';
    fetch('/test/api/${board}/${id}/posts?after='+count)
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.posts&&d.posts.length){
          d.posts.forEach(addPost);
          count=d.total;
          status.textContent=d.total+'レス ('+d.posts.length+'件の新着)';
          setTimeout(function(){status.textContent=count+'レス';},3000);
        }else{status.textContent=count+'レス';}
        if(d.archived){stop();status.textContent+=' [過去ログ]';}
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

interface ReadProps {
  board: string;
  id: string;
  subject?: string;
  comments?: Comment[];
  archived?: boolean;
  csrfToken?: string;
}

export const Read = (props: ReadProps) => {
  const { board, id, subject = '', comments = [], archived = false, csrfToken = '' } = props;

  return html`
    <div>
      <div class="thread-header">
        <h1 class="thread-header__title">${subject}</h1>
        <p class="thread-header__meta">
          ${archived ? html`<span style="color: #cc0000; font-weight: bold;">【過去ログ】</span>` : ''}
          <span id="auto-status">${comments.length}レス</span>
          ${!archived ? html`<button id="auto-toggle" class="auto-btn active">自動更新: ON</button>` : ''}
        </p>
      </div>
      ${ThreadNav({ board, id, totalPosts: comments.length })}
      <hr />
      ${Comments({ comments })}
      <hr />
      ${KakikomiForm({ board, id, archived, csrfToken })}
      ${comments.length >= 980 && !archived ? html`
        <div class="form__notice" style="margin-top: 1rem;">
          <strong>注意</strong>: このスレッドは間もなく1000レスに達します
        </div>
      ` : ''}
      ${!archived ? AutoRefreshScript({ board, id, count: comments.length }) : ''}
    </div>
  `;
};
