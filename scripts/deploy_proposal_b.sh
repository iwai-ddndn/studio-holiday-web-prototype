#!/bin/sh
# デザイン案Bを、本番とは別のリポジトリ（GitHub Pages）に公開する。
#
#     sh scripts/deploy_proposal_b.sh
#
# 本番リポジトリ（studio-holiday-web-prototype）には何もpushしない。
# 1. scripts/build_proposal_b.py で本番の下層ページから b/ を作り直す（事例の追加・更新もここで反映）
# 2. 案Bに必要なファイルだけを一時ディレクトリの公開用リポジトリに写してpushする
#    （TOPは index-b.html。ルートの index.html はそこへ転送するだけのページ）
set -eu

REPO="iwai-ddndn/studio-holiday-web-proposal-b"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

python3 "$ROOT/scripts/build_proposal_b.py"

git clone --quiet --depth 1 "https://github.com/$REPO.git" "$WORK/site"
cd "$WORK/site"
# 前回の中身を消してから写し直す（.git は残す）
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

for f in index-b.html styles.css site.js main.js cms-config.js .nojekyll; do
  cp "$ROOT/$f" .
done
for d in assets data b proposal-b; do
  rsync -a --exclude .DS_Store "$ROOT/$d" .
done

cat > index.html <<'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex" />
  <meta http-equiv="refresh" content="0; url=./index-b.html" />
  <title>STUDIO HOLIDAY（デザイン案B）</title>
</head>
<body><a href="./index-b.html">STUDIO HOLIDAY デザイン案B を開く</a></body>
</html>
EOF
printf 'User-agent: *\nDisallow: /\n' > robots.txt

git add -A
if git diff --cached --quiet; then
  echo "変更なし（公開中のものと同じ）"
  exit 0
fi
SRC=$(git -C "$ROOT" rev-parse --short HEAD)
git commit --quiet -m "デザイン案Bを更新（web-renewal $SRC 時点）"
git push --quiet origin HEAD
echo "push しました: https://iwai-ddndn.github.io/studio-holiday-web-proposal-b/"
