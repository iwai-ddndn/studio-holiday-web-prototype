# microCMS セットアップ手順

FVのステッカー事例（タグ・詳細ドロワー含む）と、左端のニュースレター電光掲示板を
microCMSから管理できるようにしてあります。

- **未設定でも動きます**: `cms-config.js` が空の間は、これまで通り `main.js` 内の
  フォールバックデータ（`FALLBACK_STICKERS`）で表示されます。
- CMSの取得に失敗した場合（障害・キー間違い・画像リンク切れ等）も、自動的に
  フォールバックへ切り替わります（コンソールに warn が出ます）。

## 1. サービスを作る

1. https://microcms.io/ でアカウント作成 → サービスを新規作成
2. サービスID（`xxxx.microcms.io` の `xxxx`）を控える

## 2. API を2つ作る

### works（事例 → FVのステッカー）

- API名: `事例` / エンドポイント: **works** / 型: **リスト形式**

| フィールドID | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `title` | アウトプット名 | テキストフィールド | ✔ |
| `kind` | ジャンル | テキストフィールド | ✔ |
| `client` | クライアント名 | テキストフィールド | – |
| `description` | 概要 | テキストエリア | ✔ |
| `body` | 詳細記事本文 | リッチエディタ | – |
| `sticker` | ステッカー画像 | 画像 | –（任意にすること） |

- `sticker` は **背景を切り抜いた透過PNG** を推奨（白背景JPGでも自動で白を抜きますが精度は落ちます）
- **`sticker` は必須にしないでください。** 画像が未添付の場合、フロント側がタイトルと
  リポジトリ内のローカル素材を突き合わせて自動で画像を紐付けます（メディアアップロードAPIが
  使えないプランでもテキストだけCMS管理できるようにするための仕組み）
- `client` / `kind` / `title` がそのまま hover時の `#タグ` になります
- `title` はフッターの WORKs 一覧（全ページ共通）にも先頭6件が反映されます
- `body` を入れると、ステッカークリック時のドロワーに記事として表示されます（未入力なら概要のみ）

### newsletter（廃止 → Substack自動連携に変更）

電光掲示板は **microCMSではなくSubstackのRSSから自動取得** します。手動更新は不要です。
microCMSに `newsletter` API を作っていた場合は削除して構いません。

仕組み:
1. GitHub Actions（`.github/workflows/newsletter-sync.yml`）が毎日 JST 6:00 に
   `https://substack.studioholiday.jp/feed` を取得し、`data/newsletter.json` を更新してコミット
   （Actionsタブから手動実行も可能）
2. サイトは `data/newsletter.json` を読み込み、タイトルを電光掲示板に表示。
   **タイトルクリックで該当記事に遷移** します
3. JSONが読めない場合はフィード直接取得を試し、それも失敗したらHTML内の仮タイトルを表示

## 3. APIキーを作って設定する

1. microCMS管理画面 → 「APIキー」→ **GET のみ許可**のキーを作成
   （デフォルトキーをそのまま使う場合も、権限がGETだけになっているか確認）
2. リポジトリ直下の [cms-config.js](./cms-config.js) に記入:

```js
window.MICROCMS_CONFIG = {
  serviceDomain: 'xxxx',      // サービスID
  apiKey: 'XXXXXXXXXXXX',     // GET専用APIキー
};
```

3. ローカルで開いて、FVのステッカーがCMSの内容に変わればOK

## 補足

- キーはフロントに埋め込まれるため**必ずGET専用**にすること（公開コンテンツの参照のみ）
- 画像はmicroCMSのimgix経由で `?w=1000&fm=png` に変換して読み込みます（転送量対策・透過保持）
- 取得は各エンドポイント `limit=100`・タイムアウト4秒。それを超える件数を使う場合は
  `main.js` の `fetchCMS()` にページネーションを足してください
