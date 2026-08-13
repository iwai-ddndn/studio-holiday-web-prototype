/* ===== サイト共通スクリプト =====
 * index.html / design-process.html の両方で読み込む。
 *   - microCMS（works）の取得とキャッシュ（main.js からも window.fetchWorks() で利用）
 *   - フッターのWORKs一覧をCMSの内容で差し替え
 *   - スマホのハンバーガーメニュー
 * cms-config.js が未設定・取得失敗時は、HTMLに書かれた内容のまま表示する。
 */

/* --- microCMS --- */

async function fetchCMS(endpoint) {
  const cfg = window.MICROCMS_CONFIG || {};
  if (!cfg.serviceDomain || !cfg.apiKey) return null; // 未設定なら静かにフォールバック
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000); // CMS障害時もページを待たせない
  try {
    const res = await fetch(
      `https://${cfg.serviceDomain}.microcms.io/api/v1/${endpoint}?limit=100`,
      { headers: { 'X-MICROCMS-API-KEY': cfg.apiKey }, signal: ctl.signal },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).contents;
  } catch (e) {
    console.warn(`[microCMS] ${endpoint} の取得に失敗。フォールバックで表示します:`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* works は FVステッカーとフッターの両方で使うので、リクエストは1回だけにする */
window.fetchWorks = () => (window.__worksPromise ??= fetchCMS('works'));

/* --- フッターのWORKs一覧 --- */

async function initFooterWorks() {
  const box = document.querySelector('[data-footer-works]');
  if (!box) return;
  const works = await window.fetchWorks();
  if (!works || !works.length) return; // 取得できなければHTMLの仮リストのまま
  box.innerHTML = '';
  works.slice(0, 6).forEach((w) => {
    const el = document.createElement('span');
    el.textContent = w.title;
    box.appendChild(el);
  });
}

/* --- スマホのハンバーガーメニュー --- */

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  // メニュー内のリンクを踏んだら閉じる（同一ページ内アンカーでも閉じたい）
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) setOpen(false); // 外側タップで閉じる
  });
}

initFooterWorks();
initMobileNav();
