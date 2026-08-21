#!/usr/bin/env python3
"""事例（works）の恒久URLページ works/<slug>/index.html を静的生成する。

microCMS の works を取得し（失敗時は data/works-fallback.json）、
work.html?id=… と同じ内容の事例ページを1件ずつHTMLとして書き出す。
OGP・SEO・URL寿命の問題（JS描画のクエリURLはOGPが出ない・IDが変わると切れる）への対応。

GitHub Actions（.github/workflows/works-sync.yml）から日次で実行され、
変更があればコミットされる。ローカルで手動実行してもよい:

    python3 scripts/build_works.py

依存: python3 標準ライブラリのみ（取得は fetch_newsletter.py と同じく curl）。
"""
import json
import pathlib
import re
import shutil
import subprocess
from html.parser import HTMLParser

# 生成ページのOGP用の絶対URLの基点。本番ドメイン確定時に変更すること。
BASE_URL = 'https://iwai-ddndn.github.io/studio-holiday-web-prototype'

ROOT = pathlib.Path(__file__).resolve().parent.parent
FALLBACK_JSON = ROOT / 'data' / 'works-fallback.json'   # site.js の WORKS_FALLBACK と同一内容
SAMPLE_DIR = ROOT / 'data' / 'works-sample'             # body未入稿時の仮原稿（slug.html）
CMS_CONFIG = ROOT / 'cms-config.js'                     # serviceDomain / apiKey をここから読む
WORKS_DIR = ROOT / 'works'
RELATED_COUNT = 4

# ==========================================================
# ▼ データ取得（site.js の fetchCMS / normalizeWorks と同じ規則）
# ==========================================================

def read_cms_config():
    """cms-config.js から serviceDomain と apiKey を読む（キーはハードコードしない）"""
    try:
        src = CMS_CONFIG.read_text(encoding='utf-8')
    except OSError:
        return None, None
    dom = re.search(r"serviceDomain:\s*'([^']*)'", src)
    key = re.search(r"apiKey:\s*'([^']*)'", src)
    return (dom.group(1) if dom else None), (key.group(1) if key else None)


def fetch_cms_works():
    """microCMS works を取得。未設定・失敗時は None（フォールバックへ）"""
    domain, key = read_cms_config()
    if not domain or not key:
        return None
    url = f'https://{domain}.microcms.io/api/v1/works?limit=100'
    try:
        # urllibだと環境によってはSSL証明書が見つからないため、curlで取得する
        out = subprocess.run(
            ['curl', '-sfL', '--max-time', '30', '-H', f'X-MICROCMS-API-KEY: {key}', url],
            capture_output=True, text=True, check=True,
        ).stdout
        contents = json.loads(out).get('contents')
        return contents or None
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        print('[works] microCMSの取得に失敗。フォールバックデータで生成します')
        return None


def load_fallback():
    return json.loads(FALLBACK_JSON.read_text(encoding='utf-8'))


def normalize_works(contents, fallback):
    """CMSのコンテンツを site.js の normalizeWorks と同じ共通形に揃える。
    slug は CMSの slug フィールド > フォールバックのタイトル一致 > コンテンツID の順で解決"""
    local_by_title = {w['title']: w for w in fallback}
    works, seen = [], set()
    for c in contents:
        local = local_by_title.get(c.get('title'))
        slug = c.get('slug') or (local['slug'] if local else c['id'])
        if slug in seen:  # 万一slugが重複したらコンテンツIDで逃がす（ページの上書き防止）
            slug = c['id']
        seen.add(slug)
        sticker = c.get('sticker') or {}
        works.append({
            'id': c['id'],
            'slug': slug,
            'title': c.get('title') or '',
            'kind': c.get('kind') or '',
            'client': c.get('client') or '',
            'description': c.get('description') or '',
            'body': c.get('body') or '',
            'credit': c.get('credit') or (local.get('credit', '') if local else ''),
            # imgix変換で幅を抑えつつPNG化（切り抜きの透過を保持）
            'image': f"{sticker['url']}?w=1000&fm=png" if sticker.get('url') else (local['image'] if local else ''),
        })
    return works


def local_works(fallback):
    return [{**w, 'id': w['slug'], 'body': '', 'credit': w.get('credit', ''), 'client': w.get('client', '')}
            for w in fallback]

# ==========================================================
# ▼ HTML部品（site.js の esc / workCard / workCreditHTML / relatedWorks と同じ規則）
# ==========================================================

def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def page_path(src):
    """サイトルート起点の相対パス（./assets/…）を works/<slug>/ から見た相対パスに直す。
    CMS画像などの絶対URLはそのまま"""
    return '../../' + src[2:] if src.startswith('./') else src


def abs_url(src):
    """OGP用の絶対URL"""
    if not src:
        return ''
    if src.startswith('http'):
        return src
    return BASE_URL + (src[1:] if src.startswith('./') else '/' + src.lstrip('/'))


def rewrite_body_paths(html):
    """本文・仮原稿内のサイトルート起点パス（src="./assets/…" 等）を2階層上に直す"""
    return re.sub(r'((?:src|href)=")\./', r'\g<1>../../', html)


ARROW_SVG = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
             '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>')

EXT_SVG = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
           '<path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z'
           'M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>')


def related_works(work, all_works, n=RELATED_COUNT):
    """関連事例: 同じジャンル > 同じクライアント > 元の並び順（site.js relatedWorks と同じ）"""
    scored = []
    for i, w in enumerate(all_works):
        if w['id'] == work['id']:
            continue
        score = ((2 if w['kind'] and w['kind'] == work['kind'] else 0)
                 + (1 if w['client'] and w['client'] == work['client'] else 0))
        scored.append((score, i, w))
    scored.sort(key=lambda t: (-t[0], t[1]))
    return [w for _, _, w in scored[:n]]


def work_card_html(w):
    """TOPのカードと同じDOM（site.js workCard）。リンクは兄弟ディレクトリの恒久URL"""
    visual = (f'<img src="{esc(page_path(w["image"]))}" alt="" loading="lazy" />' if w['image']
              else '<span class="work-card-noimg" aria-hidden="true">STUDIO HOLIDAY</span>')
    return (
        f'<a class="work-card" href="../{esc(w["slug"])}/">'
        f'<span class="work-card-visual">{visual}</span>'
        '<span class="work-card-body">'
        + (f'<span class="work-card-kind">{esc(w["kind"])}</span>' if w['kind'] else '')
        + f'<span class="work-card-title">{esc(w["title"])}</span>'
        + (f'<span class="work-card-client">{esc(w["client"])}</span>' if w['client'] else '')
        + f'<span class="work-card-arrow" aria-hidden="true">{ARROW_SVG}</span>'
        '</span></a>'
    )


def credit_html(work):
    """クレジット: 「役割: 名前」を1行ずつ（site.js workCreditHTML と同じ・全角コロン可）"""
    rows = [s.strip() for s in (work.get('credit') or '').splitlines() if s.strip()]
    if not rows:
        return ''
    items = []
    for line in rows:
        m = re.match(r'^(.+?)\s*[:：]\s*(.+)$', line)
        items.append(f'<div><dt>{esc(m.group(1))}</dt><dd>{esc(m.group(2))}</dd></div>' if m
                     else f'<div><dt></dt><dd>{esc(line)}</dd></div>')
    return f'<aside class="work-credit"><h2>CREDIT</h2><dl>{"".join(items)}</dl></aside>'


def body_html(work):
    """記事本文: CMSの body > data/works-sample/<slug>.html の仮原稿 > 入稿待ちの注記"""
    if work['body']:
        # CMSのリッチエディタHTMLはそのまま埋め込む（画像はCMSの絶対URL）
        return f'<div class="work-body">{rewrite_body_paths(work["body"])}</div>'
    sample = SAMPLE_DIR / f'{work["slug"]}.html'
    if sample.exists():
        html = re.sub(r'<!--.*?-->', '', sample.read_text(encoding='utf-8'), flags=re.S).strip()
        if html:
            note = ('<p class="work-draft-note">※ レイアウト確認用の仮原稿です。'
                    'microCMSの「本文」に入稿すると差し替わります。（仮）</p>')
            return f'<div class="work-body">{note}{rewrite_body_paths(html)}</div>'
    return ('<p class="work-note">※ 詳細記事の本文はmicroCMSの「本文」入稿待ちです。'
            'ここに事例記事がそのまま入ります。（仮）</p>')

# ==========================================================
# ▼ ページテンプレート（work.html と同じDOM構造・クラス名。リンクは2階層上がる）
# ==========================================================

def render_page(work, all_works):
    title = f'{work["title"]} — WORKs | STUDIO HOLIDAY'
    og_url = f'{BASE_URL}/works/{work["slug"]}/'
    og_image = abs_url(work['image'])
    tags = [t for t in (work['client'], work['kind']) if t]

    hero_img = (f'<img src="{esc(page_path(work["image"]))}" alt="{esc(work["title"])}" />'
                if work['image'] else '')
    tags_html = (f'<ul class="work-tags">{"".join(f"<li>#{esc(t)}</li>" for t in tags)}</ul>'
                 if tags else '')
    lead_html = f'<p class="work-lead">{esc(work["description"])}</p>' if work['description'] else ''
    kind_html = f'<span class="work-kind">{esc(work["kind"])}</span>' if work['kind'] else ''
    cards = '\n      '.join(work_card_html(w) for w in related_works(work, all_works))
    footer_works = '\n            '.join(
        f'<a href="../{esc(w["slug"])}/">{esc(w["title"])}</a>' for w in all_works[:6])

    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" /><!-- 確認用サイトのため検索除け（本番公開時に外す） -->
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(work["description"])}" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:type" content="article" />
  <meta property="og:description" content="{esc(work["description"])}" />
  <meta property="og:url" content="{esc(og_url)}" />
  {f'<meta property="og:image" content="{esc(og_image)}" />' if og_image else ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&amp;family=Noto+Sans+JP:wght@400;600;700;800;900&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../styles.css?v=20260816-4" />
</head>
<body class="work-page">
  <!-- scripts/build_works.py が生成した事例の恒久ページ（work.html?id=… と同内容の静的版）。
       手で編集しないこと。microCMSを更新すると works-sync.yml が再生成する。 -->
  <header class="site-header">
    <div class="header-pill">
      <a class="brand" href="../../index.html">
        <span class="brand-logo"><img src="../../assets/header-logo.png" alt="" aria-hidden="true" /></span>
        <span>STUDIO&nbsp;HOLIDAY</span>
      </a>
      <button class="nav-toggle" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="siteNav">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav" id="siteNav">
        <a href="../../index.html">TOP</a>
        <a href="../../index.html#about">ABOUT</a>
        <a href="../../index.html#business">BUSINESS</a>
        <a href="../../index.html#works">WORKs</a>
        <a href="../../design-process.html">DESIGN PROCESS</a>
        <a class="nav-contact" href="#contact">お問い合わせ</a><!-- スマホのメニュー内のみ表示 -->
      </nav>
    </div>
    <a class="header-contact" href="#contact">お問い合わせ</a>
  </header>

  <main>
    <article class="work-detail">
      <a class="work-back" href="../../index.html#works">← WORKs一覧</a>
      <div class="work-hero">
        <div class="work-hero-visual">{hero_img}</div>
        <div class="work-hero-body">
          {kind_html}
          <h1>{esc(work["title"])}</h1>
          {tags_html}
          {lead_html}
        </div>
      </div>
      {body_html(work)}
      {credit_html(work)}
    </article>

    <!-- 関連する事例（同じジャンル > 同じクライアント > 元順で4件・ビルド時に確定） -->
    <section class="sec-works-other">
      <div class="sec-label"><span>RELATED WORKs</span><i></i><span></span></div>
      <div class="works-grid">
      {cards}
      </div>
    </section>

    <section class="sec-contact" id="contact">
      <div class="sec-label"><span>CONTACT</span><i></i><span></span></div>
      <p class="contact-lead">STUDIO HOLIDAY デザインコンサルティングチームへのお問い合わせ、協業・パートナー連携のご相談は下記フォームからご連絡ください。</p>
      <a class="btn-lime btn-lime--wide" href="#" onclick="return false"><span>フォームを開く</span>{ARROW_SVG}</a><!-- フォームURL未定（仮） -->
    </section>
  </main>

  <footer class="fig-footer">
    <div class="fig-footer-main">
      <div class="fig-footer-left">
        <img class="fig-footer-logo" src="../../assets/footer-logo.png" alt="STUDIO HOLIDAY" />
        <div class="fig-footer-addr">
          <p>株式会社スタジオホリデイ</p>
          <p>〒169-0073 東京都新宿区百人町1丁目10−15　JR新大久保駅ビル4F K,D,C,,,</p>
          <a class="fig-footer-contact" href="#contact">CONTACT</a>
        </div>
      </div>
      <nav class="fig-footer-nav">
        <div class="fnav-col">
          <a class="fnav-head" href="../../index.html">TOP</a>
          <div class="fnav-sub">
            <a href="../../index.html#about">ABOUT</a>
            <a href="../../index.html#business">BUSINESS</a>
            <a href="../../index.html#company">COMPANY</a>
          </div>
        </div>
        <div class="fnav-col">
          <a class="fnav-head" href="../../design-process.html">DESIGN PROCESS</a>
        </div>
        <div class="fnav-col">
          <a class="fnav-head" href="../../index.html#works">WORKs</a>
          <div class="fnav-sub"><!-- ビルド時に確定した各事例ページへのリンク（先頭6件） -->
            {footer_works}
          </div>
        </div>
        <div class="fnav-col">
          <a class="fnav-ext" href="https://kdc-foodlab.com/" target="_blank" rel="noopener">K,D,C,,,{EXT_SVG}</a>
          <a class="fnav-ext" href="https://lab.studioholiday.jp/" target="_blank" rel="noopener">休日コーラ{EXT_SVG}</a>
        </div>
      </nav>
    </div>
    <div class="fig-footer-bottom">
      <p>© STUDIO HOLIDAY ALL RIGHT RESERVED</p>
      <a href="#" onclick="return false">Privacy Policy</a>
      <a href="#" onclick="return false">Security Policy</a>
    </div>
  </footer>

  <!-- 本文・関連事例は静的に埋め込み済み（data-work-detail / data-works-grid /
       data-footer-works は付けない）。site.js はハンバーガーメニューのためだけに読む。 -->
  <script src="../../cms-config.js?v=20260816-4"></script>
  <script src="../../site.js?v=20260816-4"></script>
</body>
</html>
'''

# ==========================================================
# ▼ 生成・古いディレクトリの掃除・検証
# ==========================================================

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
             'link', 'meta', 'param', 'source', 'track', 'wbr'}


class TagChecker(HTMLParser):
    """生成HTMLのタグ対応が壊れていないかの簡易チェック"""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID_TAGS:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f'unexpected </{tag}> (open: {self.stack[-5:]})')
        else:
            self.stack.pop()


def check_html(path, html):
    checker = TagChecker()
    checker.feed(html)
    checker.close()
    errors = checker.errors + [f'unclosed <{t}>' for t in checker.stack]
    if errors:
        raise SystemExit(f'{path}: 生成HTMLのタグ対応が壊れています: {errors}')


def main():
    fallback = load_fallback()
    contents = fetch_cms_works()
    works = normalize_works(contents, fallback) if contents else local_works(fallback)

    slugs = {w['slug'] for w in works}
    WORKS_DIR.mkdir(exist_ok=True)

    # 今回の事例一覧に無い古いディレクトリを削除（誤爆防止のため index.html を持つものだけ）
    for child in sorted(WORKS_DIR.iterdir()):
        if child.is_dir() and (child / 'index.html').exists() and child.name not in slugs:
            shutil.rmtree(child)
            print(f'removed works/{child.name}/')

    for w in works:
        html = render_page(w, works)
        check_html(f'works/{w["slug"]}/index.html', html)
        out = WORKS_DIR / w['slug'] / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding='utf-8')
        print(f'works/{w["slug"]}/index.html\t{w["title"]}')

    source = 'microCMS' if contents else 'works-fallback.json'
    print(f'generated {len(works)} pages from {source}')


if __name__ == '__main__':
    main()
