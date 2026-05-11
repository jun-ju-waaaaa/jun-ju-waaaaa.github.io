/* =============================================
   0-TOOLs 共通JS
   ============================================= */

(function () {
  'use strict';

  /* ---- テーマ初期化 ---- */
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const isDark = current === 'dark' ||
      (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    const isDark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isDark ? 'ライトモードに切替' : 'ダークモードに切替');
  }

  /* ---- ヘッダー注入 ---- */
  function injectHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML = `
      <div class="site-header__inner">
        <a class="site-header__logo" href="/">0-TOOLs</a>
        <div class="site-header__actions">
          <button class="btn-theme" id="btn-theme" aria-label="ダークモードに切替">🌙</button>
        </div>
      </div>`;
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    updateThemeIcon();
  }

  /* ---- フッター注入 ---- */
  function injectFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <nav class="site-footer__links">
        <a href="/">ツール一覧</a>
        <a href="/blog/">ブログ</a>
        <a href="/sitemap/">サイトマップ</a>
        <a href="/guide/">使い方</a>
        <a href="/faq/">FAQ</a>
        <a href="/about/">運営者情報</a>
        <a href="/contact/">お問い合わせ</a>
        <a href="/privacy/">プライバシーポリシー・免責事項</a>
      </nav>
      <p>© 2026 0-TOOLs — 無料オンラインツール集</p>`;
  }

  /* ---- トースト通知 ---- */
  let toastTimer;
  function showToast(msg) {
    let toast = document.getElementById('_toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '_toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* ---- クリップボードコピー ---- */
  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast('コピーしました ✓'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('コピーしました ✓');
    }
  }

  /* ---- FAQ アコーディオン ---- */
  function initFaq() {
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        item.classList.toggle('open');
      });
    });
  }

  /* ---- タブ切替 ---- */
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(tabGroup => {
      tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const panels = document.querySelectorAll('.tab-panel');
          panels.forEach(p => {
            p.classList.toggle('active', p.dataset.panel === target);
          });
        });
      });
    });
  }

  /* ---- 初期化 ---- */
  document.addEventListener('DOMContentLoaded', () => {
    injectHeader();
    injectFooter();
    initFaq();
    initTabs();
  });

  /* ---- グローバル公開 ---- */
  window.ZeroTools = { copyText, showToast };
})();
