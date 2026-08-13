/* ===== STUDIO HOLIDAY — explorable sticker-wall first view =====
 * 0721修正: ファーストビューをビューポートより広い「壁」（ワールド）にし、
 * ドラッグ/ホイールで上下左右に回遊できるようにした。
 *
 * イントロの流れ:
 *   1. 中央に「Design & Deploy Partner」（カメラは引きで、壁全体が見える）
 *   2. ステッカー・写真が順番に（ランダムな順で）貼られていく
 *   3. カメラが中央へズームイン（100%）
 *   4. 文字の上に STUDIO HOLIDAY のロゴが貼られる
 *   5. 自由に回遊できるようになる
 *   ※ クリックでスキップ可 / prefers-reduced-motion では即・完成状態
 *
 * クリック挙動:
 *   ステッカー → ポップアップ（アウトプット概要 + ストーリーへのリンク）
 *   写真       → 実際のK,D,C,,,記事
 *   ロゴ       → #about へ
 *
 * ステッカー画像は assets/stickers/works/*.png で管理する。
 * 実際のWorks画像から切り抜いた透過PNGに、白フチと落ち影をCanvasで焼き込む。
 */

const STICKER_DIR = './assets/stickers/';

/* Drive「Webサイト:事例集」由来の素材は assets/works/jirei/ に置く。
 * STICKER_DIR 起点の相対パスで参照する（../works/jirei/...）。
 * 紹介文はスプレッドシート「WORKS_Webサイト 事例集」の反映待ち（仮文言）。 */
const JIREI = '../works/jirei/';

/* work: クリック時のポップアップに出す実績情報 */
const STICKERS = [
  { file: JIREI + 'smeedy-pose04.png', alt: 'スミーディ',
    work: { kind: 'キャラクターデザイン', title: 'スミーディ', desc: '掲載事例 No.01。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'ai-interviewer-logo.jpg', alt: 'AI面接官',
    work: { kind: '事業開発・サービスロゴ', title: 'AI面接官', desc: '掲載事例 No.07。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'aburi-kikou.png', alt: '炙り紀行',
    work: { kind: 'グラフィック', title: '炙り紀行', desc: '掲載事例 No.08。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'kdc-logo.jpg', alt: 'K,D,C,,,',
    work: { kind: 'ロゴ・場の運営', title: 'K,D,C,,,', desc: '掲載事例 No.16。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'seiryu-okoshi-logo.png', alt: '清流おこし',
    work: { kind: 'ロゴ・ブランディング', title: '清流おこし', desc: '掲載事例 No.21。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'holiday-cola-logo.png', alt: '休日COLA',
    work: { kind: 'フード・ブランド開発', title: '休日COLA', desc: '掲載事例 No.27。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'holidaykun-hirune.png', alt: 'ホリデイくん（ひるね）',
    work: { kind: 'キャラクターデザイン', title: 'ホリデイくん', desc: '掲載事例 No.32。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'holidaykun-tozan.png', alt: 'ホリデイくん（とざん）',
    work: { kind: 'キャラクターデザイン', title: 'ホリデイくん', desc: '掲載事例 No.32。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'minna-gohankai-logo.png', alt: 'みんなでごはん会',
    work: { kind: 'ロゴ・イベント', title: 'みんなでごはん会', desc: '掲載事例 No.31。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: JIREI + 'juzan-asset1.png', alt: '十山ブランディング',
    work: { kind: 'ブランディング', title: '十山', desc: '掲載事例 No.06。紹介文はWORKSシート反映待ち（仮）。' } },
  { file: 'works/ebisun.png', alt: 'エビシー',
    work: { kind: 'キャラクターデザイン', title: 'エビシー', desc: '実際の制作実績から切り抜いたキャラクタービジュアルです。' } },
  { file: 'works/and-coffee-maison-kayser.png', alt: '&COFFEE MAISON KAYSER',
    work: { kind: 'ロゴ・ブランディング', title: '&COFFEE MAISON KAYSER', desc: '実際の制作実績から切り抜いたブランドロゴです。' } },
  { file: 'works/goichi-character.png', alt: 'GOICHI',
    work: { kind: 'キャラクター・グラフィック', title: 'GOICHI', desc: '実際の制作実績から切り抜いたキャラクタービジュアルです。' } },
  { file: 'works/ichiban-no-oshigoto.png', alt: 'いちばんのおしごと',
    work: { kind: 'パッケージ・イラストレーション', title: 'いちばんのおしごと', desc: '実際の制作実績から切り抜いたパッケージビジュアルです。' } },
  { file: 'works/monster-illustration.png', alt: 'モンスター・イラストレーション',
    work: { kind: 'イラストレーション', title: 'Monster Illustration', desc: '実際の制作実績から切り抜いたイラストレーションです。' } },
  { file: 'works/itomaki-ac-adapter.png', alt: 'itomaki AC Adapter',
    work: { kind: 'プロダクトデザイン', title: 'itomaki AC Adapter', desc: '実際の制作実績から切り抜いたプロダクトビジュアルです。' } },
  { file: 'works/holiday-cola.png', alt: '休日コーラ GINGER APPLE',
    work: { kind: 'フード・ブランド開発', title: '休日コーラ GINGER APPLE', desc: '実際の制作実績から切り抜いた商品ビジュアルです。' } },
  { file: 'yappy.png', alt: 'yappy',
    work: { kind: 'ロゴ・世界観', title: 'yappy', desc: 'スタジオホリデーの制作実績から生まれたロゴ・世界観です。' } },
  { file: 'works-pondelion.png', alt: 'ポン・デ・ライオン',
    work: { kind: 'キャラクターデザイン', title: 'ポン・デ・ライオン', desc: 'スタジオホリデーのキャラクターデザイン実績です。' } },
  { file: 'works-sushiro.png', alt: 'スシロー',
    work: { kind: 'ブランディング', title: 'スシロー', desc: 'スタジオホリデーのブランディング実績です。' } },
];

/* 社名ロゴ: イントロの最後に「Design & Deploy Partner」の上へ貼られる特別なステッカー。
 * 常に最前面・クリックで About へ */
const LOGO = { file: 'sh-logo.png', alt: 'STUDIO HOLIDAY', href: '#about' };

/* 実際のK,D,C,,,記事。画像もローカルに保持し、クリックで元記事を開く。 */
const PHOTOS = [
  { cap: '【イベント】台湾料理ワークショップ', img: './assets/articles/taiwan-workshop.jpg', emoji: '📷', href: 'https://kdc-foodlab.com/post/j-Dju3A8', external: true, bg: '#eefafa' },
  { cap: '【イベント】きくがわ応援大使交流会in　K,D,C,,,', img: './assets/articles/kikugawa-event.png', emoji: '📷', href: 'https://kdc-foodlab.com/post/UzQU7SgF', external: true, bg: '#eefafa' },
  { cap: '【会員情報】CACAO HUNTERS　特別イベント', img: './assets/articles/cacao-hunters.png', emoji: '📷', href: 'https://kdc-foodlab.com/post/COdVcAEz', external: true, bg: '#eefafa' },
  { cap: '【インタビュー】日本製を世界へ――地方から未来をつなぐルフィ株式会社の挑戦', img: './assets/articles/luffy-interview.jpg', emoji: '📷', href: 'https://kdc-foodlab.com/post/X1Kh8nm8', external: true, bg: '#eefafa' },
  { cap: 'ポン・デ・ライオン', img: './assets/works_pondelion01.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'スシロー', img: './assets/works_sushiro.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'エビシー', img: './assets/works/source/ebisun-osaka.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'いちばんのおしごと', img: './assets/works/source/ichiban-no-oshigoto.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'itomaki AC Adapter', img: './assets/works/source/itomaki-ac-adapter.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '休日コーラ GINGER APPLE', img: './assets/works/source/holiday-cola.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  /* ▼ Drive「Webサイト:事例集」掲載事例（紹介文はWORKSシート反映待ち） */
  { cap: 'うねり 企業ブランディング', img: './assets/works/jirei/uneri-ogp.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '十山ブランディング', img: './assets/works/jirei/juzan-photo1.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '採用ブランディング支援', img: './assets/works/jirei/recruit-branding-pc.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '「みんなで知りたい」シリーズ', img: './assets/works/jirei/minna-shiritai-1.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'yappy', img: './assets/works/jirei/yappy-a2-layout.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'K,D,C,,,', img: './assets/works/jirei/kdc-top-visual.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: 'K,D,C,,,meet クラフトシードル', img: './assets/works/jirei/craft-cidre.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '休日COLA', img: './assets/works/jirei/holiday-cola-top.png', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '休日COLA de お知らせ（2026夏）', img: './assets/works/jirei/holiday-cola-card.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
  { cap: '学際型メッシュネットワーク', img: './assets/works/jirei/mesh-network.jpg', emoji: '📷', href: './works.html', bg: '#eefafa' },
];

const genericWork = (alt) => ({
  kind: 'グラフィック（仮）',
  title: `${alt}（仮）`,
  desc: 'ここにアウトプットの概要が入ります。どんな依頼で、なにを考えてつくったか。実データが入るまでのダミーテキストです。（仮）',
});

const hero = document.getElementById('hero');
const world = document.getElementById('world');

const rand = (min, max) => min + Math.random() * (max - min);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* --- スプライト生成: 白フチ + 落ち影を一度だけ焼き込む --- */

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

async function loadArt(item) {
  try {
    const img = await loadImage(STICKER_DIR + item.file); // 本番PNG/JPG
    return trimTransparent(trimWhiteBackground(img));
  } catch {
    return null;
  }
}

/* 透過の余白をトリムして、絵柄ぴったりのcanvasにする。 */
function trimTransparent(art) {
  const w = art.naturalWidth || art.width;
  const h = art.naturalHeight || art.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(art, 0, 0);
  const d = ctx.getImageData(0, 0, w, h).data;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return art; // 全透過（ありえないが保険）

  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  if (minX === 0 && minY === 0 && cw === w && ch === h) return c; // 余白なし
  const out = document.createElement('canvas');
  out.width = cw; out.height = ch;
  out.getContext('2d').drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}

/* 透過を持たない画像（JPG・白背景PNG）は、外周から繋がる白背景を
 * 透明化して輪郭を作る。透過を持つ画像はそのまま返す。 */
function trimWhiteBackground(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  // 透過ピクセルが1つでもあれば、切り抜き済みとみなして何もしない
  for (let i = 3; i < d.length; i += 64) {
    if (d[i] < 250) return img;
  }

  const TH = 235; // これよりr,g,bすべて明るければ「背景の白」候補
  const isWhite = (p) => d[p] >= TH && d[p + 1] >= TH && d[p + 2] >= TH;
  const visited = new Uint8Array(w * h);
  const queue = [];
  // 外周の白ピクセルから流し込む（絵柄内部の白は残る）
  for (let x = 0; x < w; x++) { queue.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { queue.push(y * w, y * w + w - 1); }
  while (queue.length) {
    const px = queue.pop();
    if (visited[px]) continue;
    visited[px] = 1;
    if (!isWhite(px * 4)) continue;
    d[px * 4 + 3] = 0;
    const x = px % w, y = (px / w) | 0;
    if (x > 0) queue.push(px - 1);
    if (x < w - 1) queue.push(px + 1);
    if (y > 0) queue.push(px - w);
    if (y < h - 1) queue.push(px + w);
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

function makeDiecutSprite(art, artSize) {
  const ART = artSize || 520;       // 絵柄の描画サイズ（長辺）。ロゴ等の大判は高解像度で焼く
  const OUTLINE = ART * 0.045;      // 白フチの太さ
  const PAD = OUTLINE + ART * 0.07; // 白フチ+影のための余白

  const aw = art.naturalWidth || art.width;
  const ah = art.naturalHeight || art.height;
  const ratio = aw / ah;
  const dw = ratio >= 1 ? ART : ART * ratio;
  const dh = ratio >= 1 ? ART / ratio : ART;
  const SW = Math.round(dw + PAD * 2);
  const SH = Math.round(dh + PAD * 2);

  // 1) 絵柄のシルエットを全方向にずらして重ね、白で塗る → 輪郭に沿った白フチ台紙
  const silhouette = document.createElement('canvas');
  silhouette.width = SW; silhouette.height = SH;
  const sctx = silhouette.getContext('2d');
  for (const r of [OUTLINE, OUTLINE * 0.55]) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      sctx.drawImage(art, PAD + Math.cos(a) * r, PAD + Math.sin(a) * r, dw, dh);
    }
  }
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, SW, SH);

  // 2) 影付きで台紙を敷き、その上に絵柄を重ねる
  const out = document.createElement('canvas');
  out.width = SW; out.height = SH;
  const ctx = out.getContext('2d');
  // Figmaのeffect style「sticker-ds」準拠: X0 / Y4 / Blur6 / Spread0 / #000 8%
  // （Figma上のステッカー幅324pxを基準に、描画サイズへスケール）
  const FIG = ART / 324;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4 * FIG;
  ctx.shadowBlur = 6 * FIG;
  ctx.drawImage(silhouette, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.drawImage(art, PAD, PAD, dw, dh);
  return { url: out.toDataURL('image/png'), w: SW, h: SH };
}

let spritesPromise = null;
function getSprites() {
  spritesPromise ??= Promise.all(
    STICKERS.map(async (item) => {
      const art = await loadArt(item);
      return art && { alt: item.alt, work: item.work, ...makeDiecutSprite(art) };
    }),
  ).then((list) => list.filter(Boolean));
  return spritesPromise;
}

/* ロゴは Canvas 焼き込みではなく、白い台紙のDOM要素として貼る。
 * （Canvas 系はブラウザ差・画像ロード失敗で丸ごと消えるリスクがあるため。
 *   DOM なら画像が読めなくても白い台紙は必ず中央に出る） */

/* --- 配置: グリッド撒き → 反発シミュレーション ---
 * 壁の全セルにアイテムを撒く（絵柄の重複はOK）。
 * unit ≒ 100%ズーム時のステッカーの標準サイズ。グリッド間隔は
 * unit × PARAMS.gap で決まり、サイズと間隔を独立に調整できる。
 * 反発の停止距離 GAP=0.88 は「隣とわずかに隙間」の下限保証。
 * excl: 中央の「Design & Deploy Partner」の文字を空けておく楕円。
 */
function layoutStickers(W, H, unit, excl) {
  const cell = unit * PARAMS.gap; // グリッド間隔（＝ステッカー間の距離感）
  const cols = Math.max(3, Math.round(W / cell));
  const rows = Math.max(3, Math.round(H / cell));
  const cellW = W / cols;
  const cellH = H / rows;

  // 小さすぎるステッカーは作らず、中〜大の2段階だけにする
  const sizeFactor = () => {
    if (Math.random() < 0.25) return rand(1.3, 1.55); // 大（主役）
    return rand(1.0, 1.24);                            // 中
  };

  // 1) 全セルに撒く（壁の全面カバー）。ジッターで整列感は消す
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const size = unit * sizeFactor(); // サイズは間隔（gap）と独立
      items.push({
        x: c * cellW + cellW / 2 + rand(-cellW, cellW) * 0.28,
        y: r * cellH + cellH / 2 + rand(-cellH, cellH) * 0.28,
        size,
        minSize: size * 0.92,
      });
    }
  }

  // 2) 反発で押し広げる。均衡点＝隣とわずかに隙間が開いた状態
  const GAP = 0.88;
  for (let it = 0; it < 90; it++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const minD = ((a.size + b.size) / 2) * GAP;
        if (d < minD) {
          const push = (minD - d) / 2;
          a.x -= (dx / d) * push; a.y -= (dy / d) * push;
          b.x += (dx / d) * push; b.y += (dy / d) * push;
          // 3) 押し合いが収束しない密集地帯はサイズを縮めて逃がす
          if (it > 55) {
            a.size = Math.max(a.minSize, a.size * 0.99);
            b.size = Math.max(b.minSize, b.size * 0.99);
          }
          moved = true;
        }
      }
    }
    for (const p of items) {
      // 中央の文字エリア（楕円）から押し出す
      const rx = excl.rx + p.size * 0.45, ry = excl.ry + p.size * 0.45;
      const ex = (p.x - excl.cx) / rx, ey = (p.y - excl.cy) / ry;
      const d = Math.hypot(ex, ey);
      if (d < 1) {
        const f = 1 / (d || 0.001);
        p.x = excl.cx + ex * f * rx;
        p.y = excl.cy + ey * f * ry;
      }
      // 壁の内側にクランプ（端は少しだけ見切れてよい）
      const inset = p.size * 0.42;
      p.x = Math.min(W - inset, Math.max(inset, p.x));
      p.y = Math.min(H - inset, Math.max(inset, p.y));
    }
    if (!moved) break;
  }
  return items;
}

/* 各絵柄を必ず2枚、約半数だけ3枚にして、同一絵柄の出現を2〜3枚に制限する */
function artSequence(sprites) {
  const seq = sprites.flatMap((sprite) => {
    const copies = Math.random() < 0.5 ? 2 : 3;
    return Array.from({ length: copies }, () => sprite);
  });
  return shuffle(seq);
}

/* 表示枚数が少ないほど中央寄りの狭い候補だけを残し、寂しい散らばりを防ぐ。
 * 枚数が増えれば候補数も増えるため、自然に外側へ広がる。 */
function centralSpotPool(candidates, count, focus) {
  const extraSpots = Math.max(6, Math.ceil(Math.sqrt(count) * 1.5));
  const poolSize = Math.min(candidates.length, count + extraSpots);
  return candidates
    .map((p) => ({
      p,
      score: Math.hypot(
        (p.x - focus.cx) / focus.rx,
        (p.y - focus.cy) / focus.ry,
      ) + rand(0, 0.04),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, poolSize)
    .map(({ p }) => p);
}

/* 候補の中から、写真と他ステッカーからできるだけ離れた配置点を順に選ぶ */
function selectDistributedSpots(candidates, count, avoid = []) {
  const pool = shuffle(candidates);
  const anchors = avoid.slice();
  const selected = [];

  while (pool.length && selected.length < count) {
    let bestIndex = 0;
    let bestDistance = -1;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const nearest = anchors.length
        ? Math.min(...anchors.map((q) => Math.hypot(p.x - q.x, p.y - q.y)))
        : 0;
      if (nearest > bestDistance) {
        bestDistance = nearest;
        bestIndex = i;
      }
    }
    const [picked] = pool.splice(bestIndex, 1);
    selected.push(picked);
    anchors.push(picked);
  }
  return selected;
}

/* 同じ絵柄のコピー同士ができるだけ離れるように、絵柄→スポットを割り当てる。
 * 各絵柄の1枚目はランダムなスポット、2枚目以降は「同じ絵柄の既配置」から
 * 最も遠い残りスポットを選ぶ（他の絵柄との距離は問わない）。 */
function assignArtsToSpots(arts, spots) {
  const remaining = spots.slice();
  const placedByArt = new Map();
  const assignments = [];
  for (const sprite of arts) {
    if (!remaining.length) break;
    const placed = placedByArt.get(sprite) || [];
    let bestI = 0;
    let bestD = -1;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const d = placed.length
        ? Math.min(...placed.map((q) => Math.hypot(p.x - q.x, p.y - q.y)))
        : rand(0, 1); // 1枚目はランダム選択
      if (d > bestD) { bestD = d; bestI = i; }
    }
    const [spot] = remaining.splice(bestI, 1);
    assignments.push({ sprite, spot });
    placed.push(spot);
    placedByArt.set(sprite, placed);
  }
  return assignments;
}

/* opts.size は長辺のサイズ。スプライトの縦横比に合わせて要素の幅高を決める */
function stickerDims(sprite, size) {
  return sprite.w >= sprite.h
    ? { w: size, h: size * (sprite.h / sprite.w) }
    : { w: size * (sprite.w / sprite.h), h: size };
}

function buildSticker(sprite, opts) {
  const el = document.createElement(opts.href ? 'a' : 'div');
  if (opts.href) el.href = opts.href;
  el.className = 'sticker' + (opts.cls ? ' ' + opts.cls : '');
  el.style.setProperty('--tf', `rotate(${opts.rot}deg)`);
  const { w, h } = stickerDims(sprite, opts.size);
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.left = opts.x + 'px';
  el.style.top = opts.y + 'px';
  el.style.zIndex = opts.z;

  const img = document.createElement('img');
  img.alt = sprite.alt;
  img.draggable = false;
  img.src = sprite.url;
  el.appendChild(img);

  if (opts.onOpen) {
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.addEventListener('click', opts.onOpen);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onOpen(); }
    });
  }

  if (opts.pop) {
    el.style.animationDelay = opts.delay + 's';
    el.classList.add('is-popping');
    el.addEventListener('animationend', () => el.classList.remove('is-popping'), { once: true });
  }
  return el;
}

function buildPhoto(data, opts) {
  const el = document.createElement('a');
  el.className = 'photo-card';
  el.href = data.href;
  if (data.external) { el.target = '_blank'; el.rel = 'noopener'; }
  el.style.setProperty('--tf', `rotate(${opts.rot}deg)`);
  el.style.width = opts.w + 'px';
  el.style.left = opts.x + 'px';
  el.style.top = opts.y + 'px';
  el.style.zIndex = opts.z;
  el.innerHTML =
    `<span class="photo-img" style="background:${data.bg}"><span class="photo-emoji">${data.emoji}</span></span>` +
    `<span class="photo-cap">${data.cap}${data.external ? ' ↗' : ''}</span>`;
  if (data.img) {
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.draggable = false;
    img.src = data.img;
    img.onerror = () => img.remove(); // 読めなければ絵文字+グラデのまま
    el.querySelector('.photo-img').appendChild(img);
  }
  if (opts.pop) {
    el.style.animationDelay = opts.delay + 's';
    el.classList.add('is-popping');
    el.addEventListener('animationend', () => el.classList.remove('is-popping'), { once: true });
  }
  return el;
}

/* ==========================================================
   ▼ ポップアップ（ステッカー → アウトプット概要 + ストーリー）
   ========================================================== */

const modal = document.getElementById('workModal');

function openModal(work, imgURL) {
  document.getElementById('modalImg').src = imgURL;
  document.getElementById('modalKind').textContent = work.kind;
  document.getElementById('modalTitle').textContent = work.title;
  document.getElementById('modalDesc').textContent = work.desc;
  modal.hidden = false;
}
function closeModal() { modal.hidden = true; }

modal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

/* ==========================================================
   ▼ カメラ（回遊）: world を translate+scale して壁の上を動き回る
   ========================================================== */

let vw = 0, vh = 0, worldW = 0, worldH = 0;

/* --- 配置・カメラの調整パラメータ ---
 * URLに ?tune を付けるとスライダーで live 調整できる（localStorageに保存され、
 * 以降は ?tune なしでもその値で表示。リセットボタンで初期値に戻る）。 */
const DEFAULT_PARAMS = {
  world: 3.9,     // 壁の広さ = ビューポートの何倍四方を探索できるか
  size: 1.2,      // ステッカーの大きさ倍率
  gap: 1.25,      // ステッカー間隔（1でほぼ密着）
  introView: 1.6, // 引きのカメラで見える範囲（ビューポート比）。壁全体は見せなくてよい
  fvBg: '#ececec',          // FVの背景色（本番デフォルト: ライトグレー）
  fvTexture: 'halftone',    // FVのテクスチャ（本番デフォルト: アナログハーフトーン）
  fvTexColor: '#dff5f7',    // テクスチャの色（方眼の線・ドット等。halftoneでは無効）
  fvTexSize: 24,            // テクスチャの細かさ（px。halftoneではタイル幅の倍率）
};
let PARAMS = { ...DEFAULT_PARAMS };
try { Object.assign(PARAMS, JSON.parse(localStorage.getItem('sh-tune')) || {}); } catch { /* 保存なし */ }
// 2026-08: FVデフォルトをアナログハーフトーンに変更。
// 保存済みの旧テクスチャ設定を一度だけ新デフォルトへ移行する（他のチューニング値は維持）
try {
  const stored = JSON.parse(localStorage.getItem('sh-tune')) || {};
  if (!stored.htMigrated) {
    stored.fvTexture = DEFAULT_PARAMS.fvTexture;
    stored.fvBg = DEFAULT_PARAMS.fvBg;
    stored.fvTexSize = DEFAULT_PARAMS.fvTexSize;
    stored.htMigrated = 1;
    localStorage.setItem('sh-tune', JSON.stringify(stored));
    Object.assign(PARAMS, stored);
  }
} catch { /* 保存なし */ }
PARAMS.size = Math.max(0.95, PARAMS.size);
// 旧パラメータ（fvGrid: 0/1）からの引き継ぎ
if (PARAMS.fvGrid === 1 && !('fvTexture' in (JSON.parse(localStorage.getItem('sh-tune') || '{}')))) {
  PARAMS.fvTexture = 'grid';
}
delete PARAMS.fvGrid;

/* FVの背景テクスチャ: 色(c)とサイズ(s)を受け取り、
 * background-image / background-size を返す。すべてCSSグラデーション
 * （＋SVGノイズ）で生成し、画像ファイルは使わない */
const FV_TEXTURES = {
  none:  { label: 'なし', css: () => ({ image: 'none', size: 'auto' }) },
  halftone: { label: 'ハーフトーン（アナログ紙）', css: (c, s) => ({
    // 印刷の網点をスキャンしたようなノイズ画像タイル。色は画像に焼き込み済みでcは無効。
    // s(px)はタイル表示幅の係数: デフォルト24 → 720px幅で敷き詰め
    image: 'url("./assets/texture-halftone.png")',
    size: `${Math.round(s * 30)}px auto` }) },
  grid:  { label: '方眼', css: (c, s) => ({
    image: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
    size: `${s}px ${s}px` }) },
  dots:  { label: 'ドット', css: (c, s) => ({
    image: `radial-gradient(${c} 1.5px, transparent 1.6px)`,
    size: `${s}px ${s}px` }) },
  lines: { label: '横罫線（ノート）', css: (c, s) => ({
    image: `linear-gradient(${c} 1px, transparent 1px)`,
    size: `100% ${s}px` }) },
  diag:  { label: '斜めストライプ', css: (c, s) => ({
    image: `repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${s}px)`,
    size: 'auto' }) },
  paper: { label: '紙（ノイズ）', css: () => ({
    image: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter><rect width="180" height="180" filter="url(#n)"/></svg>')}")`,
    size: '180px 180px' }) },
};

/* FVの背景色・テクスチャをCSS変数へ反映（再ビルド不要・即時反映） */
function applyFvParams() {
  const root = document.documentElement.style;
  root.setProperty('--fv-bg', PARAMS.fvBg);
  const tex = FV_TEXTURES[PARAMS.fvTexture] || FV_TEXTURES.none;
  const { image, size } = tex.css(PARAMS.fvTexColor, PARAMS.fvTexSize);
  root.setProperty('--fv-texture', image);
  root.setProperty('--fv-texture-size', size);
}
applyFvParams();

const cam = { cx: 0, cy: 0, s: 1 };      // (cx,cy)=ビューポート中央に映る壁上の点

function applyCam() {
  const tx = vw / 2 - cam.cx * cam.s;
  const ty = vh / 2 - cam.cy * cam.s;
  world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${cam.s})`;
}
function clampCam() {
  const hw = vw / (2 * cam.s), hh = vh / (2 * cam.s);
  cam.cx = Math.min(worldW - hw, Math.max(hw, cam.cx));
  cam.cy = Math.min(worldH - hh, Math.max(hh, cam.cy));
}

/* --- パン操作（ドラッグ / ホイール） --- */

let mode = 'loading'; // 'loading' | 'intro' | 'zooming' | 'explore'
let pdown = null;
let didDrag = false;

hero.addEventListener('pointerdown', (e) => {
  if (mode === 'intro' || mode === 'zooming') { skipIntro(); return; }
  if (mode !== 'explore' || e.button !== 0) return;
  pdown = { x: e.clientX, y: e.clientY, cx: cam.cx, cy: cam.cy, id: e.pointerId };
  didDrag = false;
});
window.addEventListener('pointermove', (e) => {
  if (!pdown || e.pointerId !== pdown.id) return;
  const dx = e.clientX - pdown.x, dy = e.clientY - pdown.y;
  if (!didDrag && Math.hypot(dx, dy) > 6) {
    didDrag = true;
    hero.classList.add('is-panning');
  }
  if (didDrag) {
    cam.cx = pdown.cx - dx / cam.s;
    cam.cy = pdown.cy - dy / cam.s;
    clampCam();
    applyCam();
  }
});
window.addEventListener('pointerup', (e) => {
  if (!pdown || e.pointerId !== pdown.id) return;
  pdown = null;
  hero.classList.remove('is-panning');
});
// ドラッグ直後の click は「クリック」として扱わない（リンク遷移・ポップアップを抑止）
window.addEventListener('click', (e) => {
  if (didDrag) {
    e.preventDefault();
    e.stopPropagation();
    didDrag = false;
  }
}, true);

/* ホイール/トラックパッドはページスクロールに使う（壁のパンはドラッグ専用）。
 * 「scrollで本編に行ける」を分かりやすくするため、壁はホイールを奪わない。 */

/* ==========================================================
   ▼ イントロ → 回遊 の進行
   ========================================================== */

const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };

let logoPlaced = false;

function placeLogo(pop) {
  if (logoPlaced) return;
  logoPlaced = true;
  // Figmaの白い台紙比率を保ちつつ、画面中央に収まるサイズへ。
  // 貼られる順番・クリック挙動・カメラ制御は従来どおり。
  const w = Math.min(vw < 560 ? 260 : 374, vw * 0.72);
  const h = w * 0.55;

  const el = document.createElement('a');
  el.href = LOGO.href;
  el.className = 'sticker sticker-logo logo-plate';
  el.style.setProperty('--tf', `rotate(${rand(-3, 3)}deg)`);
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.left = (worldW / 2 - w / 2) + 'px';
  el.style.top = (worldH / 2 - h / 2) + 'px';
  el.style.zIndex = 1090;
  el.style.borderRadius = (h * 0.12) + 'px';
  const img = document.createElement('img');
  img.src = STICKER_DIR + LOGO.file;
  img.alt = LOGO.alt;
  img.draggable = false;
  el.appendChild(img);
  if (pop) {
    el.classList.add('is-popping');
    el.addEventListener('animationend', () => el.classList.remove('is-popping'), { once: true });
  }
  world.appendChild(el);
}

function startZoom() {
  mode = 'zooming';
  world.classList.add('is-zooming');
  // rAF はタブ非表示時に発火しないため使わない。リフローで
  // クラス変更（transition有効化）を確定させてから transform を変える
  void world.offsetWidth;
  cam.s = 1;
  clampCam();
  applyCam();
  later(finishZoom, 1550); // CSS transition 1.45s + 余裕
}

async function finishZoom() {
  world.classList.remove('is-zooming');
  await placeLogo(true);
  later(enableExplore, 550);
}

function enableExplore() {
  mode = 'explore';
  hero.classList.remove('is-intro');
  hero.classList.add('can-pan');
}

async function skipIntro() {
  clearTimers();
  world.classList.remove('is-zooming');
  world.style.transition = 'none';
  cam.s = 1;
  cam.cx = worldW / 2;
  cam.cy = worldH / 2;
  clampCam();
  applyCam();
  void world.offsetWidth; // transition:none をこのフレームで確定させる
  world.style.transition = '';
  await placeLogo(false);
  enableExplore();
}

async function build({ intro }) {
  world.querySelectorAll('.sticker, .photo-card').forEach((el) => el.remove());
  logoPlaced = false;
  clearTimers();

  vw = hero.clientWidth || window.innerWidth;
  vh = hero.clientHeight || window.innerHeight;
  worldW = Math.round(vw * PARAMS.world);
  worldH = Math.round(vh * PARAMS.world);
  world.style.width = worldW + 'px';
  world.style.height = worldH + 'px';

  // カメラはスプライト生成（重い・数秒かかる）を待たずに先に構える。
  // 後回しにすると、ロード中に「未初期化の壁」（左上に巨大な文字）が見えてしまう
  mode = 'loading';
  cam.cx = worldW / 2;
  cam.cy = worldH / 2;
  if (intro) {
    hero.classList.add('is-intro');
    hero.classList.remove('can-pan');
    // 引きの画: 中央の introView×ビューポート分だけ見せる（壁全体は見せなくてよい）
    cam.s = Math.max(vw / worldW, 1 / PARAMS.introView);
  } else {
    cam.s = 1;
  }
  applyCam();

  const sprites = await getSprites();

  // 中央の文字エリアを空けて、壁の全面にステッカー + 写真を撒く
  const base = vw < 560 ? 150 : vw < 900 ? 190 : 235;
  const unit = base * PARAMS.size;
  const excl = { cx: worldW / 2, cy: worldH / 2, rx: vw * 0.40, ry: vh * 0.28 };
  const spots = layoutStickers(worldW, worldH, unit, excl);

  // 写真のスポットは互いに離れた場所を選ぶ（足りなければ余りから充当）
  const minPhotoDist = Math.min(worldW, worldH) / 3.5;
  const photoSpots = [];
  const shuffled = shuffle(spots);
  for (const p of shuffled) {
    if (photoSpots.length >= PHOTOS.length) break;
    if (photoSpots.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= minPhotoDist)) {
      photoSpots.push(p);
    }
  }
  for (const p of shuffled) {
    if (photoSpots.length >= PHOTOS.length) break;
    if (!photoSpots.includes(p)) photoSpots.push(p);
  }
  const availableStickerSpots = spots.filter((p) => !photoSpots.includes(p));
  const arts = artSequence(sprites);
  const centralStickerSpots = centralSpotPool(availableStickerSpots, arts.length, {
    cx: worldW / 2,
    cy: worldH / 2,
    rx: vw,
    ry: vh,
  });
  const stickerSpots = selectDistributedSpots(centralStickerSpots, arts.length, photoSpots);
  const total = stickerSpots.length + photoSpots.length;

  // 貼られる順番: 全アイテムをシャッフルして、順番に（＝ランダムな順で）ペタペタ
  const PASTE_SEC = 1.9;
  const order = shuffle([...Array(total).keys()]);
  const delayOf = (i) => (order[i] / total) * PASTE_SEC;
  const zOrder = shuffle([...Array(total).keys()]);

  // 同じ絵柄が近くに固まらないよう、絵柄→スポットを距離最大化で割り当てる
  const assignments = assignArtsToSpots(arts, stickerSpots);
  assignments.forEach(({ sprite, spot: p }, i) => {
    const { w, h } = stickerDims(sprite, p.size);
    world.appendChild(buildSticker(sprite, {
      rot: rand(-16, 16),
      size: p.size,
      x: p.x - w / 2,
      y: p.y - h / 2,
      z: zOrder[i] + 1,
      pop: intro,
      delay: delayOf(i),
      onOpen: () => openModal(sprite.work || genericWork(sprite.alt), sprite.url),
    }));
  });

  photoSpots.forEach((p, i) => {
    const w = p.size * 1.15;
    world.appendChild(buildPhoto(PHOTOS[i % PHOTOS.length], {
      rot: rand(-7, 7),
      w,
      x: p.x - w / 2,
      y: p.y - w * 0.62,
      z: zOrder[stickerSpots.length + i] + 1,
      pop: intro,
      delay: delayOf(stickerSpots.length + i),
    }));
  });

  if (!intro) {
    placeLogo(false);
    enableExplore();
    return;
  }

  mode = 'intro';
  later(startZoom, 300 + PASTE_SEC * 1000); // 貼り終わりを見せてからズーム
}

/* ==========================================================
   ▼ 調整デモ: URLに ?tune を付けるとスライダーが出る
   （値は localStorage に保存。リセットで初期値に戻る）
   ========================================================== */

function initTunePanel() {
  if (!/[?&]tune\b/.test(location.search)) return;
  const DEFS = [
    ['world', '壁の広さ（探索範囲）', 1.5, 6, 0.1],
    ['size', 'ステッカーの大きさ', 0.95, 2.5, 0.05],
    ['gap', 'ステッカーの間隔', 1.0, 2.5, 0.05],
    ['introView', '引きで見える範囲', 1.2, 6, 0.1],
  ];
  const panel = document.createElement('div');
  panel.className = 'tune-panel';
  panel.innerHTML =
    '<strong>配置の調整デモ</strong>' +
    DEFS.map(([k, label]) =>
      `<label>${label}<output id="tune-${k}"></output><input type="range" data-key="${k}" /></label>`
    ).join('') +
    '<label>FVの背景色<input type="color" data-key="fvBg" /></label>' +
    '<label>テクスチャ<select data-key="fvTexture">' +
      Object.entries(FV_TEXTURES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('') +
    '</select></label>' +
    '<label>テクスチャの色<input type="color" data-key="fvTexColor" /></label>' +
    '<label>テクスチャの細かさ<output id="tune-fvTexSize"></output><input type="range" data-key="fvTexSize" min="8" max="64" step="1" /></label>' +
    '<div class="tune-actions">' +
    '<button type="button" data-act="intro">イントロ再生</button>' +
    '<button type="button" data-act="reset">リセット</button></div>';
  document.body.appendChild(panel);

  DEFS.forEach(([k, , min, max, step]) => {
    Object.assign(panel.querySelector(`[data-key="${k}"]`), { min, max, step });
  });
  const sync = () => {
    DEFS.forEach(([k]) => {
      panel.querySelector(`[data-key="${k}"]`).value = PARAMS[k];
      panel.querySelector(`#tune-${k}`).textContent = '×' + Number(PARAMS[k]).toFixed(2);
    });
    panel.querySelector('[data-key="fvBg"]').value = PARAMS.fvBg;
    panel.querySelector('[data-key="fvTexture"]').value = PARAMS.fvTexture;
    panel.querySelector('[data-key="fvTexColor"]').value = PARAMS.fvTexColor;
    panel.querySelector('[data-key="fvTexSize"]').value = PARAMS.fvTexSize;
    panel.querySelector('#tune-fvTexSize').textContent = PARAMS.fvTexSize + 'px';
  };
  sync();

  let debounce;
  panel.addEventListener('input', (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    if (k === 'fvBg' || k === 'fvTexture' || k === 'fvTexColor') {
      PARAMS[k] = e.target.value;
    } else {
      PARAMS[k] = +e.target.value;
    }
    localStorage.setItem('sh-tune', JSON.stringify(PARAMS));
    sync();
    if (k.startsWith('fv')) { applyFvParams(); return; } // 背景系は再ビルド不要
    clearTimeout(debounce);
    debounce = setTimeout(() => build({ intro: false }), 250);
  });
  panel.addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (act === 'intro') build({ intro: true });
    if (act === 'reset') {
      PARAMS = { ...DEFAULT_PARAMS };
      localStorage.removeItem('sh-tune');
      sync();
      applyFvParams();
      build({ intro: false });
    }
  });
}

initTunePanel();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
build({ intro: !reducedMotion }).then(() => {
  if (reducedMotion) skipIntro();
});

window.addEventListener('resize', () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(() => build({ intro: false }), 200);
});
