#!/usr/bin/env python3
"""data/works-sample/<slug>.html の仮原稿を、microCMSの works > body に入稿する。

フロントに埋め込んである cms-config.js のキーは **GET専用** なので使えない
（PATCH / PUT はいずれも "forbidden" が返る）。書き込み権限のあるAPIキーを
環境変数で渡すこと。書き込みキーはリポジトリに絶対にコミットしないこと。

    MICROCMS_WRITE_KEY=xxxxx python3 scripts/put_work_body.py holiday-cola

works のコンテンツはタイトル一致で探すので、事前にIDを調べる必要はない。
既存の title / kind / client / description はそのまま引き継ぎ、body だけ足す。
"""
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request

SERVICE = "sthl"
ROOT = pathlib.Path(__file__).resolve().parent.parent
SAMPLE_DIR = ROOT / "data" / "works-sample"
# slug → microCMSのタイトル（site.js の WORKS_FALLBACK と対応）
TITLE_BY_SLUG = {"holiday-cola": "休日COLA"}
DRAFT_NOTE = "<p><em>※ この記事はレイアウト確認用の仮原稿です（内容は未確定）。</em></p>\n"


def api(path: str, key: str, method: str = "GET", payload: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"https://{SERVICE}.microcms.io/api/v1/{path}",
        method=method,
        headers={"X-MICROCMS-API-KEY": key, "Content-Type": "application/json"},
        data=json.dumps(payload, ensure_ascii=False).encode() if payload else None,
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read() or "{}")


def main() -> int:
    slug = sys.argv[1] if len(sys.argv) > 1 else "holiday-cola"
    key = os.environ.get("MICROCMS_WRITE_KEY", "")
    if not key:
        print("MICROCMS_WRITE_KEY（PUT可のAPIキー）を環境変数で渡してください", file=sys.stderr)
        return 1

    html = (SAMPLE_DIR / f"{slug}.html").read_text()
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S).strip()

    title = TITLE_BY_SLUG.get(slug)
    works = api("works?limit=100", key)["contents"]
    hit = next((w for w in works if w["title"] == title), None)
    if not hit:
        print(f"works に「{title}」が見つかりません", file=sys.stderr)
        return 1

    body = {k: hit.get(k, "") for k in ("title", "kind", "client", "description")}
    body["body"] = DRAFT_NOTE + html
    try:
        print(api(f"works/{hit['id']}", key, "PUT", body))
    except urllib.error.HTTPError as e:
        print(f"入稿に失敗しました（HTTP {e.code}）: {e.read().decode()}", file=sys.stderr)
        print("APIキーの works への PUT 権限と、body フィールドの有無を確認してください", file=sys.stderr)
        return 1
    print(f"入稿しました: https://{SERVICE}.microcms.io/apis/works/{hit['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
