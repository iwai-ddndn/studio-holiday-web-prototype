#!/usr/bin/env python3
"""共通ヘッダー・フッターの差し込みと、MEMBERSページの静的生成。

    python3 scripts/build_pages.py

1. ルート直下の手書きページ（ROOT_PAGES）の <header class="site-header">〜</header> と
   <footer class="fig-footer">〜</footer> を scripts/site_chrome.py の定義で差し替える
2. data/members.json から
     - TOP（index.html）の MEMBERS 帯の一覧（<ul class="members-list">〜</ul>）
     - メンバー一覧 members/index.html
     - メンバー詳細 members/<slug>/index.html（WORK詳細と同じ構成）
   を生成する

フッターの WORKs 欄は scripts/build_works.py と同じ取得規則（microCMS → フォールバック）で確定する。
依存: python3 標準ライブラリのみ。
"""
import json
import pathlib
import re
import shutil
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from site_chrome import esc, header_html, footer_html  # noqa: E402
import build_works  # noqa: E402  事例データの取得・ページ部品を共用

ROOT = pathlib.Path(__file__).resolve().parent.parent
MEMBERS_JSON = ROOT / 'data' / 'members.json'
MEMBERS_DIR = ROOT / 'members'
# どれもページ内に CONTACT セクション（#contact）を持つ
ROOT_PAGES = ['index.html', 'design-process.html', 'food-design.html', 'community-space.html', 'work.html']
BASE_URL = build_works.BASE_URL
ASSET_VER = build_works.ASSET_VER

# ==========================================================
# ▼ データ
# ==========================================================

def load_works():
    fallback = build_works.load_fallback()
    contents = build_works.fetch_cms_works()
    return build_works.normalize_works(contents, fallback) if contents else build_works.local_works(fallback)


def load_members():
    return json.loads(MEMBERS_JSON.read_text(encoding='utf-8'))

# ==========================================================
# ▼ 部品
# ==========================================================

def page_path(src, root):
    return root + src[2:] if src.startswith('./') else src


def member_item_html(m, root, href):
    """丸い写真 + 傾いたライムの名前ラベル（TOPのMEMBERS帯・一覧・詳細の他メンバーで共用）"""
    cls = 'member-photo is-illust' if m.get('sample') else 'member-photo'
    style = f' style="--bg:{m["bg"]}"' if m.get('bg') else ''
    return (
        f'<li class="member"><a class="member-link" href="{href}">'
        f'<span class="{cls}"{style}><img src="{esc(page_path(m["image"], root))}" alt="" loading="lazy" /></span>'
        f'<span class="member-name member-name--{m.get("label", "m")}" style="--tilt:{m.get("tilt", 0)}deg">{esc(m["name"])}</span>'
        '</a></li>'
    )


def members_list_html(members, root, href_of, indent):
    pad = ' ' * indent
    sample_note = f'{pad}<!-- ▼ sample:true はレイアウト確認用のサンプル（仮）。data/members.json で実メンバーに差し替える -->\n'
    rows, noted = [], False
    for m in members:
        if m.get('sample') and not noted:
            rows.append(sample_note.rstrip('\n'))
            noted = True
        rows.append(pad + member_item_html(m, root, href_of(m)))
    return '\n'.join(rows)


def head_html(title, description, og_url, og_image, root):
    return build_works.head_html(title, description, og_url, og_image, 'website', root)


def scripts_html(root):
    return build_works.scripts_html(root)

# ==========================================================
# ▼ MEMBERS ページ
# ==========================================================

def render_member_page(m, members, works):
    """メンバー詳細（WORK詳細 326:1330 と同じ構成）:
    ライムの帯に丸写真 → 名前・タグ・プロフィール → 他のメンバー"""
    root = '../../'
    title = f'{m["name"]} — MEMBERS | STUDIO HOLIDAY'
    desc = (m.get('bio') or [''])[0]
    cls = 'md-photo is-illust' if m.get('sample') else 'md-photo'
    style = f' style="--bg:{m["bg"]}"' if m.get('bg') else ''
    tags = ''.join(f'<li>#{esc(t)}</li>' for t in m.get('tags', []))
    bio = '\n        '.join(f'<p>{esc(p)}</p>' for p in m.get('bio', []))
    others = [o for o in members if o['slug'] != m['slug']]
    others_html = members_list_html(others, root, lambda o: f'../{o["slug"]}/', 10)
    name_ja = f'<p class="md-name-ja">{esc(m["name_ja"])}</p>' if m.get('name_ja') else ''
    sample = ('<p class="work-draft-note">※ レイアウト確認用のサンプルメンバーです。'
              'data/members.json で実メンバーに差し替えてください。（仮）</p>') if m.get('sample') else ''
    return f'''{head_html(title, desc, f"{BASE_URL}/members/{m['slug']}/", "", root)}
<body class="sub-page member-page">
  <!-- scripts/build_pages.py が data/members.json から生成。手で編集しないこと。 -->
{header_html(root)}

  <main>
    <article class="wd">
      <div class="wd-hero">
        <div class="wd-visual md-visual" style="--tilt:{m.get('tilt', 0)}deg">
          <span class="{cls}"{style}><img src="{esc(page_path(m["image"], root))}" alt="{esc(m["name"])}" /></span>
        </div>
      </div>
      <div class="wd-main">
        <h1>{esc(m["name"])}</h1>
        {name_ja}
        <ul class="wd-tags">{tags}</ul>
        {sample}
        <div class="work-body md-bio">
        {bio}
        </div>
      </div>
    </article>

    <section class="wd-related">
      <h2>Other Members</h2>
      <ul class="members-grid">
{others_html}
      </ul>
      <a class="btn-lime works-all" href="../"><span>メンバー一覧へ</span>{build_works.ARROW_SVG}</a>
    </section>
  </main>

{footer_html(root, works)}

{scripts_html(root)}
</body>
</html>
'''


def render_members_index(members, works):
    """メンバー一覧（Figma 326:1350）: ライムの帯にMEMBERSステッカー → 全員の丸写真"""
    root = '../'
    title = 'MEMBERS | STUDIO HOLIDAY'
    desc = 'STUDIO HOLIDAYのメンバー紹介です。'
    items = members_list_html(members, root, lambda m: f'./{m["slug"]}/', 8)
    return f'''{head_html(title, desc, f"{BASE_URL}/members/", "", root)}
<body class="sub-page members-page">
  <!-- scripts/build_pages.py が data/members.json から生成。手で編集しないこと。 -->
{header_html(root)}

  <main>
    <section class="page-hero">
      <h1 class="sticker-head" style="--w:458px;--tilt:-7.39deg"><img src="{root}assets/headings/members.png" alt="MEMBERS" width="458" height="265" /></h1>
    </section>

    <section class="members-board">
      <ul class="members-grid">
{items}
      </ul>
    </section>
  </main>

{footer_html(root, works)}

{scripts_html(root)}
</body>
</html>
'''

# ==========================================================
# ▼ 手書きページへの差し込み
# ==========================================================

HEADER_RE = re.compile(r'  <header class="site-header">.*?</header>', re.S)
FOOTER_RE = re.compile(r'  <footer class="fig-footer">.*?</footer>', re.S)
TOP_MEMBERS_RE = re.compile(r'(<ul class="members-list">\n).*?(\n\s*</ul>)', re.S)


def replace_once(pattern, repl, text, name, label):
    new, n = pattern.subn(lambda _m: repl, text, count=1)
    if n != 1:
        raise SystemExit(f'{name}: {label} が見つかりません')
    return new


def update_root_pages(members, works):
    for name in ROOT_PAGES:
        path = ROOT / name
        html = path.read_text(encoding='utf-8')
        home = name == 'index.html'
        html = replace_once(HEADER_RE, header_html('./', home, local_contact=True), html, name, 'ヘッダー')
        # 手書きページのWORKs欄は site.js が microCMS の最新で差し替える
        html = replace_once(FOOTER_RE, footer_html('./', works, home, dynamic_works=True, local_contact=True), html, name, 'フッター')
        if home:
            items = members_list_html(members, './', lambda m: f'./members/{m["slug"]}/', 10)
            html, n = TOP_MEMBERS_RE.subn(lambda mm: mm.group(1) + items + mm.group(2), html, count=1)
            if n != 1:
                raise SystemExit('index.html: MEMBERS の一覧が見つかりません')
        build_works.check_html(name, html)
        path.write_text(html, encoding='utf-8')
        print(f'{name}\tヘッダー・フッター更新')


def main():
    members = load_members()
    works = load_works()
    slugs = {m['slug'] for m in members}

    MEMBERS_DIR.mkdir(exist_ok=True)
    for child in sorted(MEMBERS_DIR.iterdir()):  # data から消えたメンバーのページを掃除
        if child.is_dir() and (child / 'index.html').exists() and child.name not in slugs:
            shutil.rmtree(child)
            print(f'removed members/{child.name}/')

    for m in members:
        html = render_member_page(m, members, works)
        build_works.check_html(f'members/{m["slug"]}/index.html', html)
        out = MEMBERS_DIR / m['slug'] / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding='utf-8')
        print(f'members/{m["slug"]}/index.html\t{m["name"]}')

    html = render_members_index(members, works)
    build_works.check_html('members/index.html', html)
    (MEMBERS_DIR / 'index.html').write_text(html, encoding='utf-8')
    print('members/index.html\tMEMBERS一覧')

    update_root_pages(members, works)


if __name__ == '__main__':
    main()
