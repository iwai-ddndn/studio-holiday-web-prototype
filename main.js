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
 *   写真       → 外部ページ or サイト内記事（仮リンク）
 *   ロゴ       → #about へ
 *
 * ステッカー画像は assets/stickers/*.png で管理する（透過PNG推奨・目安400px角）。
 * 同名のPNGがまだ置かれていない間は、各エントリの ph（SVGプレースホルダー）に
 * 自動でフォールバックして表示する。白フチと落ち影はCanvasでスプライトに焼き込む。
 */

const STICKER_DIR = './assets/stickers/';
const K = '#2a2622'; // キーライン（濃い輪郭）

/* work: クリック時のポップアップに出す内容。無いものは汎用の仮テキストになる */
const STICKERS = [
  { file: 'star.png', alt: 'にっこり星', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 6 61 38 95 38 67 58 78 92 50 71 22 92 33 58 5 38 39 38Z" fill="#ffb800" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><circle cx="41" cy="55" r="3.5" fill="${K}"/><circle cx="59" cy="55" r="3.5" fill="${K}"/><path d="M42 64 Q50 72 58 64" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/></svg>` },
  { file: 'cat.png', alt: 'ねこ', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 26 30 48 22 52Z M80 26 70 48 78 52Z" fill="#ff8a5b" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="58" r="34" fill="#ff8a5b" stroke="${K}" stroke-width="5"/><circle cx="40" cy="54" r="4" fill="${K}"/><circle cx="60" cy="54" r="4" fill="${K}"/><path d="M50 62 45 68 55 68Z" fill="${K}"/><path d="M50 68 V74 M32 60 H20 M32 66 H22 M68 60 H80 M68 66 H78" stroke="${K}" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>` },
  { file: 'ghost.png', alt: 'おばけ', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25 46a25 25 0 0 1 50 0v40l-8-8-8 8-9-8-9 8-8-8Z" fill="#a855f7" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><circle cx="42" cy="46" r="5" fill="#fff" stroke="${K}" stroke-width="3"/><circle cx="60" cy="46" r="5" fill="#fff" stroke="${K}" stroke-width="3"/><circle cx="42" cy="47" r="2" fill="${K}"/><circle cx="60" cy="47" r="2" fill="${K}"/><ellipse cx="51" cy="60" rx="4" ry="6" fill="${K}"/></svg>` },
  { file: 'heart.png', alt: 'ハート', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 84C18 60 16 34 34 26c10-4 16 2 16 8 0-6 6-12 16-8 18 8 16 34-16 58Z" fill="#ff5964" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M40 40 Q44 34 48 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>` },
  { file: 'bolt.png', alt: 'いなずま', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M58 6 26 56 46 56 40 94 76 40 54 40Z" fill="#facc15" stroke="${K}" stroke-width="5" stroke-linejoin="round"/></svg>` },
  { file: 'rainbow-cloud.png', alt: 'レインボー雲', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M18 62a20 20 0 0 1 12-34 22 22 0 0 1 42 6 16 16 0 0 1 6 28Z" fill="#7dd3fc" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M28 70q22 -20 44 0" fill="none" stroke="#ff5964" stroke-width="6" stroke-linecap="round"/><path d="M32 78q18 -16 36 0" fill="none" stroke="#ffb800" stroke-width="6" stroke-linecap="round"/><path d="M36 86q14 -12 28 0" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/></svg>` },
  { file: 'flower.png', alt: '花', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#ec4899" stroke="${K}" stroke-width="5"><circle cx="50" cy="26" r="14"/><circle cx="74" cy="50" r="14"/><circle cx="50" cy="74" r="14"/><circle cx="26" cy="50" r="14"/></g><circle cx="50" cy="50" r="15" fill="#facc15" stroke="${K}" stroke-width="5"/></svg>` },
  { file: 'planet.png', alt: '惑星', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="26" fill="#3b82f6" stroke="${K}" stroke-width="5"/><ellipse cx="50" cy="50" rx="44" ry="14" fill="none" stroke="${K}" stroke-width="5" transform="rotate(-20 50 50)"/><circle cx="42" cy="44" r="5" fill="#93c5fd"/><circle cx="58" cy="56" r="7" fill="#93c5fd"/></svg>` },
  { file: 'speech-bubble.png', alt: 'ふきだし', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 22h60a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H44l-16 16 2-16h-10a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8Z" fill="#22c55e" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M50 34 V54 M50 60 v2" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>` },
  { file: 'robot.png', alt: 'ロボット', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 V22" stroke="${K}" stroke-width="4"/><circle cx="50" cy="8" r="4" fill="#ff5964" stroke="${K}" stroke-width="3"/><rect x="24" y="24" width="52" height="46" rx="12" fill="#06b6d4" stroke="${K}" stroke-width="5"/><circle cx="40" cy="46" r="6" fill="#fff" stroke="${K}" stroke-width="3"/><circle cx="60" cy="46" r="6" fill="#fff" stroke="${K}" stroke-width="3"/><path d="M40 60 h20" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M24 74 h52 v6 a6 6 0 0 1-6 6 H30 a6 6 0 0 1-6-6Z" fill="#0891b2" stroke="${K}" stroke-width="5" stroke-linejoin="round"/></svg>` },
  { file: 'flame.png', alt: 'ほのお', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 8c14 18 26 22 26 42a26 26 0 0 1-52 0c0-12 8-16 12-24 4 8 0 14 6 14 6 0 4-18 8-32Z" fill="#f97316" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M50 84a12 12 0 0 0 12-12c0-8-6-10-12-18-6 8-12 10-12 18a12 12 0 0 0 12 12Z" fill="#facc15"/></svg>` },
  { file: 'gem.png', alt: 'ジェム', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M32 24h36l18 22-36 44-36-44Z" fill="#14b8a6" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M14 46h72M32 24 50 46 68 24M50 46 50 90" fill="none" stroke="${K}" stroke-width="4"/><path d="M32 24 50 46 68 24" fill="#5eead4"/></svg>` },
  { file: 'monster.png', alt: 'もじゃ怪獣', ph: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M22 50a28 28 0 0 1 56 0c0 22-12 34-28 34S22 72 22 50Z" fill="#9b5de5" stroke="${K}" stroke-width="5"/><path d="M22 50 12 42M30 34 24 24M50 24 50 12M70 34 76 24M78 50 88 42" stroke="${K}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="48" r="10" fill="#fff" stroke="${K}" stroke-width="4"/><circle cx="50" cy="48" r="4" fill="${K}"/><path d="M40 68 q10 8 20 0" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/></svg>` },
  // --- 実画像（ph なし = PNGが読めなければ表示しない） ---
  { file: 'holiday-kun-thinking.png', alt: 'ホリデイくん（かんがえる）',
    work: { kind: '自社キャラクター', title: 'ホリデイくん（仮）', desc: 'スタジオホリデーの公式キャラクター。サイトの余白や404にも現れる予定。ここに概要とストーリーの入口が入ります。（仮テキスト）' } },
  { file: 'yappy.png', alt: 'yappy',
    work: { kind: 'ロゴ・世界観', title: 'yappy（仮）', desc: 'どんな依頼で、何を考えて、どうつくったか。アウトプットの概要がここに入ります。詳しいプロセスはストーリーへ。（仮テキスト）' } },
  { file: 'works-sushiro.png', alt: 'スシロー',
    work: { kind: 'ブランディング', title: 'スシロー（仮）', desc: 'どんな依頼で、何を考えて、どうつくったか。アウトプットの概要がここに入ります。詳しいプロセスはストーリーへ。（仮テキスト）' } },
  { file: 'works-pondelion.png', alt: 'ポン・デ・ライオン',
    work: { kind: 'キャラクターデザイン', title: 'ポン・デ・ライオン（仮）', desc: 'どんな依頼で、何を考えて、どうつくったか。アウトプットの概要がここに入ります。詳しいプロセスはストーリーへ。（仮テキスト）' } },
];

/* 社名ロゴ: イントロの最後に「Design & Deploy Partner」の上へ貼られる特別なステッカー。
 * 常に最前面・クリックで About へ */
const LOGO = { file: 'sh-logo.png', alt: 'STUDIO HOLIDAY', href: '#about' };

/* 写真: ステッカーに混ぜて壁に貼る（想定 3〜6枚）。クリックで外部ページ or サイト内記事へ。
 * img は実写プレースホルダー（picsum.photos・シード固定）。実素材が来たら差し替える。
 * オフライン等で読めない場合は絵文字+グラデにフォールバック。 */
const PHOTOS = [
  { cap: 'KDC イベントレポート（仮）', img: 'https://picsum.photos/seed/kdc-event/640/480', emoji: '📷', href: 'https://kdc-foodlab.com/post/aHOPhmK8', external: true, bg: 'linear-gradient(135deg,#ffe29a,#ff9a8b)' },
  { cap: 'みんなでご飯会（仮）', img: 'https://picsum.photos/seed/gohan-kai/640/480', emoji: '🍚', href: 'https://kdc-foodlab.com/post/aHOPhmK8', external: true, bg: 'linear-gradient(135deg,#a1ffce,#faffd1)' },
  { cap: '休日コーラ 試作会（仮）', img: 'https://picsum.photos/seed/holiday-cola/640/480', emoji: '🥤', href: './works.html', bg: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)' },
  { cap: 'yappy 対談記事（仮・サイト内）', img: 'https://picsum.photos/seed/yappy-talk/640/480', emoji: '🎙', href: './works.html', bg: 'linear-gradient(135deg,#c2e9fb,#81a4fd)' },
  { cap: 'KDC ワークショップ（仮）', img: 'https://picsum.photos/seed/kdc-workshop/640/480', emoji: '🛠', href: 'https://kdc-foodlab.com/post/aHOPhmK8', external: true, bg: 'linear-gradient(135deg,#fddb92,#d1fdff)' },
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

// <img>/canvas に入れるSVGは固有サイズが必要。大きめに指定して高解像度で描く
const svgURI = (svg) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(svg.replace('<svg ', '<svg width="512" height="512" '));

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
    if (!item.ph) return null;                            // 実画像のみのエントリは諦める
    return trimTransparent(await loadImage(svgURI(item.ph))); // プレースホルダー
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
  ctx.shadowColor = 'rgba(40, 33, 24, 0.30)';
  ctx.shadowOffsetX = ART * 0.018;
  ctx.shadowOffsetY = ART * 0.030;
  ctx.shadowBlur = ART * 0.022;
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

  // ステッカーの大きさは3階級: たまに主役級、基本は中、すき間に小
  const sizeFactor = () => {
    const t = Math.random();
    if (t < 0.15) return rand(1.3, 1.6);  // 大（主役）
    if (t < 0.8) return rand(0.95, 1.2);  // 中
    return rand(0.68, 0.82);              // 小
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
        minSize: size * 0.78,
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

/* 同じ絵柄が続かないよう、シャッフルしたデッキを繰り返して並べる（少量の重複あり） */
function artSequence(sprites, n) {
  const seq = [];
  while (seq.length < n) {
    const deck = shuffle(sprites);
    if (seq.length && deck[0] === seq[seq.length - 1]) deck.push(deck.shift());
    seq.push(...deck);
  }
  return seq.slice(0, n);
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
};
let PARAMS = { ...DEFAULT_PARAMS };
try { Object.assign(PARAMS, JSON.parse(localStorage.getItem('sh-tune')) || {}); } catch { /* 保存なし */ }

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
  const total = spots.length;

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
  const stickerSpots = spots.filter((p) => !photoSpots.includes(p));

  // 貼られる順番: 全アイテムをシャッフルして、順番に（＝ランダムな順で）ペタペタ
  const PASTE_SEC = 1.9;
  const order = shuffle([...Array(total).keys()]);
  const delayOf = (i) => (order[i] / total) * PASTE_SEC;
  const zOrder = shuffle([...Array(total).keys()]);

  const arts = artSequence(sprites, stickerSpots.length);
  stickerSpots.forEach((p, i) => {
    const sprite = arts[i];
    if (!sprite) return;
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
    ['size', 'ステッカーの大きさ', 0.6, 2.5, 0.05],
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
    '<div class="tune-actions">' +
    '<button type="button" data-act="intro">イントロ再生</button>' +
    '<button type="button" data-act="reset">リセット</button></div>';
  document.body.appendChild(panel);

  DEFS.forEach(([k, , min, max, step]) => {
    Object.assign(panel.querySelector(`[data-key="${k}"]`), { min, max, step });
  });
  const sync = () => DEFS.forEach(([k]) => {
    panel.querySelector(`[data-key="${k}"]`).value = PARAMS[k];
    panel.querySelector(`#tune-${k}`).textContent = '×' + Number(PARAMS[k]).toFixed(2);
  });
  sync();

  let debounce;
  panel.addEventListener('input', (e) => {
    const k = e.target.dataset.key;
    if (!k) return;
    PARAMS[k] = +e.target.value;
    localStorage.setItem('sh-tune', JSON.stringify(PARAMS));
    sync();
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
