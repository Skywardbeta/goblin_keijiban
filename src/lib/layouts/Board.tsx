import { boards } from '$config';

interface BoardProps {
  board: string;
  csrfToken?: string;
}

export const ThreadForm = (props: BoardProps) => {
  const { board, csrfToken = '' } = props;
  const boardConfig = boards[board];
  const limits = boardConfig?.limit ?? {};

  return (
    <form action="/test/bbs.cgi" method="POST" accept-charset="Shift_JIS" class="form">
      <h3 class="form__title">新規スレッド作成</h3>
      <input type="hidden" name="bbs" value={board} />
      {csrfToken && <input type="hidden" name="_csrf" value={csrfToken} />}

      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="subject">スレタイ</label>
          <input type="text" id="subject" name="subject" class="form__input" maxlength={limits.subject ?? 128} required placeholder="スレッドのタイトル" />
        </div>
        <p class="form__hint">最大{limits.subject ?? 128}文字</p>
      </div>

      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="name-new">名前</label>
          <input type="text" id="name-new" name="FROM" class="form__input" maxlength={limits.name ?? 96} placeholder={boardConfig?.nanashi ?? '名無し'} />
        </div>
      </div>

      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="mail-new">メール</label>
          <input type="text" id="mail-new" name="mail" class="form__input" maxlength={limits.mail ?? 96} placeholder="省略可" />
        </div>
      </div>

      <div class="form__group">
        <div class="form__row">
          <label class="form__label" for="message-new">本文</label>
          <textarea id="message-new" name="MESSAGE" class="form__textarea" maxlength={limits.message ?? 4096} required placeholder="本文を入力" />
        </div>
        <p class="form__hint">最大{limits.message ?? 4096}文字</p>
      </div>

      <div class="form__actions">
        <button type="submit" name="submit" value="新規スレッド作成" class="form__submit">新規スレッド作成</button>
      </div>
    </form>
  );
};

interface NavProps {
  board: string;
}

export const BoardNav = (props: NavProps) => {
  const { board } = props;
  return (
    <nav class="nav">
      <ul class="nav__list">
        <li class="nav__item"><a href="/">トップ</a></li>
        <li class="nav__item"><a href={`/${board}/subback.html`}>スレッド一覧</a></li>
        <li class="nav__item"><a href={`/${board}/setting`}>板設定</a></li>
      </ul>
    </nav>
  );
};

export const BoardInfo = (props: NavProps) => {
  const { board } = props;
  const boardConfig = boards[board];
  
  return (
    <section class="board-info">
      <p>この板では1スレッド最大1000レスまで書き込めます。</p>
      <p><small>名前欄に何も入力しないと「{boardConfig?.nanashi ?? '名無し'}」になります。</small></p>
      {boardConfig?.rules && (
        <ul style="margin-top: 0.5rem; font-size: 0.875rem;">
          {boardConfig.rules.map((rule: string) => <li>{rule}</li>)}
        </ul>
      )}
    </section>
  );
};

export const Board = (props: BoardProps) => {
  const { board, csrfToken = '' } = props;
  const boardConfig = boards[board];

  return (
    <div>
      <div class="thread-header">
        <h1 class="thread-header__title">{boardConfig?.title?.name ?? board}</h1>
      </div>
      <BoardNav board={board} />
      <hr />
      <BoardInfo board={board} />
      <hr />
      <ThreadForm board={board} csrfToken={csrfToken} />
    </div>
  );
};
