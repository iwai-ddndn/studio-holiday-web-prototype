/* ===== STUDIO HOLIDAY — sticker-wall first view =====
 * ステッカー画像は assets/stickers/*.png で管理する（透過PNG推奨・目安400px角）。
 * 同名のPNGがまだ置かれていない間は、各エントリの ph（SVGプレースホルダー）に
 * 自動でフォールバックして表示する。
 *
 * 描画:
 *   白フチ（輪郭ダイカット）と落ち影は Canvas で一度だけスプライトに焼き込む。
 *   以前は CSS の drop-shadow ×9 を全ステッカーに掛けていて、ポップイン中に
 *   毎フレーム再計算されカクつきの原因になっていた。焼き込み後はただの <img>。
 *
 * 配置:
 *   1. 画面をグリッドに切り、各セルにジッター付きでステッカーを撒く（全面カバー）
 *   2. 反発シミュレーションで重なりを解消（ほぼ非重なりまで広げる）
 *   3. それでも詰まる場所はサイズを少しずつ縮めて逃がす
 */

const STICKER_DIR = './assets/stickers/';
const K = '#2a2622'; // キーライン（濃い輪郭）

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
  { file: 'holiday-kun-thinking.png', alt: 'ホリデイくん（かんがえる）' },
  { file: 'yappy.png', alt: 'yappy' },
  { file: 'works-sushiro.png', alt: 'スシロー' },
  { file: 'works-pondelion.png', alt: 'ポン・デ・ライオン' },
];

/* 社名ロゴ: 通常のデッキには入れない特別なステッカー。
 * 常に1枚だけ・最大ステッカーより大きく・最前面・四隅のどこかに貼られ、
 * クリックで About へ飛ぶ。 */
const LOGO = { file: 'sh-logo.png', alt: 'STUDIO HOLIDAY', href: '#about' };

const field = document.getElementById('stickerField');

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

/* 透過の余白をトリムして、絵柄ぴったりのcanvasにする。
 * （ロゴ等、書き出し時の余白が大きい素材でもサイズ感が揃う） */
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

function makeDiecutSprite(art) {
  const ART = 520;                  // 絵柄の描画サイズ（長辺。表示は最大~450pxなので十分）
  const OUTLINE = ART * 0.045;      // 白フチの太さ
  const PAD = OUTLINE + ART * 0.07; // 白フチ+影のための余白

  // 縦横比を保つ（スプライト自体を絵柄の比率で作る）
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
      return art && { alt: item.alt, ...makeDiecutSprite(art) };
    }),
  ).then((list) => list.filter(Boolean));
  return spritesPromise;
}

let logoSpritePromise = null;
function getLogoSprite() {
  logoSpritePromise ??= loadArt(LOGO).then((art) => art && makeDiecutSprite(art));
  return logoSpritePromise;
}

/* --- 配置: グリッド撒き → 反発シミュレーション ---
 * 「ちょっとずつ重なる」の作り方:
 *   絵柄はスプライトの約81%を占めるので、反発の停止距離 GAP をそれより
 *   小さく(0.72)取り、かつサイズを過密気味(セルの1.3〜1.6倍)に撒く。
 *   押し合いの均衡点が「隣と縁が少し重なった状態」で安定する。
 */
function layoutStickers(W, H) {
  const base = W < 560 ? 150 : W < 900 ? 175 : 190; // ステッカー1枚のだいたいの領域
  const padTop = 64;                                 // ヘッダーぶん空ける
  const cols = Math.max(2, Math.round(W / base));
  const rows = Math.max(2, Math.round((H - padTop) / base));
  const cellW = W / cols;
  const cellH = (H - padTop) / rows;

  // ステッカーの大きさは3階級: たまに主役級、基本は中、すき間に小
  const sizeFactor = () => {
    const t = Math.random();
    if (t < 0.15) return rand(1.9, 2.4);  // 大（主役）
    if (t < 0.75) return rand(1.15, 1.6); // 中
    return rand(0.75, 1.0);               // 小（すき間埋め）
  };

  // 1) 全セルに撒く（全面カバー）。ジッターで整列感は消す
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const size = Math.min(cellW, cellH) * sizeFactor();
      items.push({
        x: c * cellW + cellW / 2 + rand(-cellW, cellW) * 0.28,
        y: padTop + r * cellH + cellH / 2 + rand(-cellH, cellH) * 0.28,
        size,
        minSize: size * 0.78,
      });
    }
  }

  // 2) 反発で押し広げる。過密なので、均衡点＝少し重なった状態になる
  const GAP = 0.72; // 絵柄同士が縁で重なる距離（0.81で絵柄が外接）
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
    // 画面内にクランプ（端は少しだけ見切れてよい）
    for (const p of items) {
      const inset = p.size * 0.42;
      p.x = Math.min(W - inset, Math.max(inset, p.x));
      p.y = Math.min(H - inset, Math.max(padTop + inset * 0.8, p.y));
    }
    if (!moved) break;
  }
  return items;
}

/* 同じ絵柄が隣り合いにくいよう、シャッフルしたデッキを繰り返して並べる */
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
  el.style.animationDelay = opts.delay + 's';

  const img = document.createElement('img');
  img.alt = sprite.alt;
  img.draggable = false;
  img.src = sprite.url;
  el.appendChild(img);

  // ポップ後はアニメを外して、ホバーの持ち上げが効くようにする
  el.classList.add('is-popping');
  el.addEventListener('animationend', () => el.classList.remove('is-popping'), { once: true });
  return el;
}

async function placeStickers() {
  const [sprites, logoSprite] = await Promise.all([getSprites(), getLogoSprite()]); // 初回のみ生成、以降はキャッシュ
  field.innerHTML = '';
  const W = field.clientWidth || window.innerWidth;
  const H = field.clientHeight || window.innerHeight;

  const spots = layoutStickers(W, H);
  const arts = artSequence(sprites, spots.length);
  const zOrder = shuffle([...Array(spots.length).keys()]);

  spots.forEach((p, i) => {
    const { w, h } = stickerDims(arts[i], p.size);
    field.appendChild(buildSticker(arts[i], {
      href: './works.html', // 仮: すべてのステッカーからWorksページへ
      rot: rand(-16, 16),
      size: p.size,
      x: p.x - w / 2,
      y: p.y - h / 2,
      z: zOrder[i] + 1,
      delay: rand(0, 0.45),
    }));
  });

  // 社名ロゴ: 最大ステッカーより大きく、最前面、下側の隅どちらかに1枚だけ
  // （上の隅はヘッダーのナビと被るため下側に限定。ヘッダーの z=1000 より下）
  if (logoSprite) {
    const sprite = { alt: LOGO.alt, ...logoSprite };
    // ロゴは横長ロックアップなので、長辺基準だと見た目が細く負ける。
    // 幅を最大ステッカーの1.5倍に取り（画面幅は超えない）、存在感を確保する
    const M = 14; // 隅からの余白
    const L = Math.min(Math.max(...spots.map((p) => p.size)) * 1.5, W - M * 2);
    const { w, h } = stickerDims(sprite, L);
    const corner = Math.random() < 0.5
      ? { x: M, y: H - h - M }          // 左下
      : { x: W - w - M, y: H - h - M }; // 右下
    field.appendChild(buildSticker(sprite, {
      href: LOGO.href,
      cls: 'sticker-logo',
      rot: rand(-6, 6),
      size: L,
      x: corner.x,
      y: corner.y,
      z: 990, // どのステッカー（通常 z ≤ 数十、hover時 989）よりも手前
      delay: 0.55, // 最後にバチンと貼られる
    }));
  }
}

window.addEventListener('resize', () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(placeStickers, 200);
});

placeStickers();
