'use strict';
/* Generator ikon Binu AI — orb aurora: bola gradien ungu-tosca dengan rim glow */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function render(size, maskable) {
  const W = size;
  const px = new Uint8Array(W * W * 4);
  const cx = W / 2, cy = W / 2, R = W * (maskable ? 0.30 : 0.40);
  const deep = [38, 20, 84], mid = [124, 77, 255], hot = [196, 156, 255], cyan = [49, 208, 170];

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (maskable) { px[o] = 8; px[o + 1] = 8; px[o + 2] = 20; px[o + 3] = 255; } else { px[o + 3] = 0; }
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);

      // glow luar lembut
      if (d > R && d < R * 1.35) {
        const t = clamp(1 - (d - R) / (R * 0.35), 0, 1) * 0.55;
        const g = mix([92, 62, 222], [12, 8, 32], 1 - t);
        px[o] = Math.round(g[0] * t + px[o] * (1 - t));
        px[o + 1] = Math.round(g[1] * t + px[o + 1] * (1 - t));
        px[o + 2] = Math.round(g[2] * t + px[o + 2] * (1 - t));
        px[o + 3] = Math.round(255 * t + px[o + 3] * (1 - t));
        continue;
      }
      if (d > R) continue;

      // shading: cahaya dari kiri-atas
      const nx = dx / R, ny = dy / R;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const light = clamp(0.4 + 0.65 * (-nx * 0.55 - ny * 0.75 + nz * 0.55), 0, 1.1);

      // gradien vertikal: atas violet-terang → tengah ungu → bawah teal gelap
      let col = mix(hot, mid, clamp((ny + 0.95) / 1.5, 0, 1));
      col = mix(col, deep, clamp((ny - 0.05) / 1.15, 0, 1));
      col = mix(col, cyan, clamp((ny * -0.45 + 0.32) * (1 - Math.abs(nx) * 0.55), 0, 1) * 0.45);

      col = [clamp(col[0] * light, 0, 255), clamp(col[1] * light, 0, 255), clamp(col[2] * light, 0, 255)];

      // rim bawah (pantulan)
      const rim = clamp((Math.abs(nx) * 0.4 + ny * 0.75 - 0.35) * 1.6, 0, 1) * (nz > 0.25 ? 1 : 0);
      col = mix(col, cyan, rim * 0.65);

      // highlight spekular
      const hx = nx + 0.38, hy = ny + 0.42;
      const spec = clamp(1 - Math.hypot(hx, hy) * 2.4, 0, 1) ** 3;
      col = mix(col, [255, 255, 255], spec * 0.6);

      px[o] = Math.round(col[0]); px[o + 1] = Math.round(col[1]); px[o + 2] = Math.round(col[2]); px[o + 3] = 255;
    }
  }
  return px;
}

const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body)); return Buffer.concat([len, body, crc]); };
function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), encodePng(Buffer.from(render(size, false).buffer), size));
}
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), encodePng(Buffer.from(render(512, true).buffer), 512));
console.log('ikon Binu AI selesai');
