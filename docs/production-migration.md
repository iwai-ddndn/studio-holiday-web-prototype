# 本番公開 手順書（studioholiday.jp を新サイトに切り替える）

更新日: 2026-11-25

## 方針

新サイトのファイルを、今 `studioholiday.jp` がつながっているエックスサーバーに置く。WordPress と入れ替える形になる。

- DNS は変えない。メール（アカウント39件）にも触らない。
- 正式なURLは `https://studioholiday.jp/` のまま。
- 毎朝の自動更新は、最初は付けない。内容を変えたら、ファイルを上げ直す（5章）。GitHub からの自動転送は後から足す（6章）。

DNS を GitHub に向ける案は、メールの設定変更と39人ぶんの確認が要るため、やめた。

---

## 1. いまの状態

| 項目 | 状態 |
| --- | --- |
| アップロードするファイル | `xserver-upload/studioholiday-site.zip`（約43MB、195ファイル）。2026-11-25 時点の microCMS の内容で作成 |
| リハーサル | https://iwai-ddndn.github.io/studio-holiday-web-prototype/ （本番と同じURL構成。ヘッダー常時表示などの最新の修正5点は未反映） |
| 確認用サイト | https://iwai-ddndn.github.io/studio-holiday-web-proposal-b/index-b.html （最新の修正を反映済み。事業ページも見られる） |
| 現行サイト | エックスサーバー（サーバー番号 sv72）上の WordPress |
| サブドメイン | `lab`（ホリデイラボ）、`minnadegohan`、`substack` の3つ。今回は触らない |

zip の中身は、最新の修正5点（ヘッダー常時表示、下層FVのステッカー、WORKSの並び順、SPの2列）を含む。確認用サイトで見た内容と同じ。

---

## 2. アップロードの前に済ませること

### 2-1. public_html の中身を確かめる

ファイルマネージャで `studioholiday.jp` → `public_html` を開き、一覧のスクリーンショットを撮る。次の3種類に仕分ける。

| 種類 | 例 | 扱い |
| --- | --- | --- |
| WordPress のファイル | `wp-admin`、`wp-content`、`wp-includes`、`index.php`、`wp-config.php` などの `wp-*.php`、`.htaccess`、`xmlrpc.php`、`license.txt`、`readme.html` | 退避する（3章 手順2） |
| サブドメインのフォルダ | `lab`、`minnadegohan`、`substack` | **触らない** |
| それ以外 | 手で置いたファイルやフォルダ、`.user.ini`、`.well-known` など | 1つずつ判断する。迷うものは残す |

新サイトのファイル名は次のとおり。同じ名前のものが public_html にすでにあれば、上書きされる前に退避する。

`index.html`、`404.html`、`work.html`、`robots.txt`、`sitemap.xml`、`.htaccess`、`styles.css`、`site.js`、`main.js`、`cms-config.js`、`assets/`、`data/`、`members/`、`works/`、`proposal-b/`

### 2-2. 先方に確認すること

| # | 確認すること | 補足 |
| --- | --- | --- |
| 1 | 切り替える日時と、先方の確認担当 | 作業は10〜20分。その間だけサイトが見えにくくなる |
| 2 | `minnadegohan.studioholiday.jp` と `lab.studioholiday.jp` を今も使っているか | 今回は触らないが、切り替え後に表示が変わっていないかを見てもらう |
| 3 | 現行サイトのお問い合わせフォームと `hello@studioholiday.jp` の扱い | 新サイトのお問い合わせは Google フォームになる。回答を誰が受け取るかを決める |
| 4 | 現行サイトにしか無い情報や、外部から直接リンクされている画像・PDF | 切り替え後は開けなくなる。必要なものは先に移す |
| 5 | アクセス解析（Googleアナリティクスなど）を使っているか | 使う場合は計測IDをもらい、zip を作り直す |
| 6 | Search Console を誰のアカウントで使っているか | 切り替え後にサイトマップを送信する |

メールの設定は、確認しなくてよい。

### 2-3. 中身の仕上げ（仮のままでも公開できる）

| # | 内容 | 必要なもの |
| --- | --- | --- |
| 1 | TOPの紹介文（検索結果・SNSシェアに出る）が仮の文面 | 確定した文面 |
| 2 | SNSシェア用の画像が仮（BUSINESSの写真） | 1200×630 の画像 |
| 3 | ファビコンが仮（アーチのロゴ） | ファビコン用の画像 |

差し替えたら zip を作り直す（5章）。

---

## 3. 当日の手順

操作は岩井さんがファイルマネージャで行う。先方とは、手順5の確認を同時に行う。

### 手順1: バックアップを取る

1. サーバーパネル → バックアップで、自動バックアップが取られていることを確かめる。
2. ファイルマネージャで、`studioholiday.jp` フォルダの中（`public_html` と同じ階層）に、新しいフォルダ `wp_backup_20261125` を作る。public_html の外なので、ウェブからは見えない。

### 手順2: WordPress のファイルを退避する

`public_html` の中で、2-1 で「WordPress のファイル」に仕分けたものを選び、`wp_backup_20261125` へ移動する。コピーではなく移動。

- サブドメインのフォルダ（`lab`、`minnadegohan`、`substack`）は動かさない。
- `.htaccess` も忘れずに移す。残っていると、新サイトの転送設定とぶつかる。
- データベースには触らない。

この時点から手順3が終わるまで、サイトは表示されない。

### 手順3: 新サイトを上げる

1. `public_html` を開き、「アップロード」で `studioholiday-site.zip` を上げる。
2. 上がった zip を選び、「展開」を押す。展開先は `public_html` そのもの（フォルダを新しく作らない）。
3. `public_html` の直下に `index.html` と `assets` などが並んでいることを確かめる。`studioholiday-site` のようなフォルダの中に入ってしまった場合は、中身を1つ上へ移動する。
4. zip を削除する。

ファイルマネージャで zip を上げられない・展開できない場合は、FTP ソフト（FileZilla など）で、zip を手元で展開した中身を `public_html` へ上げる。`.htaccess` は隠しファイルなので、表示設定を確かめる。

### 手順4: 表示を確かめる（岩井さん）

| 確認すること | 期待する結果 |
| --- | --- |
| `https://studioholiday.jp/` | 新サイトのTOPが開く |
| `http://studioholiday.jp/` と `https://www.studioholiday.jp/` | `https://studioholiday.jp/` へ転送される |
| 事例・メンバーの詳細ページ | 開く |
| `https://studioholiday.jp/aaa`（存在しないURL） | 「ページが見つかりません」のページが出る |
| `https://minnadegohan.studioholiday.jp/` と `https://lab.studioholiday.jp/` | 切り替え前と同じ表示 |
| `https://substack.studioholiday.jp/` | 今までどおり開く |

旧サイトが出る場合は、サーバーパネル → 高速化 → サーバーキャッシュ設定でキャッシュを削除し、再読み込みする。

画面が真っ白になる、または「500 Internal Server Error」が出る場合は、`.htaccess` が原因のことが多い。`public_html` の `.htaccess` を一時的に `htaccess.txt` へ名前変更して、表示が戻るか確かめる。

### 手順5: 先方と同時に確認する

| 確認すること | 岩井さん | 先方 |
| --- | --- | --- |
| TOP・事例・メンバーが表示される | ○ | ○ |
| お問い合わせボタンから Google フォームが開く | ○ | ○ |
| スマホで表示が崩れない | ○ | ○ |
| メールを社外と送受信できる（念のため） | | ○ |
| サブドメインのサイトが今までどおり | ○ | ○ |

確認が済んだら、Claude に「公開した」と伝える。配信中のファイルを手元と照合し、検索除けが無いことと、全ページのリンクを検査する。

---

## 4. 切り戻し

1. `public_html` から、新サイトのファイル（2-1 の一覧）を削除する。サブドメインのフォルダは消さない。
2. `wp_backup_20261125` の中身を、`public_html` へ移動して戻す。

DNS を変えていないので、戻した瞬間に旧サイトへ戻る。

---

## 5. 公開後の運用

自動更新が無い間は、次のときにファイルを上げ直す。

| こういうとき | 上げ直しが要るか |
| --- | --- |
| microCMS で、既存の事例・メンバーの文章や画像を直した | TOPと一覧は自動で変わる。詳細ページは上げ直すまで古いまま |
| microCMS で、事例・メンバーを追加した | 要る。上げ直すまで、TOPや一覧のカードを押しても詳細ページが無い（404になる） |
| microCMS で、事例・メンバーを削除・非公開にした | 要る。上げ直すまで、詳細ページがURL直打ちで見える |
| Substack に記事を出した | 不要（電光掲示板は上げ直すまで前回の一覧のまま。気になれば上げ直す） |
| デザインや文言を直した | 要る |

上げ直しの手順:

1. Claude に「zip を作り直して」と頼む。microCMS の最新で作り直し、全ページを検査した zip が `xserver-upload/` にできる。
2. ファイルマネージャで `public_html` に zip を上げて展開する（上書き）。
3. 削除した事例・メンバーがある場合は、`works/` と `members/` の中の、そのIDのフォルダを消す。どれを消すかは Claude が伝える。

---

## 6. 後日: GitHub からの自動転送と、会社の GitHub への移管

### 自動転送（上げ直しを不要にする）

GitHub Actions が毎朝、作ったファイルをエックスサーバーへ SSH で送る形にする。必要な準備:

1. サーバーパネル → SSH設定を ON にし、公開鍵認証用の鍵を作る（今は「SSH設定はありません」の状態）。
2. 鍵とサーバー情報を、GitHub リポジトリの Secrets に登録する（岩井さんが行う）。
3. Claude が、転送用のワークフローを追加する。サブドメインのフォルダを消さない設定にする。

### 会社の GitHub への移管

会社の Organization ができたら、リポジトリを Transfer する（`studio-holiday-web-prototype`、`studio-holiday-web-feedback`、`studio-holiday-web-proposal-b`）。履歴と Issue は残る。公開先がエックスサーバーなので、DNS の変更は要らない。自動転送を入れている場合は、Secrets を移管先で登録し直す。

---

## 付録A: 済んでいる準備（2026-11-25）

- 案Bのソースを `studio-holiday-web-prototype` の `main` に統合した。
- 公開時のURLを整理した（`index.html`、`works/`、`members/`）。
- 表示と生成を microCMS の内容だけにした。ハッシュタグの「#」の重複を解消した。
- お問い合わせボタンを Google フォームへ向けた。
- `robots.txt`、`sitemap.xml`、`404.html`、OGP、canonical を入れた。
- エックスサーバー用の `.htaccess`（`http` と `www` の転送、404ページ）を用意し、手元の Apache で動作を確かめた。サブドメインには転送が効かないようにしてある。
- 事業ページ3つは本番に出していない（付録B）。

## 付録B: 事業ページを公開するとき

事業ページ3つ（DESIGN CONSULTING / FOOD DESIGN / COMMUNITY & SPACE）は、本番には出していない。ファイルはリポジトリに残っていて、確認用サイトでは見られる。

1. `design-process.html`、`food-design.html`、`community-space.html` を直す（FOOD DESIGN と COMMUNITY & SPACE の見出しには「（仮）」が残っている）。
2. 確認用サイトに出して確認する。
3. `scripts/build_site.py` の `HIDDEN_PAGES` から、公開するページの行を消す。
4. zip を作り直して上げる。ページが公開され、フッターのリンクも自動で戻る。

## 付録C: コマンド（Claude 用）

| やること | コマンド |
| --- | --- |
| 本番用の一式を作る | `python3 scripts/build_works.py && python3 scripts/build_pages.py && python3 scripts/build_proposal_b.py && python3 scripts/build_site.py --apache` |
| 全ページを検査する | `python3 scripts/check_site.py _site` |
| 確認用サイトを更新する | `sh scripts/deploy_proposal_b.sh` |
