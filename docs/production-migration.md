# 本番移管 手順書（studioholiday.jp へ案Bを公開する）

作成日: 2026-11-25
前提: 2026-11-19 の相談どおり、まず岩井さんの GitHub アカウント（`iwai-ddndn`）の GitHub Pages から公開し、会社の GitHub ができたら移す。公開するのは案B（`index-b.html`）。

この手順書は調査結果をもとにした計画。2026-11-25 に、案Bのソースを `origin/main` へまとめるところまで実施した（下の「実施済み」）。ファイル名の整理と本番化の修正は実装済みだが、push していない（2〜4章）。DNSの変更はまだ行っていない。

### 実施済み（2026-11-25）

- 確認用リポジトリ（`studio-holiday-web-proposal-b`）には、11/19 以降に16件のPRが直接入っていた。この内容を `origin/main`（`studio-holiday-web-prototype`）へ取り込んだ。
- 取り込んだ修正を、ページの生成元（`scripts/site_chrome.py` と案Aのページ）にも反映した。生成スクリプトを実行し直しても、公開側で直した内容が消えない。
- microCMS にあるのに詳細ページが無かった事例5件・メンバー5人ぶんを生成した。サンプルのメンバーページは出さないようにした。
- ヘッダーとフッターのお問い合わせボタンを Google フォームへ向けた。
- 毎朝の自動生成で、メンバーと案B（`b/`）も作り直すようにした。

- リハーサルを開始した。Pages の Source を「GitHub Actions」に切り替え、`https://iwai-ddndn.github.io/studio-holiday-web-prototype/` を本番と同じURL構成（検索除けあり）で公開している。4章の「反映の手順」は実施済み。
- 表示と生成を microCMS の内容だけにした。事例のURLは microCMS の slug（無ければコンテンツID）。
- 事業ページ3つ（`design-process.html` `food-design.html` `community-space.html`）は本番出力から外した。`scripts/build_site.py` の `HIDDEN_PAGES` から消すと公開される。確認用サイトには残っている。
- 全ページの検査は `python3 scripts/check_site.py _site`（確認用の構成は引数なし）。

今後の修正は `studio-holiday-web-prototype` の `main` に入れる。確認用リポジトリに直接入れると、また二重管理になる。

---

## 0. 現状（2026-11-25 に確認した内容）

### 新サイト（このリポジトリ）

| 項目 | 状態 |
| --- | --- |
| 案Bの最新コード | `origin/main`（af92738）。作業フォルダは `web-renewal-production/`（ブランチ `production-b`） |
| 案Bの確認用URL | https://iwai-ddndn.github.io/studio-holiday-web-proposal-b/index-b.html （別リポジトリ） |
| `origin/main` で公開中のもの | TOP（`index.html`）は案Aのまま。案Bは https://iwai-ddndn.github.io/studio-holiday-web-prototype/index-b.html で開く |
| GitHub Pages の設定 | `main` ブランチのルートをそのまま公開。独自ドメインは未設定。リポジトリは public |
| 自動更新 | 毎朝、Substack の記事一覧（6:00）と、microCMS の事例・メンバーのページ（6:30、案Bの `b/` を含む）を作り直す。Secrets は使っていない |
| 修正リスト | `studio-holiday-web-feedback` に未完了の Issue が12件（#9, #17〜#27） |

### 現行サイト（studioholiday.jp）

外から見える情報だけで確認した。管理画面は見ていない。

| 項目 | 状態 |
| --- | --- |
| サイト | WordPress。エックスサーバー上で動いている |
| 正式なURL | `https://studioholiday.jp/`（`www` はここへ転送されている） |
| DNSの管理 | エックスサーバーのネームサーバー（ns1〜ns5.xserver.jp） |
| A レコード | `studioholiday.jp` と `www` が 202.226.37.33 |
| メール（MX） | `studioholiday.jp` 自身を指している（→ 6章の注意点） |
| TXT | SPF（エックスサーバーのメール用）、Google Search Console の所有確認、Microsoft の所有確認 |
| サブドメイン | `substack.studioholiday.jp` は Substack を向いている。今回は触らない |
| URL構成 | ほぼ1ページ。記事URLは `/?p=123` 形式で、サイトマップは無い |

---

## 1. 先に決めること・会社に確認すること

### 決めること

1. **公開方法**: GitHub Pages に独自ドメインを向ける（この手順書の前提）。
   別案として、今のエックスサーバーにファイルを置く方法もある。DNSを変えないのでメールへの影響が出ない。その代わり、毎朝の自動更新をサーバーへのアップロード方式に作り替える必要がある。
2. **公開前に直す Issue**: 未完了12件のうち、公開までに必須のものを選ぶ。残りは公開後に回す。
3. **切り替える日時と、最終OKを出す人**。

### 会社に確認すること

| # | 確認すること | 理由 |
| --- | --- | --- |
| 1 | エックスサーバーの契約者と、サーバーパネルにログインできる人 | DNSを書き換えるのはこの人 |
| 2 | `@studioholiday.jp` のメールを使っているか。使っているなら、メールソフトのサーバー名に何を設定しているか | DNSを切り替えるとメールが止まるおそれがある（6章） |
| 3 | 現行の WordPress を残す必要があるか。エックスサーバーの契約更新日 | 切り戻し先として、しばらく消さずに置きたい |
| 4 | Google Search Console とアナリティクスを誰のアカウントで使っているか | 所有確認の TXT がすでにある。新サイトでも引き継ぐ |
| 5 | お問い合わせフォームの回答を誰が受け取るか | ボタンは Google フォームへ向けた。フォームの持ち主と通知先は未確認 |
| 6 | プライバシーポリシーのページが必要か | 現状は無い |
| 7 | ソースコードが公開（public）のままでよいか | 無料プランの GitHub Pages は public リポジトリでしか使えない |

2 が分からないままDNSを切り替えてはいけない。

---

## 2. ファイル名の整理（案Bを正式版の名前にする）

今の名前のまま独自ドメインを向けると、URLが次のようになる。

- TOP: `https://studioholiday.jp/index-b.html`
- 事例: `https://studioholiday.jp/b/works/kdc/`
- メンバー: `https://studioholiday.jp/b/members/iwai/`

一度公開したURLは検索結果やSNSのシェアに残るので、公開前に直す。

### 公開時の名前

| 今 | 公開時 |
| --- | --- |
| `index-b.html` | `index.html` |
| `b/works/…` | `works/…` |
| `b/members/…` | `members/…` |
| `b/design-process.html` など下層4ページ | ルート直下（`design-process.html` など） |
| `proposal-b/`（案Bの CSS/JS） | そのままでも動く。ソースを見た人にしか見えないので優先度は低い。変えるなら `motion/` など |

### 進め方（実装済み・未push）

リポジトリ内のファイルは今の名前のまま残し、**公開用のファイル一式を作るときに名前を変える**。

理由: 案Bの下層ページ（`b/`）は、案Aのページから `scripts/build_proposal_b.py` が自動で作っている。案Aのファイルを消して案Bを直接リネームすると、この生成の流れを全部作り直すことになる。

`scripts/build_site.py` が、上の表の名前で `_site/` に書き出す。ページ内のリンクと、JSが組み立てるリンク先も新しい名前に合わせる。案Aのページは `_site/` に入れないので、公開されなくなる。

```bash
python3 scripts/build_site.py
```

リンク切れや案B用の名前の残りがあると、エラーで止まる。確認用サイト（`studio-holiday-web-proposal-b`）は今までどおり `index-b.html` と `b/` の構成で、検索除けを付けたまま残る。

---

## 3. 本番化で直す箇所

`scripts/build_site.py` が `_site/` を作るときに行う。リポジトリ内のファイルは書き換えない。

| # | 直すこと | 状態 |
| --- | --- | --- |
| 1 | 検索除け（`noindex`）を外す | 実装済み。`--noindex` を付けると残す（リハーサル用） |
| 2 | OGP のURLを本番ドメインにし、全ページに canonical を入れる | 実装済み。`--base-url` で指定（既定は `https://studioholiday.jp`） |
| 3 | タイトルから「（デザイン案B）」を外す | 実装済み |
| 4 | サンプルのメンバーページを公開物から外す | 対応済み（2026-11-25） |
| 5 | TOP に紹介文・OGP・ファビコンを入れる | 仮の内容で実装済み（下の「差し替えが必要なもの」） |
| 6 | `robots.txt`・`sitemap.xml`・`404.html` を作る | 実装済み |
| 7 | お問い合わせボタンに実際のリンクを入れる | 対応済み（2026-11-25。Google フォーム） |
| 8 | アクセス解析のタグを入れる（使う場合） | 未対応。使うかどうかの回答待ち |

### 差し替えが必要なもの（仮の内容で入れている）

`scripts/build_site.py` の冒頭で指定している。

| 項目 | 今の内容 | 必要なもの |
| --- | --- | --- |
| TOP の紹介文（検索結果・SNSシェアに出る） | ABOUT の本文をもとにした仮の文面 | 確定した文面 |
| SNSシェア用の画像 | `assets/business-hero/design-consulting.jpg` | 1200×630 の画像 |
| ファビコン | `assets/fv-logo.svg`（アーチのロゴ） | ファビコン用の画像 |

---

## 4. リポジトリと公開設定の整理

公開用のワークフロー `.github/workflows/deploy-pages.yml` を追加した（未push）。microCMS と Substack の最新でページを作り直す → `_site/` を作る → GitHub Pages に公開する、の順に動く。きっかけは「`main` への push」「毎朝 6:45」「手動実行」の3つ。

公開先のURLと検索除けは、リポジトリの Variables（Settings → Secrets and variables → Actions → Variables）で切り替える。

| Variable | 未設定のとき（リハーサル） | 本番に切り替える日 |
| --- | --- | --- |
| `SITE_BASE_URL` | `https://iwai-ddndn.github.io/studio-holiday-web-prototype` | `https://studioholiday.jp` |
| `SITE_NOINDEX` | 検索除けを付ける | `off` |

### 反映の手順

1. `production-b` を `origin/main` へ push する。`origin/main` には自動生成のコミットが毎朝入るので、直前に取り込む。
2. 同じタイミングで、リポジトリの Settings → Pages → Source を「GitHub Actions」に変える。「Deploy from a branch」のままだと、ワークフローの公開が失敗する。
3. Actions の「Deploy site to GitHub Pages」が成功したことを確認する。

2 を行うと、`https://iwai-ddndn.github.io/studio-holiday-web-prototype/` の TOP が案Aから案Bに替わる（案Aは見られなくなる）。Variables が未設定なら、検索除けは付いたまま。

`main` への push は本番リポジトリへの反映になる。実行は岩井さんの明示の指示を待つ。

---

## 5. 切り替え前のリハーサル

DNSを変える前に、`https://iwai-ddndn.github.io/studio-holiday-web-prototype/` で本番用の公開物を確認する。

- TOP が `index.html` で開く。`index-b.html` と `b/` が URL に出てこない
- TOP → 事例 → メンバー → 下層4ページ → TOP と、リンクをひととおり辿れる
- microCMS で事例を1件更新し、ワークフローを手動実行して、反映される
- スマホ幅と PC 幅で表示が崩れない
- 配信中のファイルを `curl` で取り、手元の `_site/` と一致する

この時点では Variables を設定せず、検索除けを付けたままにしておく。外すのは DNS を切り替える直前。

---

## 6. メールを止めないための準備（DNS切り替えの前に必ず行う）

今のメールの配送先（MX）は `studioholiday.jp` 自身になっている。メールは「`studioholiday.jp` の A レコードが指すサーバー」に届く仕組みなので、A レコードを GitHub に向けると、メールも GitHub に送られて届かなくなる。

対策として、MX をエックスサーバーのサーバー名に直接向ける。

1. エックスサーバーのサーバーパネルで、サーバー名（`sv***.xserver.jp`）を確認する。SPF の記述からは `sv72.xserver.jp` と読み取れるが、管理画面では未確認。
2. DNSレコード設定で、MX を `studioholiday.jp` から `sv***.xserver.jp` に書き換える。
3. SPF の TXT から `+a:studioholiday.jp` を外す。残すと、GitHub のサーバーを送信元として認める記述になる。
4. メールソフトの受信・送信サーバー名に `studioholiday.jp` を設定している人がいたら、`sv***.xserver.jp` に変えてもらう。
5. 社外のアドレスと送受信して、届くことを確認する。

ここまで終えて1日以上問題が無いことを確かめてから、7章へ進む。

---

## 7. DNS の切り替え

作業はエックスサーバーのサーバーパネル（DNSレコード設定）で行う。書き換える前に、今の設定一覧をスクリーンショットで残す。

### 前日まで

1. GitHub のアカウント設定 → Pages → 「Add a domain」で `studioholiday.jp` を登録する。表示された TXT レコード（`_github-pages-challenge-iwai-ddndn`）を DNS に追加し、Verified にする。他人にドメインを使われる事故を防ぐための手順。
2. `studioholiday.jp` と `www` の A レコードの TTL を短くする（300秒など）。切り戻しを早く効かせるため。

### 当日

1. Variables に `SITE_BASE_URL=https://studioholiday.jp` と `SITE_NOINDEX=off` を設定し、「Deploy site to GitHub Pages」を手動実行する。
2. リポジトリの Settings → Pages → Custom domain に `studioholiday.jp` を入れて保存する。
3. DNS を書き換える。

   | ホスト | 種別 | 変更前 | 変更後 |
   | --- | --- | --- | --- |
   | `studioholiday.jp` | A | 202.226.37.33 | 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153 の4つ |
   | `www` | A → CNAME | 202.226.37.33 | `iwai-ddndn.github.io` |

   MX、TXT、`substack` は変えない。
4. Pages の設定画面で DNS チェックが通るのを待ち、「Enforce HTTPS」を有効にする。証明書の発行には数分〜1時間ほどかかり、その間は https で警告が出ることがある。アクセスの少ない時間帯に行う。

---

## 8. 切り替え後の確認

- `https://studioholiday.jp/` で新サイトが開き、鍵マークが付く
- `http://` と `www` が `https://studioholiday.jp/` へ転送される
- 事例・メンバー・下層ページが開く。microCMS の内容と Substack の記事一覧が表示される
- ページのソースに `noindex` が無い。`robots.txt` が全許可になっている
- 事例ページの `og:url` が `https://studioholiday.jp/works/…` になっている
- メールを社外と送受信できる
- `https://substack.studioholiday.jp/` が今までどおり開く
- Search Console にサイトマップを送信する
- 翌朝、自動更新のワークフローが成功している

旧サイトのURLについて: 記事URL（`/?p=123`）は新サイトの TOP が開く。画像の直リンク（`/wp-content/uploads/…`）は 404 になる。旧サイトはほぼ1ページなので、個別の転送設定は作らない。

---

## 9. 切り戻し

表示やメールに問題が出たら、DNS を元に戻す。

1. `studioholiday.jp` の A レコードを 202.226.37.33 に戻す。
2. `www` の CNAME を消し、A レコード 202.226.37.33 に戻す。

エックスサーバー上の WordPress を消していなければ、TTL の時間（300秒にしていれば数分）で旧サイトに戻る。そのため、WordPress とサーバー契約は、切り替え後しばらく残しておく。

---

## 10. 後日: 会社の GitHub への移管

会社の Organization ができたら行う。

1. リポジトリを Transfer する（`studio-holiday-web-prototype`、修正リストの `studio-holiday-web-feedback`、確認用の `studio-holiday-web-proposal-b`）。履歴と Issue は残る。
2. 移管先で Pages の設定（Source と Custom domain）と、ワークフローが動くことを確認する。
3. 移管先の Organization で、ドメインの所有確認をもう一度行う。
4. DNS の `www` の CNAME を `iwai-ddndn.github.io` から `<org名>.github.io` に書き換える。`studioholiday.jp` の A レコードは GitHub 共通の値なので変えない。
5. microCMS を会社の名義・支払いに移すかを決める。

---

## 作業の分担と順番

| 順 | 作業 | 担当 |
| --- | --- | --- |
| 1 | 1章の確認事項を会社に聞く | 岩井さん → 会社 |
| 2 | 2〜4章のコード修正（push はしない） | Claude（2026-11-25 に実装済み） |
| 3 | `main` への反映と5章のリハーサル | 岩井さんの指示後に Claude |
| 4 | 6章のメール設定 | エックスサーバーの管理者 |
| 5 | 7章の DNS 切り替え | エックスサーバーの管理者（GitHub 側の設定は岩井さん） |
| 6 | 8章の確認 | 岩井さん・Claude |

1 の回答を待たずに、2 は進められる。
