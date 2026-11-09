#!/usr/bin/env python3
"""デザイン案B（モーション強化版）の下層ページを b/ 配下に生成する。

    python3 scripts/build_proposal_b.py

本番（案A）の下層ページをそのまま読み込み、次の変換をかけて b/ に同じ構成で書き出す。
本番のファイルは一切書き換えない。案A側を更新したら（build_works.py / build_pages.py の後に）
このスクリプトを再実行すれば、案Bにも同じ内容が反映される。

  - 画像・CSS・JSなどのリソースは本番と同じファイルを参照する（相対パスを1階層ぶん補正）
  - ページ間リンクは案Bのページ同士でつながるように付け替える
      index.html（TOP） → index-b.html（ルート直下の案BのTOP）
      それ以外         → b/<同じパス>
  - ヘッダーのナビを文字が回るホバー用の構造に、フッターを案Bのフッター（巨大ロゴ）に差し替える
  - 案Bの CSS / JS（proposal-b/）と GSAP・Lenis を読み込む
  - ページ上部のヒーローはスクロールで奥に沈む「ステージ」、以降の本文はその上に重なる「シート」で包む

依存: python3 標準ライブラリのみ。
"""
import os
import pathlib
import posixpath
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'b'
ASSET_VER = '20261109-2'

# 対象（ルートからの相対パス）。works/ と members/ の詳細ページは存在するものを全部拾う
STATIC_PAGES = ['design-process.html', 'food-design.html', 'community-space.html', 'work.html',
                'works/index.html', 'members/index.html']

CDN_SCRIPTS = [
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js',
]

SKIP_SCHEMES = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|//|#)', re.I)


def source_pages():
    pages = list(STATIC_PAGES)
    for d in ('works', 'members'):
        for p in sorted((ROOT / d).glob('*/index.html')):
            pages.append(p.relative_to(ROOT).as_posix())
    return [p for p in pages if (ROOT / p).exists()]


def split_url(v):
    """'../a/b.png?v=1#x' → ('../a/b.png', '?v=1#x')"""
    m = re.match(r'([^?#]*)(.*)', v, re.S)
    return m.group(1), m.group(2)


def is_page_path(path):
    """ルート起点のパスがページ（HTML/ディレクトリ）か"""
    return path == '' or path.endswith('/') or path.endswith('.html') or '.' not in posixpath.basename(path)


def make_rewriter(src_rel):
    """src_rel（ルート起点のページパス）用のURL書き換え関数を返す"""
    src_dir = posixpath.dirname(src_rel)            # 例 'works/sushiro'
    out_dir = posixpath.join('b', src_dir) if src_dir else 'b'

    def rel(target):
        r = posixpath.relpath(target or '.', out_dir)
        return r if r.startswith('.') else './' + r

    def rewrite(value, page_link):
        if not value or SKIP_SCHEMES.match(value):
            return value
        path, rest = split_url(value)
        if path == '':
            return value  # '?id=' のような同一ページ
        trailing = path.endswith('/') or path in ('.', '..') or path.endswith('/.') or path.endswith('/..')
        resolved = posixpath.normpath(posixpath.join(src_dir, path))
        if resolved == '.':
            resolved = ''
        if resolved.startswith('..'):
            return value  # サイトの外。触らない
        if page_link and is_page_path(resolved + ('/' if trailing else '')):
            if resolved in ('', 'index.html'):
                target = 'index-b.html'
            else:
                target = posixpath.join('b', resolved)
            out = rel(target)
            if trailing and not out.endswith('/'):
                out += '/'
            return out + rest
        out = rel(resolved)
        if trailing and not out.endswith('/'):
            out += '/'
        return out + rest

    return rewrite, rel


TAG_RE = re.compile(r'<(a|link|img|script|source|iframe|video|audio)\b[^>]*>', re.I)
ATTR_RE = re.compile(r'\b(href|src|poster)="([^"]*)"')
STYLE_URL_RE = re.compile(r'url\((["\']?)([^)"\']+)\1\)')


def rewrite_urls(html, rewrite):
    def tag_sub(m):
        tag = m.group(0)
        name = m.group(1).lower()
        return ATTR_RE.sub(lambda a: f'{a.group(1)}="{rewrite(a.group(2), name == "a" and a.group(1) == "href")}"', tag)

    html = TAG_RE.sub(tag_sub, html)
    # style="...url(...)..." のインライン指定
    html = re.sub(r'style="([^"]*)"',
                  lambda m: 'style="' + STYLE_URL_RE.sub(lambda u: f'url({u.group(1)}{rewrite(u.group(2), False)}{u.group(1)})', m.group(1)) + '"',
                  html)
    return html


def roll(label):
    return f'<span class="pb-roll"><span>{label}</span></span>'


def transform_header(html):
    def nav_sub(m):
        block = m.group(0)
        block = re.sub(r'(<a (?![^>]*class="nav-contact")[^>]*>)([^<]+)(</a>)',
                       lambda a: a.group(1) + roll(a.group(2)) + a.group(3), block)
        return block
    html = re.sub(r'<nav class="site-nav".*?</nav>', nav_sub, html, flags=re.S)
    html = re.sub(r'(<a class="header-contact"[^>]*>)([^<]+)(</a>)',
                  lambda a: a.group(1) + roll(a.group(2)) + a.group(3), html)
    return html


def transform_footer(html, rel):
    for a, b in [('fig-footer-main', 'pb-footer-main'), ('fig-footer-left', 'pb-footer-left'),
                 ('fig-footer-logo', 'pb-footer-logo'), ('fig-footer-addr', 'pb-footer-addr'),
                 ('fig-footer-nav', 'pb-footer-nav'), ('class="fig-footer"', 'class="pb-footer"')]:
        html = html.replace(a, b)
    html = html.replace('class="fig-footer-contact"', 'class="pb-footer-contact" data-magnet')
    html = re.sub(
        r'<div class="fig-footer-bottom">\s*<p>(.*?)</p>\s*</div>',
        lambda m: ('<div class="pb-footer-mark" aria-hidden="true"></div>\n'
                   '    <div class="pb-footer-bottom">\n'
                   f'      <p>{m.group(1)}</p>\n'
                   '      <a class="pb-totop" href="#" data-magnet aria-label="ページの先頭へ">↑</a>\n'
                   '    </div>'),
        html, flags=re.S)
    return html


def wrap_stage(html):
    """<main> 直下の先頭ヒーロー（.page-hero）をステージに、残りをシートに包む"""
    m = re.search(r'(<main>\s*)(<section class="page-hero">.*?</section>)(.*?)(\s*</main>)', html, re.S)
    if not m:
        # 詳細ページ（.wd）や work.html は本文全体をシートに（ヒーローは記事内に残す）
        return re.sub(r'<main>(.*?)</main>', r'<main><div class="pb-sheet pb-sheet--flat">\1</div></main>', html, flags=re.S)
    return (html[:m.start()] + m.group(1)
            + '<div class="pb-hero-stage pb-hero-stage--sub">\n    ' + m.group(2) + '\n    </div>\n'
            + '    <div class="pb-sheet">' + m.group(3) + '\n    </div>' + m.group(4)
            + html[m.end():])


def transform_head(html, rel):
    css = (f'  <link rel="stylesheet" href="{rel("proposal-b/pb.css")}?v={ASSET_VER}" />\n'
           f'  <link rel="stylesheet" href="{rel("proposal-b/pb-sub.css")}?v={ASSET_VER}" />\n'
           '  <script>document.documentElement.classList.add("pb-js");</script>\n')
    html = html.replace('</head>', css + '</head>', 1)
    html = re.sub(r'<title>(.*?)</title>', r'<title>\1（デザイン案B）</title>', html, count=1)
    return html


def transform_body(html, rel):
    html = re.sub(r'<body class="([^"]*)">', r'<body class="\1 pb pb-sub">', html, count=1)
    chrome = ('\n  <!-- ページ遷移の幕（入ってきた時は上に抜け、リンクを押すと下からかぶさる） -->\n'
              '  <div class="pb-curtain is-cover" aria-hidden="true"><span class="pb-curtain-mark"></span></div>\n'
              '  <div class="pb-cursor" aria-hidden="true"><span class="pb-cursor-label"></span></div>\n'
              '  <div class="pb-progress" aria-hidden="true"><i></i></div>\n')
    html = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + chrome, html, count=1)
    # site.js の直後で事例リンクの行き先を案Bへ。そのあとモーション
    links = f'  <script src="{rel("proposal-b/pb-links.js")}?v={ASSET_VER}" data-broot="{rel("b")}/"></script>\n'
    html = re.sub(r'(<script src="[^"]*site\.js[^"]*"></script>\n)', lambda m: m.group(1) + links, html, count=1)
    tail = ''.join(f'  <script src="{u}"></script>\n' for u in CDN_SCRIPTS)
    tail += f'  <script src="{rel("proposal-b/pb-core.js")}?v={ASSET_VER}"></script>\n'
    tail += f'  <script src="{rel("proposal-b/pb-sub.js")}?v={ASSET_VER}"></script>\n'
    html = html.replace('</body>', tail + '</body>', 1)
    return html


def build_page(src_rel):
    html = (ROOT / src_rel).read_text(encoding='utf-8')
    rewrite, rel = make_rewriter(src_rel)
    html = rewrite_urls(html, rewrite)
    if src_rel == 'work.html':
        # 旧URL互換リダイレクトのインラインスクリプト（データは本番の data/ を読む）
        html = html.replace("fetch('./data/works-fallback.json')", "fetch('../data/works-fallback.json')")
    html = transform_header(html)
    html = transform_footer(html, rel)
    html = wrap_stage(html)
    html = transform_head(html, rel)
    html = transform_body(html, rel)
    banner = ('<!-- ▼ デザイン案B: scripts/build_proposal_b.py が本番ページ（'
              f'{src_rel}）から生成。手で編集しないこと -->\n')
    html = html.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + banner, 1)
    out = OUT / src_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    return out


A_MEMBERS_RE = re.compile(r'<ul class="members-list">\n(.*?)\n\s*</ul>', re.S)
B_MEMBERS_RE = re.compile(r'(<ul class="pb-members-list">\n).*?(\n\s*</ul>)', re.S)


def sync_index_b_members():
    """案BのTOP（index-b.html）のMEMBERS一覧を、本番TOP（index.html）の一覧から作り直す。
    本番側は scripts/build_pages.py が microCMS／data/members.json から生成している。
    パスはどちらもルート直下なので、クラス名を pb- 付きに、リンク先を b/ 配下に替えるだけ"""
    src = A_MEMBERS_RE.search((ROOT / 'index.html').read_text(encoding='utf-8'))
    if not src:
        raise SystemExit('index.html: MEMBERS の一覧が見つかりません')
    items = src.group(1)
    items = re.sub(  # class 属性の member / member-* を全部 pb- 付きに（member-name--l なども）
        r'class="([^"]*)"',
        lambda m: 'class="' + re.sub(r'(?<![\w-])(member[\w-]*)', r'pb-\1', m.group(1)) + '"',
        items)
    items = items.replace('href="./members/', 'href="./b/members/')
    items = '\n'.join('    ' + line for line in items.split('\n'))  # index-b は4つ深い
    path = ROOT / 'index-b.html'
    html, n = B_MEMBERS_RE.subn(lambda m: m.group(1) + items + m.group(2), path.read_text(encoding='utf-8'), count=1)
    if n != 1:
        raise SystemExit('index-b.html: MEMBERS の一覧が見つかりません')
    path.write_text(html, encoding='utf-8')


def remove_stale_pages(pages):
    """本番側で消えた事例・メンバーの詳細ページを b/ からも消す"""
    keep = {posixpath.dirname(p) for p in pages}
    for d in ('works', 'members'):
        for child in sorted((OUT / d).glob('*/index.html')):
            rel = child.parent.relative_to(OUT).as_posix()
            if rel not in keep:
                child.unlink()
                child.parent.rmdir()
                print(f'removed b/{rel}/')


def main():
    pages = source_pages()
    for p in pages:
        build_page(p)
    remove_stale_pages(pages)
    sync_index_b_members()
    # b/ 直下に来た人は案BのTOPへ
    (OUT / 'index.html').write_text(
        '<!DOCTYPE html>\n<meta charset="UTF-8" />\n<meta name="robots" content="noindex" />\n'
        '<meta http-equiv="refresh" content="0; url=../index-b.html" />\n'
        '<link rel="canonical" href="../index-b.html" />\n'
        '<a href="../index-b.html">デザイン案BのTOPへ</a>\n', encoding='utf-8')
    print(f'b/ に {len(pages)} ページを生成しました')


if __name__ == '__main__':
    main()
