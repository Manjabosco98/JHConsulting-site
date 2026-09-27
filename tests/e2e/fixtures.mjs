import { crc32, deflateSync } from "node:zlib";
import { randomBytes } from "node:crypto";

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Real RGB PNG. `pixel(x, y)` returns [r, g, b]; `noise` makes it barely
 * compressible (used to exceed the 5 MB limit with a genuine image).
 */
export function makePng(width, height, { pixel, noise = false } = {}) {
  const color = pixel ?? ((x, y) => [8 + Math.round((x / width) * 50), 13 + Math.round((y / height) * 90), 24 + Math.round((x / width) * 200)]);
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = noise ? Buffer.concat([Buffer.from([0]), randomBytes(width * 3)]) : Buffer.alloc(1 + width * 3);
    if (!noise) for (let x = 0; x < width; x++) row.set(color(x, y), 1 + x * 3);
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: noise ? 0 : 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
