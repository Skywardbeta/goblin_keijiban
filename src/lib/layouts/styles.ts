export const css: string = `
:root {
  --bg: #fff;
  --bg-alt: #fafafa;
  --bg-card: #fff9f5;
  --text: #333;
  --text-muted: #666;
  --text-light: #888;
  --accent: #f5a962;
  --accent-dark: #e8944d;
  --accent-light: #ffc68a;
  --border: #fde4d0;
  --border-light: #fff0e6;
  --link: #d97b3d;
  --link-hover: #c06830;
  --success: #27ae60;
  --header-bg: linear-gradient(135deg, #f5a962 0%, #ffc68a 100%);
  --shadow: 0 2px 8px rgba(245,169,98,0.15);
}

html.dark {
  --bg: #1a1a1a;
  --bg-alt: #222;
  --bg-card: #252220;
  --text: #e0e0e0;
  --text-muted: #aaa;
  --text-light: #777;
  --accent: #f5a962;
  --accent-dark: #ffc68a;
  --accent-light: #e8944d;
  --border: #3a3530;
  --border-light: #332e28;
  --link: #f5a962;
  --link-hover: #ffc68a;
  --success: #2ecc71;
  --header-bg: linear-gradient(135deg, #c07840 0%, #e8944d 100%);
  --shadow: 0 2px 8px rgba(0,0,0,0.3);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; line-height: 1.6; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans CJK JP", sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.2s, color 0.2s;
}

a { color: var(--link); text-decoration: none; }
a:hover { color: var(--link-hover); text-decoration: underline; }

img { max-width: 100%; height: auto; }

h1 { font-size: 1.4rem; font-weight: 600; color: var(--text); }
h2 { font-size: 1.2rem; font-weight: 600; color: var(--text); margin: 0.75rem 0; }
h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0; }
p { margin: 0.5rem 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 1rem 0; }
small { font-size: 0.875rem; color: var(--text-muted); }

.container { max-width: 880px; margin: 0 auto; padding: 1rem; }

.header {
  background: var(--header-bg);
  padding: 0.75rem 1.5rem;
  box-shadow: var(--shadow);
}
.header__inner {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.header__brand { text-align: center; }
.header__title { font-size: 1.5rem; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.15); }
.header__title a { color: inherit; text-decoration: none; }
.header__subtitle { font-size: 0.75rem; color: rgba(255,255,255,0.9); margin-top: 0.1rem; }

.theme-toggle {
  position: absolute;
  right: 0;
  background: rgba(255,255,255,0.25);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
}
.theme-toggle:hover { background: rgba(255,255,255,0.4); transform: scale(1.1); }
.theme-toggle__icon { font-size: 1.2rem; color: #fff; }

.nav {
  background: var(--bg-card);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border);
}
.nav__list { list-style: none; display: flex; flex-wrap: wrap; gap: 1rem; }
.nav__item a { color: var(--accent-dark); font-size: 0.9rem; font-weight: 500; }

.main { padding: 1rem; background: var(--bg); }

.footer {
  background: var(--bg-alt);
  border-top: 1px solid var(--border);
  padding: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-top: 2rem;
}

.board-list { list-style: none; }
.board-list__item { padding: 0.6rem 0; border-bottom: 1px solid var(--border-light); }
.board-list__item:last-child { border-bottom: none; }

.thread-list { list-style: none; counter-reset: thread-counter; }
.thread-list__item {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--border-light);
  counter-increment: thread-counter;
  background: var(--bg-card);
  margin-bottom: 2px;
  border-radius: 4px;
  border-left: 3px solid var(--accent);
  transition: background 0.15s;
}
.thread-list__item::before {
  content: counter(thread-counter) ": ";
  color: var(--accent-dark);
  font-weight: 600;
  margin-right: 0.25rem;
}
.thread-list__item:hover { background: var(--bg-alt); }
.thread-list__link { color: var(--text); font-weight: 500; }
.thread-list__link:hover { color: var(--link-hover); }
.thread-list__count { color: var(--text-light); font-size: 0.85rem; margin-left: 0.5rem; }

.stats-bar {
  background: var(--bg-card);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid var(--border);
}

.thread-header {
  background: var(--bg-card);
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px 6px 0 0;
  border-left: 4px solid var(--accent);
}
.thread-header__title { font-size: 1.15rem; color: var(--text); font-weight: 600; }
.thread-header__meta { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.auto-btn {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.auto-btn:hover { border-color: var(--accent); }
.auto-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.post {
  border: 1px solid var(--border);
  border-top: none;
  background: var(--bg);
  padding: 0.75rem 1rem;
  transition: background 0.15s;
}
.post:nth-child(even) { background: var(--bg-alt); }
.post--op { border-top: 1px solid var(--border); border-radius: 0 0 6px 6px; }

.post__header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border-light);
}
.post__number { font-weight: 600; color: var(--accent-dark); }
.post__name { color: var(--success); font-weight: 600; }
.post__name--sage { color: var(--text-light); }
.post__mail { color: var(--link); }
.post__date { color: var(--text-light); }
.post__uid { color: var(--text-light); font-size: 0.75rem; }

.post__body { line-height: 1.7; word-wrap: break-word; color: var(--text); }
.post__body a { word-break: break-all; }
.post__body .quote { color: #789922; }
.post__body .anchor { color: var(--link); }

.form {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}
.form__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent-dark);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}
.form__group { margin-bottom: 0.6rem; }
.form__row { display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem; }
.form__label { font-weight: 500; color: var(--text-muted); font-size: 0.85rem; }

.form__input, .form__textarea, .form__select {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form__input:focus, .form__textarea:focus, .form__select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(245,169,98,0.2);
}
.form__textarea { min-height: 90px; resize: vertical; }

.form__submit {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.form__submit:hover { background: var(--accent-dark); }
.form__submit:active { transform: scale(0.98); }
.form__submit:disabled { background: var(--text-light); cursor: not-allowed; }

.form__actions { display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.8rem; }
.form__hint { font-size: 0.7rem; color: var(--text-light); margin-top: 0.2rem; }
.form__error { color: #c0392b; font-size: 0.85rem; margin-top: 0.25rem; }
.form--disabled { opacity: 0.6; }
.form__notice {
  text-align: center;
  padding: 0.75rem;
  background: #fffbf0;
  border: 1px solid #f5d89a;
  border-radius: 4px;
  color: #8a6d3b;
  font-size: 0.9rem;
}
html.dark .form__notice { background: #3a3520; border-color: #665500; color: #ddb; }

.text-center { text-align: center; }
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.hidden { display: none; }

@media screen and (max-width: 768px) {
  html { font-size: 15px; }
  .container { padding: 0.5rem; }
  .form__row { grid-template-columns: 1fr; gap: 0.2rem; }
  .post__header { flex-direction: column; gap: 0.2rem; }
  .nav__list { flex-direction: column; gap: 0.4rem; }
  .header__title { font-size: 1.3rem; }
  .theme-toggle { width: 32px; height: 32px; }
}

@media screen and (max-width: 480px) {
  .form__submit { width: 100%; }
}

@media print {
  body { background: #fff; color: #000; }
  .form, .nav, .footer, .theme-toggle { display: none; }
  a { color: #000; }
  .post { border: 1px solid #ccc; page-break-inside: avoid; }
}
`;

export default css;
