import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// Minimal valid PNG generator from raw RGBA buffer
function createPng(width, height, drawFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const offset = y * (rowSize + 1) + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method: deflate
  ihdr[11] = 0; // Filter method: standard
  ihdr[12] = 0; // Interlace method: none

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calcCrc(toCrc), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

// Standard CRC32 for PNG
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function calcCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Icon drawer: Snow Plow Tractor theme
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: Deep dark navy to royal cyan gradient (#0b1528 -> #0369a1)
  const bgR = Math.round(11 + (3 - 11) * ny);
  const bgG = Math.round(21 + (105 - 21) * ny);
  const bgB = Math.round(40 + (161 - 40) * ny);

  // Snow ground in lower 30%
  const snowHorizon = 0.68 + Math.sin(nx * Math.PI * 2) * 0.05;
  if (ny > snowHorizon) {
    // Pure snowy white
    return [248, 250, 252, 255];
  }

  // Hero plow chassis (golden yellow / orange #f59e0b)
  if (nx >= 0.32 && nx <= 0.68 && ny >= 0.42 && ny <= 0.68) {
    // Glass window in upper-right of cab
    if (nx >= 0.44 && nx <= 0.62 && ny >= 0.45 && ny <= 0.55) {
      return [56, 189, 248, 255]; // Cyan glass
    }
    return [245, 158, 11, 255]; // Yellow body
  }

  // Front plow blade (steel white/silver)
  if (nx >= 0.65 && nx <= 0.82 && ny >= 0.48 && ny <= 0.72) {
    return [226, 232, 240, 255];
  }

  // Beacon (orange)
  const distBeacon = Math.hypot(nx - 0.4, ny - 0.38);
  if (distBeacon < 0.04) {
    return [251, 191, 36, 255];
  }

  // Wheels
  const distWheel1 = Math.hypot(nx - 0.4, ny - 0.7);
  const distWheel2 = Math.hypot(nx - 0.62, ny - 0.7);
  if (distWheel1 < 0.08 || distWheel2 < 0.08) {
    if (distWheel1 < 0.03 || distWheel2 < 0.03) {
      return [148, 163, 184, 255]; // Hubcap
    }
    return [15, 23, 42, 255]; // Rubber tire
  }

  // Drifting snowflake dots
  if (
    (Math.hypot(nx - 0.2, ny - 0.25) < 0.015) ||
    (Math.hypot(nx - 0.75, ny - 0.3) < 0.018) ||
    (Math.hypot(nx - 0.82, ny - 0.42) < 0.014) ||
    (Math.hypot(nx - 0.5, ny - 0.2) < 0.016)
  ) {
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

async function main() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pwa192 = await createPng(192, 192, drawIcon);
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

  const pwa512 = await createPng(512, 512, drawIcon);
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);

  const apple180 = await createPng(180, 180, drawIcon);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), apple180);

  console.log('Successfully generated PWA PNG icons!');
}

main().catch(console.error);
