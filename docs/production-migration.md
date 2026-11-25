# 本番公開 手順書（studioholiday.jp を新サイトに切り替える）

更新日: 2026-11-25

残っている作業だけを載せている。終わった準備（ソースの統合、URLの整理、公開の仕組み）は末尾の「付録A」に結果だけ残した。

---

## 1. いまの状態

| 項目 | 状態 |
| --- | --- |
| 新サイト（リハーサル） | https://iwai-ddndn.github.io/studio-holiday-web-prototype/ で、本番と同じURL構成で公開中。検索除けを付けている |
| 確認用サイト | https://iwai-ddndn.github.io/studio-holiday-web-proposal-b/index-b.html （事業ページも見られる） |
| 現行サイト | エックスサーバー上の WordPress。`https://studioholiday.jp/`（`www` はここへ転送） |
| DNS | エックスサーバーで管理。岩井さんが管理画面に入れる |
| メール | 配送先（MX）が `studioholiday.jp` 自身を指している。このままサイトのDNSを変えると届かなくなる（3章 手順A で対策） |

DNSの現在値（2026-11-25 に外から確認）:

| ホスト | 種別 | 値 |
| --- | --- | --- |
| `studioholiday.jp` | A | 202.226.37.33 |
| `www` | A | 202.226.37.33 |
| `studioholiday.jp` | MX | `studioholiday.jp`（優先度 0） |
| `studioholiday.jp` | TXT | SPF: `v=spf1 +a:sv72.xserver.jp +a:studioholiday.jp +mx include:spf.sender.xserver.jp ~all` |
| `substack` | CNAME | Substack（今回は触らない） |

---

## 2. 切り替えまでに済ませること

### 2-1. 先方と決めること

| # | 決めること | 補足 |
| --- | --- | --- |
| 1 | 切り替える日時 | 岩井さんと先方が同時に確認できる時間帯。メールの少ない時間がよい |
| 2 | 先方の確認担当 | 当日、メールの送受信とサイトの表示を確認する人 |
| 3 | `@studioholiday.jp` のメールを使っているか | 使っている場合、メールソフトのサーバー名に `studioholiday.jp` を設定している人がいないかも聞く（いたら 3章 A-4） |
| 4 | 現行の WordPress を当面残すこと | 切り戻し先になる。サーバー契約と WordPress は消さないでもらう |

### 2-2. 中身の仕上げ（出すまでに直したいもの）

| # | 内容 | 直す場所 |
| --- | --- | --- |
| 1 | 事例「休日COLA」の紹介文が「掲載事例 No.27。紹介文はWORKSシート反映待ち（仮）。」のまま | microCMS |
| 2 | TOPの紹介文（検索結果・SNSシェアに出る）が仮の文面 | 文面が決まれば Claude が差し替える |
| 3 | SNSシェア用の画像が仮（BUSINESSの写真） | 1200×630 の画像があれば差し替える |
| 4 | ファビコンが仮（アーチのロゴ） | 画像があれば差し替える |
| 5 | 修正リスト（`studio-holiday-web-feedback`）の未完了 Issue | 公開前に必須のものを選ぶ |
| 6 | アクセス解析（Googleアナリティクスなど）を入れるか | 使う場合は計測IDが必要 |

2〜4は仮のままでも公開できる。1は、microCMS を直せば翌朝までに反映される（すぐ反映したいときは 付録B）。

### 2-3. DNSの下準備（切り替えの1時間以上前。前日がおすすめ）

岩井さんがエックスサーバーの管理画面で行う。先方の立ち会いは要らない。

1. **今の設定を残す。** DNSレコード設定の一覧をスクリーンショットで保存する。切り戻しのときに見る。
2. **切り替えを早く効かせる準備をする。** `studioholiday.jp` と `www` の A レコードの TTL を 300（秒）に変える。TTL は「古い設定を覚えておく時間」で、今の値（通常 3600）のままだと、切り替えや切り戻しが行き渡るのに最大1時間かかる。
3. **GitHub でドメインの所有確認をする。** GitHub の右上のアイコン → Settings → Pages → 「Add a domain」に `studioholiday.jp` を入れる。表示された TXT レコード（名前は `_github-pages-challenge-iwai-ddndn`）をエックスサーバーのDNSに追加し、GitHub の画面で Verify を押す。他人にこのドメインを使われる事故を防ぐための手順。

---

## 3. 当日の手順（先方と同時に確認する）

通話やチャットをつないだまま進める。操作は岩井さん、確認は岩井さんと先方の両方で行う。

所要時間の目安は、手順Aを前日に済ませていれば30分〜1時間。当日にまとめて行う場合は、手順Aのあとに1時間ほど待つ。

### 手順A: メールを守る（サイトを切り替える前に必ず行う）

メールは「`studioholiday.jp` の A レコードが指すサーバー」に届く設定になっている。配送先を、エックスサーバーのサーバー名へ直接向け直す。

| # | 誰が | 何をする |
| --- | --- | --- |
| A-1 | 岩井さん | エックスサーバーのサーバーパネルで、サーバー名（`sv***.xserver.jp`）を確認する。SPF の記述からは `sv72.xserver.jp` と読めるが、管理画面で確かめる |
| A-2 | 岩井さん | DNSレコード設定で、MX の値を `studioholiday.jp` から A-1 のサーバー名に書き換える（優先度は 0 のまま） |
| A-3 | 岩井さん | SPF の TXT から `+a:studioholiday.jp` を消す。残すと、GitHub のサーバーをメールの送信元として認める記述になる |
| A-4 | 先方 | メールソフトの受信・送信サーバー名が `studioholiday.jp` になっている人は、A-1 のサーバー名に変える |
| A-5 | 先方 | 社外のアドレス（Gmail など）との間で、送信と受信を1通ずつ試す |

A-5 で送受信できれば次へ進む。当日に行う場合は、A-2 から1時間ほど置いてから A-5 を試す。古い設定が残っている間は、失敗が見えないため。

届かない場合は、MX を元の `studioholiday.jp` に戻して中止する。

### 手順B: 新サイトを本番用の設定にする

| # | 誰が | 何をする |
| --- | --- | --- |
| B-1 | 岩井さん | GitHub のリポジトリ `studio-holiday-web-prototype` → Settings → Secrets and variables → Actions → Variables で、`SITE_BASE_URL` を `https://studioholiday.jp`、`SITE_NOINDEX` を `off` にする |
| B-2 | 岩井さん | Actions → 「Deploy site to GitHub Pages」→ Run workflow を押し、成功（緑）を待つ。2〜3分かかる |

これで検索除けが外れ、シェア用のURLが `studioholiday.jp` になる。B-1 と B-2 は、Claude に頼めば代わりに実行できる。

### 手順C: ドメインを切り替える

| # | 誰が | 何をする |
| --- | --- | --- |
| C-1 | 岩井さん | リポジトリの Settings → Pages → Custom domain に `studioholiday.jp` を入れて Save を押す |
| C-2 | 岩井さん | エックスサーバーのDNSレコード設定で、下の表のとおり書き換える |
| C-3 | 岩井さん | Pages の画面で「DNS check successful」が出るのを待つ |
| C-4 | 岩井さん | 同じ画面の「Enforce HTTPS」にチェックを入れる。証明書の発行に数分〜1時間かかり、その間は https で警告が出ることがある |

書き換える内容:

| ホスト | 変更前 | 変更後 |
| --- | --- | --- |
| `studioholiday.jp` | A 202.226.37.33 | A レコードを4つ: 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153 |
| `www` | A 202.226.37.33 | A を消して、CNAME `iwai-ddndn.github.io` |

MX、TXT、`substack` には触らない。

### 手順D: 同時に確認する

| 確認すること | 岩井さん | 先方 |
| --- | --- | --- |
| `https://studioholiday.jp/` で新サイトが開き、鍵マークが付く | ○ | ○ |
| `www.studioholiday.jp` と `http://` が `https://studioholiday.jp/` へ転送される | ○ | |
| 事例・メンバーの詳細ページが開く | ○ | ○ |
| お問い合わせボタンから Google フォームが開く | ○ | ○ |
| スマホで表示が崩れない | ○ | ○ |
| メールを社外と送受信できる | | ○ |
| `https://substack.studioholiday.jp/` が今までどおり開く | ○ | |
| ページのソースに `noindex` が無く、`/robots.txt` が全許可になっている | Claude | |

先方の画面で旧サイトが出る場合は、古い設定がまだ残っている。数分待ってから再読み込みするか、スマホの回線（Wi-Fi を切る）で試す。

---

## 4. 切り戻し

表示やメールに問題が出たら、DNS を元に戻す。2-3 のスクリーンショットを見ながら行う。

1. `studioholiday.jp` の A レコード4つを消し、A 202.226.37.33 に戻す。
2. `www` の CNAME を消し、A 202.226.37.33 に戻す。
3. リポジトリの Settings → Pages → Custom domain を空にして Save を押す。

TTL を 300 にしてあれば、数分で旧サイトに戻る。WordPress とサーバー契約を残しておくのは、このため。

メールの MX（手順A）は、戻さなくてよい。エックスサーバーへ直接届く設定なので、サイトがどちらを向いていても届く。

---

## 5. 切り替えたあと

| いつ | 何をする |
| --- | --- |
| 当日 | Google Search Console に `https://studioholiday.jp/sitemap.xml` を送信する（所有確認の TXT はすでにある。誰のアカウントかを先方に確認） |
| 翌朝 | Actions の「Deploy site to GitHub Pages」が成功しているか見る（毎朝 6:45 に自動で動く） |
| 数日後 | 問題が無ければ、A レコードの TTL を元の値（3600）に戻す |
| 1〜2週間後 | 先方と相談して、旧 WordPress の扱いを決める |

旧サイトのURLについて: 記事URL（`/?p=123`）は新サイトの TOP が開く。画像の直リンク（`/wp-content/uploads/…`）は 404 になる。旧サイトはほぼ1ページなので、個別の転送設定は作らない。

---

## 6. 後日: 会社の GitHub への移管

会社の Organization ができたら行う。

1. リポジトリを Transfer する（`studio-holiday-web-prototype`、修正リストの `studio-holiday-web-feedback`、確認用の `studio-holiday-web-proposal-b`）。履歴と Issue は残る。
2. 移管先で、Pages の設定（Source と Custom domain）、Variables（`SITE_BASE_URL` と `SITE_NOINDEX`）、ワークフローの動作を確認する。
3. 移管先の Organization で、ドメインの所有確認をもう一度行う。
4. DNS の `www` の CNAME を `iwai-ddndn.github.io` から `<org名>.github.io` に書き換える。`studioholiday.jp` の A レコードは GitHub 共通の値なので変えない。
5. microCMS を会社の名義・支払いに移すかを決める。

---

## 付録A: 済んでいる準備（2026-11-25）

- 案Bのソースを `studio-holiday-web-prototype` の `main` に統合した。確認用リポジトリへ直接入っていた16件のPRも取り込み済み。
- 公開時のURLを整理した（`index-b.html` → `index.html`、`b/works/` → `works/`、`b/members/` → `members/`）。
- 表示と生成を microCMS の内容だけにした。ハッシュタグの「#」の重複も解消した。
- お問い合わせボタン（ヘッダー・フッター・CONTACT）を Google フォームへ向けた。
- `robots.txt`、`sitemap.xml`、`404.html`、OGP、canonical を入れた。
- GitHub Pages の公開を GitHub Actions に切り替えた。毎朝 6:45 に microCMS と Substack の最新で作り直して公開する。

## 付録B: 日々の運用

| やりたいこと | 方法 |
| --- | --- |
| microCMS の変更をすぐ反映する | Actions → 「Deploy site to GitHub Pages」→ Run workflow（放っておいても翌朝 6:45 に反映される） |
| デザインや文言を直す | `studio-holiday-web-prototype` の `main` に入れる。push すると自動で公開される。確認用リポジトリには直接入れない（二重管理になる） |
| 全ページを検査する | `python3 scripts/check_site.py _site`。microCMS との過不足、リンク切れ、「#」の重複、仮の文言を調べる |
| 確認用サイトを更新する | `sh scripts/deploy_proposal_b.sh` |

## 付録C: 事業ページを公開するとき

事業ページ3つ（DESIGN CONSULTING / FOOD DESIGN / COMMUNITY & SPACE）は、本番には出していない。ファイルはリポジトリに残っていて、確認用サイトでは見られる。

1. `design-process.html`、`food-design.html`、`community-space.html` を直す（FOOD DESIGN と COMMUNITY & SPACE の見出しには「（仮）」が残っている）。
2. 確認用サイトに出して確認する（`sh scripts/deploy_proposal_b.sh`）。
3. `scripts/build_site.py` の `HIDDEN_PAGES` から、公開するページの行を消す。
4. `main` に push する。ページが公開され、フッターのリンクも自動で戻る。

TOP の BUSINESS カードから事業ページへのリンクは、別に外してある（修正リスト #23）。戻す場合は `index-b.html` の BUSINESS カードを直す。
