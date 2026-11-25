#!/usr/bin/env python3
"""本番公開用のファイル一式を _site/ に作る（案Bを正式版のURLで並べ直す）。

    python3 scripts/build_site.py                      # 本番（https://studioholiday.jp）
    python3 scripts/build_site.py --apache             # 同上＋エックスサーバーに置くための .htaccess
    python3 scripts/build_site.py --base-url https://iwai-ddndn.github.io/studio-holiday-web-prototype --noindex
                                                       # 切り替え前のリハーサル（検索除けを付けたまま）

リポジトリの中では、案BのTOPは index-b.html、下層は b/ にある（確認用サイトと同じ構成）。
このスクリプトは、それを書き換えずに読み込み、公開用の名前で _site/ に書き出す。

    index-b.html         → index.html
    b/works/<slug>/      → works/<slug>/
    b/members/<slug>/    → members/<slug>/
    b/design-process.html などの下層ページ → ルート直下

あわせて、本番に必要な次の調整をかける。
  - ページ内のリンク・画像・CSS・JSのパスを、新しい置き場所に合わせて付け替える
  - 検索除け（noindex）を外す（--noindex を付けた時は残す）
  - タイトルの「（デザイン案B）」を外す
  - OGPのURLを --base-url に替え、全ページに canonical を入れる
  - TOPに description・OGP・ファビコンを入れる
  - robots.txt / sitemap.xml / 404.html を作る
  - まだ公開しないページ（HIDDEN_PAGES）を外し、そこへのリンクも外す

案A（index.html ほかルート直下のページ、works/、members/）は _site/ に入れないので公開されない。
先に build_works.py → build_pages.py → build_proposal_b.py を実行しておくこと。

依存: python3 標準ライブラリのみ。
"""
import argparse
import datetime
import pathlib
import posixpath
import re
import shutil
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
B = ROOT / 'b'

OLD_BASE = 'https://iwai-ddndn.github.io/studio-holiday-web-prototype'
DEFAULT_BASE = 'https://studioholiday.jp'

# そのまま写すもの（案Aと案Bで共用しているCSS/JS・素材・データ）
COPY_FILES = ['styles.css', 'site.js', 'main.js', 'cms-config.js', '.nojekyll']
COPY_DIRS = ['assets', 'data', 'proposal-b']

# まだ公開しないページ（公開時のパス）。_site/ に書き出さず、フッターなどからのリンクも外す。
# リポジトリと確認用サイト（index-b.html / b/）には残るので、そちらで直して確認できる。
# 公開する時は、ここから消して作り直すだけでよい（リンクも元に戻る）。
HIDDEN_PAGES = [
    'design-process.html',    # 事業ページ: DESIGN CONSULTING
    'food-design.html',       # 事業ページ: FOOD DESIGN
    'community-space.html',   # 事業ページ: COMMUNITY & SPACE
]

# TOPのページタイトルと紹介文（検索結果・SNSのシェアに出る）。2026-11-25 に確定した文面
TOP_TITLE = 'STUDIO HOLIDAY | スタジオホリデイ'
TOP_DESCRIPTION = ('『なんかこんなんやりたい“をカタチに』を合言葉に活動するデザインチーム。'
                   '企画や設計はもちろん、実装・定着まで運び切ることを領域にしています。'
                   'ブランド、サービス設計、UX体験領域の“やりたい“を、デザインのチカラでかなえます。')
TOP_OG_IMAGE = 'assets/business-hero/design-consulting.jpg'   # 仮。SNSシェア用の画像（1200×630）ができたら差し替える
FAVICON = 'assets/fv-logo.svg'                                # 仮。ファビコン用の画像ができたら差し替える

SKIP_SCHEMES = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|//|#)', re.I)
TAG_RE = re.compile(r'<(a|link|img|script|source|iframe|video|audio)\b[^>]*>', re.I)
ATTR_RE = re.compile(r'\b(href|src|poster|data-broot)="([^"]*)"')
STYLE_URL_RE = re.compile(r'url\((["\']?)([^)"\']+)\1\)')
NOINDEX_RE = re.compile(r'[ \t]*<meta name="robots" content="noindex" />(?:<!--.*?-->)?\n')


def source_pages():
    """(リポジトリ内のパス, 公開時のパス) の一覧"""
    pages = [('index-b.html', 'index.html')]
    for p in sorted(B.rglob('*.html')):
        rel = p.relative_to(B).as_posix()
        if rel == 'index.html':   # b/ 直下に来た人をTOPへ送るだけのページ。公開時は b/ が無いので不要
            continue
        if rel in HIDDEN_PAGES:
            continue
        pages.append((f'b/{rel}', rel))
    return pages


def unlink_hidden(html, out_rel):
    """まだ公開しないページ（HIDDEN_PAGES）へのリンクを外す。
    リンクだけが並ぶ行（フッターのサイトマップ）は行ごと消し、空になった入れ物も消す。
    文中のリンクは文字だけ残す"""
    out_dir = posixpath.dirname(out_rel)

    def hidden(href):
        if SKIP_SCHEMES.match(href):
            return False
        path = re.match(r'[^?#]*', href).group(0)
        return posixpath.normpath(posixpath.join(out_dir, path)) in HIDDEN_PAGES

    html = re.sub(r'^[ \t]*<a href="([^"]*)">[^<]*</a>\n',
                  lambda m: '' if hidden(m.group(1)) else m.group(0), html, flags=re.M)
    html = re.sub(r'[ \t]*<div class="fnav-sub">\s*</div>\n', '', html)
    html = re.sub(r'<a\b[^>]*\bhref="([^"]*)"[^>]*>(.*?)</a>',
                  lambda m: m.group(2) if hidden(m.group(1)) else m.group(0), html, flags=re.S)
    return html


def map_path(path):
    """リポジトリ内のパス → 公開時のパス（'' はサイトのルート＝TOP）"""
    if path in ('', 'index-b.html', 'index.html', 'b', 'b/index.html'):
        return ''
    if path.startswith('b/'):
        return path[2:]
    return path


def make_rewriter(src_rel, out_rel):
    src_dir = posixpath.dirname(src_rel)
    out_dir = posixpath.dirname(out_rel)

    def rewrite(value):
        if not value or SKIP_SCHEMES.match(value):
            return value
        m = re.match(r'([^?#]*)(.*)', value, re.S)
        path, rest = m.group(1), m.group(2)
        if path == '':
            return value
        trailing = path.endswith('/') or path in ('.', '..') or path.endswith('/.') or path.endswith('/..')
        resolved = posixpath.normpath(posixpath.join(src_dir, path))
        if resolved == '.':
            resolved = ''
        if resolved.startswith('..'):
            return value   # サイトの外。触らない
        target = map_path(resolved)
        out = posixpath.relpath(target or '.', out_dir or '.')
        if not out.startswith('.'):
            out = './' + out
        if (trailing or target == '') and not out.endswith('/'):
            out += '/'
        return out + rest

    return rewrite


def rewrite_urls(html, rewrite):
    html = TAG_RE.sub(lambda t: ATTR_RE.sub(lambda a: f'{a.group(1)}="{rewrite(a.group(2))}"', t.group(0)), html)
    html = re.sub(r'style="([^"]*)"',
                  lambda m: 'style="' + STYLE_URL_RE.sub(
                      lambda u: f'url({u.group(1)}{rewrite(u.group(2))}{u.group(1)})', m.group(1)) + '"',
                  html)
    return html


def replace_exact(text, old, new, name, count=1):
    """決まった箇所の置き換え。元の書き方が変わっていたら黙って素通りせずに止める"""
    if text.count(old) != count:
        raise SystemExit(f'{name}: 置き換え対象が {text.count(old)} 箇所あります（想定 {count}）: {old!r}')
    return text.replace(old, new)


def page_url(base, out_rel):
    if out_rel == 'index.html':
        return base + '/'
    if out_rel.endswith('/index.html'):
        return f'{base}/{out_rel[:-len("index.html")]}'
    return f'{base}/{out_rel}'


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def build_page(src_rel, out_rel, base, noindex):
    html = (ROOT / src_rel).read_text(encoding='utf-8')
    html = rewrite_urls(html, make_rewriter(src_rel, out_rel))
    html = unlink_hidden(html, out_rel)
    html = re.sub(r'<!-- ▼ デザイン案B: scripts/build_proposal_b\.py が[^\n]*-->\n', '', html, count=1)
    html = html.replace('（デザイン案B）</title>', '</title>')
    # 案BのTOPの冒頭にある、案A／案Bの関係を説明する開発用コメント
    html = re.sub(r'[ \t]*<!-- ▼ デザイン案B（モーション強化版）.*?-->\n', '', html, count=1, flags=re.S)
    html = html.replace(OLD_BASE, base)
    if not noindex:
        html = NOINDEX_RE.sub('', html)
    if out_rel == 'work.html':
        # 旧URL（work.html?id=…）を事例ページへ送るインラインスクリプトのデータの場所
        html = replace_exact(html, "fetch('../data/works-fallback.json')", "fetch('./data/works-fallback.json')", out_rel)

    url = page_url(base, out_rel)
    root = posixpath.relpath('.', posixpath.dirname(out_rel) or '.')
    root = './' if root == '.' else root + '/'
    extra = [f'  <link rel="canonical" href="{url}" />',
             f'  <link rel="icon" href="{root}{FAVICON}" type="image/svg+xml" />']
    if out_rel == 'index.html':
        title = esc(TOP_TITLE)
        html, n = re.subn(r'<title>.*?</title>', lambda m: f'<title>{title}</title>', html, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f'{src_rel}: <title> が見つかりません')
        extra += [f'  <meta name="description" content="{esc(TOP_DESCRIPTION)}" />',
                  f'  <meta property="og:title" content="{title}" />',
                  '  <meta property="og:type" content="website" />',
                  f'  <meta property="og:description" content="{esc(TOP_DESCRIPTION)}" />',
                  f'  <meta property="og:url" content="{url}" />',
                  f'  <meta property="og:image" content="{base}/{TOP_OG_IMAGE}" />']
    if 'og:site_name' not in html:
        extra.append('  <meta property="og:site_name" content="STUDIO HOLIDAY" />')
    if 'twitter:card' not in html:
        extra.append('  <meta name="twitter:card" content="summary_large_image" />')
    html, n = re.subn(r'(</title>\n)', lambda m: m.group(1) + '\n'.join(extra) + '\n', html, count=1)
    if n != 1:
        raise SystemExit(f'{src_rel}: <title> が見つかりません')

    out = OUT / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')


def copy_assets():
    for f in COPY_FILES:
        shutil.copy2(ROOT / f, OUT / f)
    for d in COPY_DIRS:
        shutil.copytree(ROOT / d, OUT / d, ignore=shutil.ignore_patterns('.DS_Store'))


def patch_scripts():
    """公開時は b/ が無いので、JSがリンクを組み立てる時の行き先も合わせる"""
    p = OUT / 'proposal-b' / 'pb-links.js'
    p.write_text(replace_exact(p.read_text(encoding='utf-8'),
                               "new URL('index-b.html', SITE_ROOT)", "new URL('./', SITE_ROOT)",
                               'proposal-b/pb-links.js'), encoding='utf-8')
    p = OUT / 'site.js'
    p.write_text(replace_exact(p.read_text(encoding='utf-8'),
                               'href="${root}b/members/', 'href="${root}members/', 'site.js'), encoding='utf-8')


def write_extras(pages, base, noindex):
    today = datetime.date.today().isoformat()
    if noindex:
        robots = 'User-agent: *\nDisallow: /\n'
    else:
        robots = f'User-agent: *\nAllow: /\n\nSitemap: {base}/sitemap.xml\n'
    (OUT / 'robots.txt').write_text(robots, encoding='utf-8')

    urls = [page_url(base, out) for _src, out in pages if out != 'work.html']
    body = '\n'.join(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>' for u in urls)
    (OUT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '\n</urlset>\n', encoding='utf-8')

    # 404はどの階層のURLでも出るので、パスはサイトのルートからの絶対パスで書く
    prefix = urlparse(base).path.rstrip('/')
    (OUT / '404.html').write_text(f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>ページが見つかりません | STUDIO HOLIDAY</title>
  <link rel="icon" href="{prefix}/{FAVICON}" type="image/svg+xml" />
  <style>
    body {{ margin: 0; min-height: 100vh; display: grid; place-items: center; background: #d7f205; color: #111;
           font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif; text-align: center; }}
    main {{ padding: 48px 24px; }}
    img {{ width: min(240px, 60vw); height: auto; }}
    h1 {{ margin: 40px 0 12px; font-size: 22px; }}
    p {{ margin: 0 0 32px; font-size: 15px; line-height: 1.8; }}
    a {{ display: inline-block; padding: 14px 32px; border-radius: 999px; background: #111; color: #fff;
        font-weight: 700; text-decoration: none; }}
    a:hover, a:focus-visible {{ background: #333; }}
  </style>
</head>
<body>
  <main>
    <img src="{prefix}/assets/fv-logo.svg" alt="STUDIO HOLIDAY" />
    <h1>ページが見つかりません</h1>
    <p>お探しのページは、移動したか、公開が終了した可能性があります。</p>
    <a href="{prefix}/">TOPへ戻る</a>
  </main>
</body>
</html>
''', encoding='utf-8')


def write_htaccess(base):
    """Apache（エックスサーバー）に置く時の .htaccess。
    サブドメインのフォルダが同じ public_html の中にあり、この設定はそこにも効くので、
    転送は「このサイトのホスト名で来た時だけ」に限っている"""
    host = urlparse(base).netloc
    bare = host[4:] if host.startswith('www.') else host
    pattern = bare.replace('.', r'\.')
    (OUT / '.htaccess').write_text(f'''# STUDIO HOLIDAY 新サイト用（scripts/build_site.py --apache が生成）
DirectoryIndex index.html index.php
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On
# http:// と www 付きを {base}/ へ寄せる（サブドメインには効かせない）
RewriteCond %{{HTTP_HOST}} ^(www\.)?{pattern}$ [NC]
RewriteCond %{{HTTPS}} !=on [OR]
RewriteCond %{{HTTP_HOST}} !^{pattern}$ [NC]
RewriteRule ^ {base}%{{REQUEST_URI}} [R=301,L]
</IfModule>
''', encoding='utf-8')


def check_links(pages):
    """_site/ 内のリンク切れと、案B用の名前の残りを調べる"""
    problems = []
    for _src, out_rel in pages:
        html = (OUT / out_rel).read_text(encoding='utf-8')
        for m in re.finditer(r'\b(?:href|src|poster)="([^"#?]+)[^"]*"', html):
            u = m.group(1)
            if SKIP_SCHEMES.match(u):
                continue
            t = posixpath.normpath(posixpath.join(posixpath.dirname(out_rel), u))
            tp = OUT / t
            if not (tp.is_file() or (tp / 'index.html').is_file()):
                problems.append(f'{out_rel}: リンク切れ {u}')
        if re.search(r'index-b\.html|["\'/]b/(?:works|members)|デザイン案B', html):
            problems.append(f'{out_rel}: 案B用の名前が残っています')
    return problems


def main():
    ap = argparse.ArgumentParser(description='本番公開用のファイル一式を _site/ に作る')
    ap.add_argument('--base-url', default=DEFAULT_BASE, help=f'公開先のURL（既定: {DEFAULT_BASE}）')
    ap.add_argument('--apache', action='store_true', help='Apache（エックスサーバー）用の .htaccess も書き出す')
    ap.add_argument('--noindex', action='store_true', help='検索除けを付けたままにする（切り替え前のリハーサル用）')
    args = ap.parse_args()
    base = args.base_url.rstrip('/')

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    copy_assets()
    patch_scripts()
    pages = source_pages()
    for src_rel, out_rel in pages:
        build_page(src_rel, out_rel, base, args.noindex)
    write_extras(pages, base, args.noindex)
    if args.apache:
        write_htaccess(base)

    problems = check_links(pages)
    if problems:
        raise SystemExit('\n'.join(problems[:30]) + f'\n問題が {len(problems)} 件あります')
    mode = '検索除けあり（リハーサル用）' if args.noindex else '検索除けなし（本番用）'
    print(f'_site/ に {len(pages)} ページを書き出しました: {base} / {mode}')


if __name__ == '__main__':
    main()
