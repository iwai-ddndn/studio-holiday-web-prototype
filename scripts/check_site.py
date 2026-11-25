#!/usr/bin/env python3
"""生成済みの全ページを microCMS の内容と突き合わせて検査する。

    python3 scripts/check_site.py            # 確認用の構成（index-b.html と b/）を検査
    python3 scripts/check_site.py _site      # 本番公開用の出力（_site/）を検査

検査すること
  - 事例・メンバーの詳細ページが、microCMS のコンテンツと過不足なく1対1で揃っている
  - 各詳細ページの見出し（名前・タイトル）と日本語名が microCMS と一致している
  - ページ内リンク・画像・CSS・JSのリンク切れが無い
  - ハッシュタグの「#」が重なっていない（「##」「#＃」）、空のタグが無い
  - microCMS 以外のデータ（サンプルのメンバー、仮原稿、入稿待ちの注記、手元データ由来の項目）が出ていない

問題があれば一覧を出して終了コード1で終わる。JSが描き直す部分（TOPの事例カードなど）は対象外で、
ブラウザでの確認が別に要る。

依存: python3 標準ライブラリのみ（microCMS の取得は build_works.py と同じく curl）。
"""
import html
import json
import pathlib
import posixpath
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_works  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_SCHEMES = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|//|#)', re.I)

# microCMS 以外のデータが出ている印
FORBIDDEN = [
    (re.compile(r'data-local'), '手元データ由来の項目（data-local）'),
    (re.compile(r'sample-[a-z]+-[a-z]+'), 'サンプルのメンバー'),
    (re.compile(r'入稿待ち|仮原稿|反映待ち|レイアウト確認用'), '仮の注記・仮原稿'),
    (re.compile(r'[#＃]\s*[#＃]'), '「#」が重なったハッシュタグ'),
    (re.compile(r'<li>[#＃]?\s*</li>|<span>[#＃]\s*</span>'), '空のハッシュタグ'),
]


def fetch(endpoint):
    domain, key = build_works.read_cms_config()
    out = subprocess.run(
        ['curl', '-sfL', '--max-time', '30', '-H', f'X-MICROCMS-API-KEY: {key}',
         f'https://{domain}.microcms.io/api/v1/{endpoint}?limit=100'],
        capture_output=True, text=True, check=True).stdout
    return json.loads(out)['contents']


def text_of(fragment):
    return html.unescape(re.sub(r'<[^>]+>', '', fragment)).strip()


def visible(page):
    """コメントと script / style を除いた、画面に出る部分"""
    page = re.sub(r'<!--.*?-->', '', page, flags=re.S)
    return re.sub(r'<(script|style)\b.*?</\1>', '', page, flags=re.S)


def main():
    flat = len(sys.argv) > 1
    site = ROOT / (sys.argv[1] if flat else '.')
    if flat:
        pages_root, top = site, site / 'index.html'
    else:
        pages_root, top = site / 'b', site / 'index-b.html'
    problems = []

    def bad(page, msg):
        problems.append(f'{page.relative_to(site).as_posix()}: {msg}')

    pages = [top] + sorted(p for p in pages_root.rglob('*.html')
                           if p.name != '404.html' and (flat or p != pages_root / 'index.html')
                           and p != top and 'assets' not in p.parts and 'data' not in p.parts)

    # ---- 1. microCMS との過不足・内容の一致
    works, members = fetch('works'), fetch('members')
    expect = {
        'works': {(c.get('slug') or c['id']): c for c in works},
        'members': {(c.get('slug') or c['id']): c for c in members
                    if (c.get('name') or '').strip() and (c.get('photo') or {}).get('url')},
    }
    for kind, by_slug in expect.items():
        have = {p.parent.name for p in (pages_root / kind).glob('*/index.html')}
        for slug in sorted(set(by_slug) - have):
            problems.append(f'{kind}/{slug}/: microCMS にあるのに詳細ページが無い')
        for slug in sorted(have - set(by_slug)):
            problems.append(f'{kind}/{slug}/: microCMS に無いページが残っている')
        for slug in sorted(have & set(by_slug)):
            page = pages_root / kind / slug / 'index.html'
            src = visible(page.read_text(encoding='utf-8'))
            c = by_slug[slug]
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', src, re.S)
            want = (c.get('title') if kind == 'works' else c.get('name') or '').strip()
            if not h1 or text_of(h1.group(1)) != want:
                bad(page, f'見出しが microCMS と違う（ページ: {text_of(h1.group(1)) if h1 else "なし"} / CMS: {want}）')
            if kind == 'members':
                ja = (c.get('name_ja') or '').strip()
                if ja and ja not in text_of(src):
                    bad(page, f'日本語名「{ja}」が出ていない')
                want_tags = [t for line in str(c.get('tags') or '').splitlines() for t in build_works.split_tags(line)]
            else:
                want_tags = build_works.work_tags({'client': c.get('client'), 'kind': c.get('kind')})
            box = re.search(r'<ul class="wd-tags">(.*?)</ul>', src, re.S)
            got = [text_of(t).lstrip('#') for t in re.findall(r'<li>(.*?)</li>', box.group(1), re.S)] if box else []
            want_unique = list(dict.fromkeys(want_tags))
            if kind == 'members' and not want_unique and (c.get('role') or '').strip():
                want_unique = [c['role'].strip()]
            if got != want_unique:
                bad(page, f'タグが microCMS と違う（ページ: {got} / CMS: {want_unique}）')

    # 一覧ページに並ぶ人数・件数
    for kind, cls in (('members', 'member'), ('works', 'work-card')):
        index = pages_root / kind / 'index.html'
        n = len(re.findall(rf'<(?:li|a) class="{cls}"', visible(index.read_text(encoding='utf-8'))))
        if n != len(expect[kind]):
            bad(index, f'一覧の件数が microCMS と違う（ページ: {n} / CMS: {len(expect[kind])}）')

    # ---- 2. 全ページ: リンク切れ・CMS外データ・タグの重複
    for page in pages:
        raw = page.read_text(encoding='utf-8')
        rel_dir = page.parent.relative_to(site).as_posix()
        for m in re.finditer(r'\b(?:href|src|poster)="([^"#?]+)[^"]*"', raw):
            u = m.group(1)
            if SKIP_SCHEMES.match(u):
                continue
            t = site / posixpath.normpath(posixpath.join(rel_dir, u))
            if not (t.is_file() or (t / 'index.html').is_file()):
                bad(page, f'リンク切れ {u}')
        shown = visible(raw)
        for pat, label in FORBIDDEN:
            hit = pat.search(shown)
            if hit:
                bad(page, f'{label}: {hit.group(0)!r}')

    if problems:
        print('\n'.join(problems))
        raise SystemExit(f'問題が {len(problems)} 件あります（{len(pages)} ページを検査）')
    print(f'{len(pages)} ページを検査: 問題なし（事例 {len(expect["works"])} 件・メンバー {len(expect["members"])} 人が microCMS と一致）')


if __name__ == '__main__':
    main()
