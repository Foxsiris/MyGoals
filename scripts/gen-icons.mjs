/* ============================================================
   PWA icon generator — renders the brand mark (gradient rounded
   square + white diamond, same as public/favicon.svg) into PNGs
   without any native deps. Run: node scripts/gen-icons.mjs
   ============================================================ */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

// brand colors (resolved from the app's oklch palette)
const C1 = [216, 81, 107] // --goal  oklch(0.62 0.17 12)
const C2 = [53, 155, 113] // --habit oklch(0.62 0.115 162)

/* ---------- minimal PNG encoder (RGBA, zlib built-in) ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePNG(rgba, w, h) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------- rasterizer (3× supersampling) ---------- */
// fullBleed: gradient fills the whole square (maskable / apple-touch);
// otherwise corners are rounded like the favicon (rx = 13/48 of size).
function renderIcon(size, { fullBleed = false, diamondScale = 1 } = {}) {
  const SS = 3
  const S = size * SS
  const rxCorner = fullBleed ? 0 : (13 / 48) * S
  const half = (14 / 48 / Math.SQRT2) * S * diamondScale // diamond center→vertex
  const cx = S / 2, cy = S / 2
  const rgba = Buffer.alloc(size * size * 4)

  const inRoundedSquare = (x, y) => {
    if (rxCorner === 0) return true
    const dx = Math.max(rxCorner - x, x - (S - rxCorner), 0)
    const dy = Math.max(rxCorner - y, y - (S - rxCorner), 0)
    return dx * dx + dy * dy <= rxCorner * rxCorner
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px * SS + sx + 0.5, y = py * SS + sy + 0.5
          if (!inRoundedSquare(x, y)) continue
          // favicon gradient: 0→1 along the main diagonal, stop2 at 130%
          const t = Math.min(1, (x + y) / (2 * S) / 1.3)
          let cr = C1[0] + (C2[0] - C1[0]) * t
          let cg = C1[1] + (C2[1] - C1[1]) * t
          let cb = C1[2] + (C2[2] - C1[2]) * t
          if (Math.abs(x - cx) + Math.abs(y - cy) <= half) { cr = 255; cg = 255; cb = 255 }
          r += cr; g += cg; b += cb; a += 255
        }
      }
      const n = SS * SS, i = (py * size + px) * 4
      const cov = a / (255 * n)
      // premultiplied average → straight alpha
      rgba[i] = cov ? Math.round(r / n / cov) : 0
      rgba[i + 1] = cov ? Math.round(g / n / cov) : 0
      rgba[i + 2] = cov ? Math.round(b / n / cov) : 0
      rgba[i + 3] = Math.round(a / n)
    }
  }
  return encodePNG(rgba, size, size)
}

const targets = [
  ['icon-192.png', renderIcon(192)],
  ['icon-512.png', renderIcon(512)],
  // maskable: full-bleed background, mark shrunk into the 80% safe zone
  ['icon-512-maskable.png', renderIcon(512, { fullBleed: true, diamondScale: 0.9 })],
  // iOS rounds corners itself — give it a full-bleed square
  ['apple-touch-icon.png', renderIcon(180, { fullBleed: true })],
]
for (const [name, buf] of targets) {
  writeFileSync(join(OUT, name), buf)
  console.log(`${name}  ${buf.length} bytes`)
}
