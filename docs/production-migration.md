# 本番公開 手順書（studioholiday.jp を新サイトに切り替える）

更新日: 2026-11-26（手順2に、移動するファイルを1つずつ書いた）

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
| アップロードするファイル | `xserver-upload/studioholiday-site.zip`（2026-11-26 作成。全ページ検査済み）。microCMS の内容やデザインを変えたら、Claude に作り直しを頼む |
| リハーサル | https://iwai-ddndn.github.io/studio-holiday-web-prototype/ （本番と同じURL構成。最新の修正を反映済み） |
| 確認用サイト | https://iwai-ddndn.github.io/studio-holiday-web-proposal-b/index-b.html （最新の修正を反映済み。事業ページも見られる） |
| 現行サイト | エックスサーバー（サーバー番号 sv72）上の WordPress |
| バックアップ | データベース5つを手元へダウンロード済み（2026-11-26）。サーバーの自動バックアップもある |
| サブドメイン | `lab`（ホリデイラボ）、`minnadegohan`、`substack` の3つ。今回は触らない |


---

## 2. アップロードの前に済ませること

### 2-1. public_html の仕分け（2026-11-25 の一覧で確認済み）

`studioholiday.jp` → `public_html` にあるものを、次のとおり扱う。

| 扱い | 対象 |
| --- | --- |
| **触らない**（サブドメインのフォルダ） | `lab`、`minnadegohan`、`minnadegohan_old`、`substack` |
| **退避する**（WordPress） | フォルダ: `wp-admin`、`wp-content`、`wp-includes`。ファイル: `.htaccess`、`index.php`、`license.txt`、`readme.html`、`xmlrpc.php`、`wp-` で始まる `.php` 13個（`wp-config.php` を含む）。1つずつの名前は3章の手順2の表にある、`campdaisuki.php`（WordPress のログイン画面。2026-11-26 にURLを開いて確認） |
| そのままでよい | `default_page.png`（エックスサーバーの初期ファイル。害は無い） |

新サイトのファイル名（`index.html`、`404.html`、`work.html`、`robots.txt`、`sitemap.xml`、`.htaccess`、`styles.css`、`site.js`、`main.js`、`cms-config.js`、`assets/`、`data/`、`members/`、`works/`、`proposal-b/`）と重なるのは `.htaccess` だけ。これは退避する。

今の `.htaccess` の中身は確認済み（2026-11-25）。書かれているのは、エックスサーバーのサーバーキャッシュ用の2行と、中身が空の WordPress 用の枠だけ。特定のURLの転送やアクセス制限は無いので、新しい `.htaccess` に引き継ぐものは無い。

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

### 2-3. 中身の仕上げ（済み）

TOPのタイトルと紹介文、SNSシェア用の画像（1200×630）、ファビコンは、2026-11-26 にそろえて組み込んだ。アップロード用の zip は `xserver-upload/studioholiday-site.zip`。

---

## 3. 当日の手順

操作は岩井さんがファイルマネージャで行う。先方とは、手順5の確認を同時に行う。

### 手順1: バックアップを確かめ、退避先のフォルダを用意する

「バックアップ」と「退避」は別の作業。バックアップは、万一に備えて控えを持つこと（サイトには影響しない）。退避は、旧サイトのファイルを `public_html` からどかすこと（手順2。どかした時点で旧サイトは見えなくなる）。

1. バックアップを確かめる。
   - データベース5つ（`holiday_wp`、`holiday_wp1`、`holiday_wp2`、`holiday_wp3`、`holiday_mt`）は、2026-11-26 に手元へダウンロード済み。当日までに旧サイトを更新した場合だけ、サーバーパネル → 「MySQLバックアップ」 → 「現在のMySQLをダウンロード」で取り直す。
   - サーバーパネル → 「バックアップ」で、自動バックアップの日付が並んでいることを確かめる。
   - ファイルの控えを手元にも置く場合は、同じ「バックアップ」の画面の手動バックアップで、`studioholiday.jp` をダウンロードする。必須ではない。手順2は「移動」なので、ファイルはサーバーに残る。
   - ダウンロードしたものには、データベースのパスワードや記事のデータが入っている。作業フォルダ（公開リポジトリ）の外に置く。
2. 退避先のフォルダを用意する。ファイルマネージャで、`studioholiday.jp` フォルダの中（`public_html` と同じ階層）に `wp_backup_20261125` があることを確かめる。無ければ作る。`public_html` の外なので、ウェブからは見えない。フォルダ名の日付は、切り替え日とずれていてよい。

### 手順2: WordPress のファイルを退避する

旧サイト（WordPress）のファイルを、ウェブから見えない場所へ移す。この手順は、ここに書いてあることだけで進められる。

**開く場所（移動元）**

ファイルマネージャの左のツリーで、`studioholiday.jp` → `public_html` の順に押す。右側に27個の名前が並ぶ。

**移動先**

`studioholiday.jp` → `wp_backup_20261125`（左のツリーで `public_html` と同じ段にあるフォルダ。手順1で用意したもの）。

**やること**

下の表は、右側の一覧と同じ並び順。「移動する」の22個にチェックを入れ、`wp_backup_20261125` へ移動する。コピーではなく移動。残る5個には触らない。

| # | 名前 | 種類 | やること |
| --- | --- | --- | --- |
| 1 | `lab` | フォルダ | **動かさない** |
| 2 | `minnadegohan` | フォルダ | **動かさない** |
| 3 | `minnadegohan_old` | フォルダ | **動かさない** |
| 4 | `substack` | フォルダ | **動かさない** |
| 5 | `wp-admin` | フォルダ | 移動する |
| 6 | `wp-content` | フォルダ | 移動する |
| 7 | `wp-includes` | フォルダ | 移動する |
| 8 | `.htaccess` | ファイル | 移動する |
| 9 | `campdaisuki.php` | ファイル | 移動する |
| 10 | `default_page.png` | ファイル | **動かさない** |
| 11 | `index.php` | ファイル | 移動する |
| 12 | `license.txt` | ファイル | 移動する |
| 13 | `readme.html` | ファイル | 移動する |
| 14 | `wp-activate.php` | ファイル | 移動する |
| 15 | `wp-blog-header.php` | ファイル | 移動する |
| 16 | `wp-comments-post.php` | ファイル | 移動する |
| 17 | `wp-config-sample.php` | ファイル | 移動する |
| 18 | `wp-config.php` | ファイル | 移動する |
| 19 | `wp-cron.php` | ファイル | 移動する |
| 20 | `wp-links-opml.php` | ファイル | 移動する |
| 21 | `wp-load.php` | ファイル | 移動する |
| 22 | `wp-login.php` | ファイル | 移動する |
| 23 | `wp-mail.php` | ファイル | 移動する |
| 24 | `wp-settings.php` | ファイル | 移動する |
| 25 | `wp-signup.php` | ファイル | 移動する |
| 26 | `wp-trackback.php` | ファイル | 移動する |
| 27 | `xmlrpc.php` | ファイル | 移動する |

覚え方: 動かさないのは、上の4つのフォルダと `default_page.png` だけ。それ以外は全部移動する。

移動の操作は、チェックを入れたものを右クリックして「移動」を選ぶか、左のツリーの `wp_backup_20261125` へドラッグする（この操作は実際の画面では未確認。メニューの名前が違う場合は、その画面を Claude に見せる）。

**移動したあとの確かめ**

- `public_html` に残っているのが、`lab`、`minnadegohan`、`minnadegohan_old`、`substack`、`default_page.png` の5個だけ。
- `wp_backup_20261125` の中に、22個（フォルダ3個とファイル19個）が入っている。

一覧が上の表と違う場合（名前が増えている・減っている）は、移動する前に手を止めて、その画面を Claude に見せる。表は 2026-11-25 の画面をもとにしている。

**触らないもの**

- 上の表で「動かさない」とした5個。4つのフォルダはサブドメインのサイトの中身で、動かすとそのサイトが見えなくなる。
- `public_html` より上の段にあるフォルダ（`mail`、`autoreply`、`htpasswd`、`log`、`script`、`xserver_php`、`.spamassassin`）。`mail` はメールの中身。
- データベース。ここで言うデータベースは、WordPress の記事や設定を保存している MySQL のことで、`holiday_wp`、`holiday_wp1`、`holiday_wp2`、`holiday_wp3`、`holiday_mt` の5つ。ファイルマネージャには出てこない。サーバーパネルの「データベース」欄（「MySQL設定」「MySQL復元」「phpmyadmin」）で扱うもので、当日はこの欄を開かなければ触ることはない。残しておけば、4章の切り戻しで旧サイトをそのまま戻せる。

この時点から手順3が終わるまで、`https://studioholiday.jp/` は表示されない。

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

### 切り替え後に、WordPress の管理画面へ入りたくなったとき

ログイン画面のファイル（`campdaisuki.php`）だけを戻しても、ログインはできない。ログイン画面は、WordPress 本体（`wp-admin`、`wp-includes`、`wp-content`、`wp-config.php` など）とデータベースがそろって初めて動くため。

上の切り戻しの手順で一式を戻せば、ログインできる。データベースには触っていないので、記事や設定は切り替え前のまま残っている。ただし、戻している間は新サイトが見えなくなる。用が済んだら、3章の手順2〜3で新サイトに戻す。

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

## 付録A: 済んでいる準備（2026-11-26 時点）

- 案Bのソースを `studio-holiday-web-prototype` の `main` に統合した。
- 公開時のURLを整理した（`index.html`、`works/`、`members/`）。
- 表示と生成を microCMS の内容だけにした。ハッシュタグの「#」の重複を解消した。
- お問い合わせボタンを Google フォームへ向けた。
- TOPのページタイトルと紹介文を、確定した文面にした（2026-11-26）。
- サンプルの事例2件とメンバー5件を、元データから除いた（2026-11-26）。microCMS の読み込みに失敗したときにも表示されない。
- メインカラーを `#bbff38` に変えた（2026-11-26）。見出しのステッカー画像、FVのキャッチコピー、Newsletter の欄も同じ色にそろえた。「01 DESIGN CONSULTING」の写真の背景だけは前の色のまま。
- FOOD DESIGN の画像を差し替えた（2026-11-26）。
- SNSシェア用の画像とファビコン（`favicon.ico`、PNG、iPhone のホーム画面用）を入れた（2026-11-26）。
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
