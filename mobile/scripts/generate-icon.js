// Icon generator — a scan-viewfinder motif (matches the app's core "scan to
// catalog" action) on the brand indigo background. Pure pixel math + zlib,
// no image libraries needed. Re-run after editing to regenerate assets/.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// `paint(x, y)` returns an [r,g,b] triple for pixel (x,y) on a `size`x`size` canvas.
function renderPng(size, paint) {
  const rowLen = size * 3;
  const raw = Buffer.alloc((rowLen + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowLen + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x, y);
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);
}

const INDIGO = [99, 102, 241]; // matches theme/colors.ts palette.indigo
const WHITE = [255, 255, 255];

/**
 * Scan-viewfinder icon: four L-shaped corner brackets (camera-scan motif)
 * centered on a solid indigo square.
 */
function makeIconPaint({ bracketInset, bracketLen, bracketThickness }) {
  return (x, y, size) => {
    const inset = bracketInset;
    const len = bracketLen;
    const t = bracketThickness;

    // Top-left
    if (
      (x >= inset && x <= inset + len && y >= inset && y <= inset + t) ||
      (x >= inset && x <= inset + t && y >= inset && y <= inset + len)
    ) return WHITE;
    // Top-right
    if (
      (x >= size - inset - len && x <= size - inset && y >= inset && y <= inset + t) ||
      (x >= size - inset - t && x <= size - inset && y >= inset && y <= inset + len)
    ) return WHITE;
    // Bottom-left
    if (
      (x >= inset && x <= inset + len && y >= size - inset - t && y <= size - inset) ||
      (x >= inset && x <= inset + t && y >= size - inset - len && y <= size - inset)
    ) return WHITE;
    // Bottom-right
    if (
      (x >= size - inset - len && x <= size - inset && y >= size - inset - t && y <= size - inset) ||
      (x >= size - inset - t && x <= size - inset && y >= size - inset - len && y <= size - inset)
    ) return WHITE;

    return INDIGO;
  };
}

function circleDot(size, cx, cy, r, color) {
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r ? color : null;
  };
}

function composite(size, layers) {
  return (x, y) => {
    for (const layer of layers) {
      const c = layer(x, y, size);
      if (c) return c;
    }
    return INDIGO;
  };
}

const outDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(outDir, { recursive: true });

// Standard app icon: brackets fill most of the frame.
const iconPaint = makeIconPaint({ bracketInset: 260, bracketLen: 220, bracketThickness: 70 });
const centerDot = circleDot(1024, 512, 512, 46, WHITE);
fs.writeFileSync(path.join(outDir, "icon.png"), renderPng(1024, composite(1024, [centerDot, iconPaint])));

// Adaptive icon (Android): keep artwork inside the ~66% safe zone since the
// OS crops this to a circle/squircle/rounded-square depending on launcher.
// (inset+len must stay under size/2 or the corner brackets collide into a
// solid ring instead of four separate L shapes.)
const adaptivePaint = makeIconPaint({ bracketInset: 300, bracketLen: 180, bracketThickness: 60 });
fs.writeFileSync(path.join(outDir, "adaptive-icon.png"), renderPng(1024, composite(1024, [circleDot(1024, 512, 512, 40, WHITE), adaptivePaint])));

// Favicon: simpler at small size — just the four brackets, thicker, no center dot.
const faviconPaint = makeIconPaint({ bracketInset: 8, bracketLen: 16, bracketThickness: 7 });
fs.writeFileSync(path.join(outDir, "favicon.png"), renderPng(48, composite(48, [faviconPaint])));

// Play Store hi-res store-listing icon (separate upload from the in-app icon, 512x512).
const storeIconPaint = makeIconPaint({ bracketInset: 130, bracketLen: 110, bracketThickness: 35 });
const storeIconDot = circleDot(512, 256, 256, 23, WHITE);
fs.writeFileSync(path.join(outDir, "play-store-icon-512.png"), renderPng(512, composite(512, [storeIconDot, storeIconPaint])));

console.log("Wrote icon.png, adaptive-icon.png, favicon.png, play-store-icon-512.png to", outDir);
