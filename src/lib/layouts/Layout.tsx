import { html, raw } from 'hono/html';
import { config } from '$config';
import { css } from './styles';

const darkModeScript = `
(function(){
  var t=localStorage.getItem('theme');
  if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');
})();
function toggleTheme(){
  var d=document.documentElement,k=d.classList.toggle('dark');
  localStorage.setItem('theme',k?'dark':'light');
}
`;

interface LayoutProps {
  title?: string;
  siteName?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  children?: unknown;
  csrfToken?: string;
}

export const Layout = (props: LayoutProps) => {
  const { title, siteName = true, showHeader = true, showFooter = true, children } = props;
  const fullTitle = siteName ? `${title} - ${config.app.name}` : title;

  return html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${fullTitle}</title>
  <style>${raw(css)}</style>
  <script>${raw(darkModeScript)}</script>
</head>
<body>
  ${showHeader ? html`
  <header class="header">
    <div class="header__inner">
      <div class="header__brand">
        <h1 class="header__title"><a href="/">${config.app.name}</a></h1>
        <p class="header__subtitle">2ちゃんねる互換掲示板</p>
      </div>
      <button class="theme-toggle" onclick="toggleTheme()" title="テーマ切替" aria-label="Toggle theme">
        <span class="theme-toggle__icon">◐</span>
      </button>
    </div>
  </header>
  ` : ''}
  <main class="main container">${children}</main>
  ${showFooter ? html`
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${config.app.name}</p>
  </footer>
  ` : ''}
</body>
</html>`;
};
