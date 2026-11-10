#!/usr/bin/env python3
"""共通ヘッダー・フッターの差し込みと、MEMBERSページの静的生成。

    python3 scripts/build_pages.py

1. ルート直下の手書きページ（ROOT_PAGES）の <header class="site-header">〜</header> と
   <footer class="fig-footer">〜</footer> を scripts/site_chrome.py の定義で差し替える
2. microCMS の members（未作成・取得失敗時は data/members.json）から
     - TOP（index.html）の MEMBERS 帯の一覧（<ul class="members-list">〜</ul>）
     - メンバー一覧 members/index.html
     - メンバー詳細 members/<slug>/index.html（WORK詳細と同じ構成）
   を生成する

フッターの WORKs 欄は scripts/build_works.py と同じ取得規則（microCMS → フォールバック）で確定する。
依存: python3 標準ライブラリのみ。
"""
import html
import json
import pathlib
import re
import shutil
import subprocess
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


def load_local_members():
    return json.loads(MEMBERS_JSON.read_text(encoding='utf-8'))


# 名前ラベルの位置と傾きは見た目の調整用なので、CMSでは入力させず並び順で割り振る
# （data/members.json の並びと同じ周期）
LABEL_CYCLE = [('l', -6.16), ('s', 3.76), ('m', -1.79), ('r', 4.2)]
# 背景色（microCMS のセレクト）。選ぶとイラスト表示（円の中に余白をとって収める）になる
MEMBER_BG = {
    'ライム': '#e9f5b8', 'ブルー': '#cfe7ff', 'ピンク': '#ffe1ec',
    'イエロー': '#fff0c2', 'パープル': '#e6e0ff',
}
SLUG_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def _first(v):
    """microCMS のセレクトは配列で返るので先頭を取る（文字列でも受ける）"""
    if isinstance(v, list):
        return v[0] if v else ''
    return v or ''


def _lines(v):
    """テキストエリア → 空行を除いた行のリスト（配列で来ても受ける）"""
    if isinstance(v, list):
        return [str(s).strip() for s in v if str(s).strip()]
    return [s.strip() for s in str(v or '').splitlines() if s.strip()]


def _bio_lines(v):
    """プロフィール。テキストエリアでもリッチエディタ（HTML）でも段落のリストにする"""
    s = str(v or '')
    if '<' in s:
        s = re.sub(r'<br\s*/?>|</p>|</h\d>|</li>', '\n', s)
        s = html.unescape(re.sub(r'<[^>]+>', '', s))
    return _lines(s)


def fetch_cms_members():
    """microCMS members を取得。未設定・API未作成・失敗時は None（data/members.json へ）"""
    domain, key = build_works.read_cms_config()
    if not domain or not key:
        return None
    url = f'https://{domain}.microcms.io/api/v1/members?limit=100'
    try:
        # build_works.py と同じく curl で取得（urllibはSSL証明書の環境差があるため）
        out = subprocess.run(
            ['curl', '-sfL', '--max-time', '30', '-H', f'X-MICROCMS-API-KEY: {key}', url],
            capture_output=True, text=True, check=True,
        ).stdout
        return json.loads(out).get('contents') or None
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        print('[members] microCMSから取得できません（API未作成・失敗）。data/members.json で生成します')
        return None


def normalize_members(contents):
    """CMSのコンテンツを data/members.json と同じ形に揃える。
    必須項目（slug・name・photo）が欠けたものはページを作れないので飛ばす"""
    members, seen = [], set()
    for c in contents:
        # slug が無ければ microCMS のコンテンツID（編集可能）をURLに使う
        slug = (c.get('slug') or c.get('id') or '').strip()
        name = (c.get('name') or '').strip()
        photo = (c.get('photo') or {}).get('url')
        if not SLUG_RE.match(slug) or not name or not photo or slug in seen:
            print(f'[members] スキップ（slug・名前・写真の不足、またはslug重複）: {c.get("id")} {name}')
            continue
        seen.add(slug)
        label, tilt = LABEL_CYCLE[len(members) % len(LABEL_CYCLE)]
        bg = _first(c.get('bg')).strip()
        bg = MEMBER_BG.get(bg, bg if re.fullmatch(r'#[0-9a-fA-F]{3,8}', bg) else '')
        role = (c.get('role') or '').strip()
        m = {
            'slug': slug,
            'name': name,
            'name_ja': (c.get('name_ja') or '').strip(),
            'role': role,
            'tags': _lines(c.get('tags')) or ([role] if role else []),
            'image': f'{photo}?w=800',
            'tilt': tilt,
            'label': label,
            'bio': _bio_lines(c.get('bio')),
        }
        if bg:
            m['bg'] = bg
        members.append(m)
    return members


def load_members():
    """microCMS のメンバーを先に並べ、data/members.json（サンプル入り）で補う。
    同じ slug の人はCMSを優先。手元データ由来の人には local: True を付け、
    一覧の <li> に data-local を出す（?cms=only ではCSSで隠してCMSの人だけにする）"""
    contents = fetch_cms_members()
    cms = normalize_members(contents) if contents else []
    slugs = {m['slug'] for m in cms}
    local = [dict(m, local=True) for m in load_local_members() if m['slug'] not in slugs]
    return cms + local

# ==========================================================
# ▼ 部品
# ==========================================================

def page_path(src, root):
    return root + src[2:] if src.startswith('./') else src


def member_item_html(m, root, href):
    """丸い写真 + 傾いたライムの名前ラベル（TOPのMEMBERS帯・一覧・詳細の他メンバーで共用）"""
    cls = 'member-photo is-illust' if m.get('sample') or m.get('bg') else 'member-photo'
    style = f' style="--bg:{m["bg"]}"' if m.get('bg') else ''
    return (
        f'<li class="member"{" data-local" if m.get("local") else ""}><a class="member-link" href="{href}">'
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
    cls = 'md-photo is-illust' if m.get('sample') or m.get('bg') else 'md-photo'
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
  <!-- scripts/build_pages.py が microCMS（members）／data/members.json から生成。手で編集しないこと。 -->
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
  <!-- scripts/build_pages.py が microCMS（members）／data/members.json から生成。手で編集しないこと。 -->
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
