"""サイト共通のヘッダー・フッター（全ページで同じDOM）。

ここがヘッダー・フッターの唯一の定義。
  - scripts/build_works.py   … works/ 配下の生成ページに埋め込む
  - scripts/build_pages.py   … members/ 配下の生成ページに埋め込み、
                               ルート直下の手書きページ（index.html など）の
                               <header class="site-header">〜</header> / <footer class="fig-footer">〜</footer> を差し替える
項目を変えたらこのファイルを直して両スクリプトを実行すること。

root … そのページからサイトルートまでの相対パス（'./' '../' '../../'）
home … TOPページ自身か（TOP内のセクションへは #about のようにページ内リンクにする）
local_contact … 互換のために残している引数（お問い合わせボタンは常に FORM_URL のフォームを開く）
"""


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


EXT_SVG = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
           '<path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z'
           'M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>')

# TOPのセクション（ページ内の並び順）
TOP_SECTIONS = [('ABOUT', 'about'), ('BUSINESS', 'business'), ('WORKs', 'works'),
                ('MEMBERS', 'members'), ('COMPANY', 'company'), ('CONTACT', 'contact')]
# 事業ページ（TOPのBUSINESSカードの遷移先）
BUSINESS_PAGES = [('DESIGN CONSULTING', 'design-process.html'),
                  ('FOOD DESIGN', 'food-design.html'),
                  ('COMMUNITY &amp; SPACE', 'community-space.html')]
# お問い合わせフォーム（Googleフォーム）。ヘッダー・フッターのお問い合わせボタンと各ページのCONTACTの「フォームを開く」が開く
FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfQqacpC72r6vnPzKaDqO1YykVR9tFByFLP3DEmhj-1xs5h5Q/viewform'
FORM_ATTRS = f'href="{FORM_URL}" target="_blank" rel="noopener noreferrer"'
EXTERNAL_LINKS = [('K,D,C,,,', 'https://kdc-foodlab.com/'),
                  ('休日コーラ', 'https://lab.studioholiday.jp/'),
                  ('Newsletter', 'https://substack.studioholiday.jp/')]


def _top(root, home, anchor=''):
    if home:
        return f'#{anchor}' if anchor else '#'
    return f'{root}index.html' + (f'#{anchor}' if anchor else '')


def header_html(root, home=False, local_contact=False):
    """ヘッダー: 白い角丸ピル（ロゴ + ナビ）と右端のライムのお問い合わせ（Figma Frame 46）。
    ナビは一覧ページがあるものは一覧へ、それ以外はTOPの各セクションへ"""
    nav = [
        ('TOP', _top(root, home)),
        ('ABOUT', _top(root, home, 'about')),
        ('BUSINESS', _top(root, home, 'business')),
        ('WORKs', f'{root}works/'),
        ('MEMBERS', f'{root}members/'),
        ('COMPANY', _top(root, home, 'company')),
    ]
    links = '\n'.join(f'        <a href="{href}">{label}</a>' for label, href in nav)
    return f'''  <header class="site-header">
    <div class="header-pill">
      <a class="brand" href="{_top(root, home)}">
        <span class="brand-logo"><img src="{root}assets/header-logo.png" alt="" aria-hidden="true" /></span>
        <span>STUDIO&nbsp;HOLIDAY</span>
      </a>
      <button class="nav-toggle" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="siteNav">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav" id="siteNav">
{links}
        <a class="nav-contact" {FORM_ATTRS}>お問い合わせ</a><!-- スマホのメニュー内のみ表示 -->
      </nav>
    </div>
    <a class="header-contact" {FORM_ATTRS}>お問い合わせ</a>
  </header>'''


def footer_html(root, works, home=False, dynamic_works=False, local_contact=False):
    """フッター: 会社情報 + サイトマップ（TOP / BUSINESS / WORKs / MEMBERS / 外部サイト）。
    works は先頭5件をビルド時に確定する。dynamic_works=True のページは site.js が
    microCMS の最新で差し替える（data-footer-works）"""
    top_links = '\n'.join(f'            <a href="{_top(root, home, a)}">{label}</a>' for label, a in TOP_SECTIONS)
    biz_links = '\n'.join(f'            <a href="{root}{href}">{label}</a>' for label, href in BUSINESS_PAGES)
    work_links = '\n'.join(f'            <a href="{root}works/{esc(w["slug"])}/">{esc(w["title"])}</a>'
                           for w in works[:5])
    ext_links = '\n'.join(f'          <a class="fnav-ext" href="{href}" target="_blank" rel="noopener">{label}{EXT_SVG}</a>'
                          for label, href in EXTERNAL_LINKS)
    works_attr = ' data-footer-works' if dynamic_works else ''
    return f'''  <footer class="fig-footer">
    <div class="fig-footer-main">
      <div class="fig-footer-left">
        <img class="fig-footer-logo" src="{root}assets/footer-logo.png" alt="STUDIO HOLIDAY" />
        <div class="fig-footer-addr">
          <p>株式会社スタジオホリデイ</p>
          <p>〒169-0073 東京都新宿区百人町1丁目10−15　JR新大久保駅ビル4F K,D,C,,,</p>
          <a class="fig-footer-contact" {FORM_ATTRS}>CONTACT</a>
        </div>
      </div>
      <nav class="fig-footer-nav">
        <div class="fnav-col">
          <a class="fnav-head" href="{_top(root, home)}">TOP</a>
          <div class="fnav-sub">
{top_links}
          </div>
        </div>
        <div class="fnav-col">
          <a class="fnav-head" href="{_top(root, home, 'business')}">BUSINESS</a>
          <div class="fnav-sub">
{biz_links}
          </div>
        </div>
        <div class="fnav-col">
          <a class="fnav-head" href="{root}works/">WORKs</a>
          <div class="fnav-sub"{works_attr}><!-- 先頭5件の事例ページ -->
{work_links}
          </div>
        </div>
        <div class="fnav-col">
          <a class="fnav-head" href="{root}members/">MEMBERS</a>
        </div>
        <div class="fnav-col">
{ext_links}
        </div>
      </nav>
    </div>
    <div class="fig-footer-bottom">
      <p>© STUDIO HOLIDAY ALL RIGHTS RESERVED</p>
    </div>
  </footer>'''
