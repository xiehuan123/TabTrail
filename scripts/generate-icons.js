import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const outputDir = "src/assets/icons";
const sizes = [16, 32, 48, 128];
const samples = 4;

const color = {
  text: [20, 32, 51],
  white: [255, 255, 255],
  primary: [31, 111, 235],
  primaryWeak: [232, 241, 255],
  success: [22, 115, 72]
};

function mix(a, b, t) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
}

function composite(base, source, alpha) {
  const nextAlpha = alpha + base[3] * (1 - alpha);
  if (nextAlpha === 0) {
    return [0, 0, 0, 0];
  }
  return [
    Math.round((source[0] * alpha + base[0] * base[3] * (1 - alpha)) / nextAlpha),
    Math.round((source[1] * alpha + base[1] * base[3] * (1 - alpha)) / nextAlpha),
    Math.round((source[2] * alpha + base[2] * base[3] * (1 - alpha)) / nextAlpha),
    nextAlpha
  ];
}

function roundedRectContains(x, y, left, top, width, height, radius) {
  const right = left + width;
  const bottom = top + height;
  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }

  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [xi, yi] = points[index];
    const [xj, yj] = points[previous];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function tabContains(x, y) {
  return roundedRectContains(x, y, 21, 41, 83, 52, 7)
    || roundedRectContains(x, y, 21, 26, 50, 32, 10)
    || pointInPolygon(x, y, [[58, 26], [72, 26], [84, 41], [58, 41]]);
}

function distanceToSegment(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(x - ax, y - ay);
  }

  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

function quadraticPoint(t) {
  const start = [42, 83];
  const control = [63, 49];
  const end = [87, 76];
  const inverse = 1 - t;
  return [
    inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
    inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1]
  ];
}

function distanceToTrail(x, y) {
  let distance = Number.POSITIVE_INFINITY;
  let previous = quadraticPoint(0);
  for (let index = 1; index <= 48; index += 1) {
    const current = quadraticPoint(index / 48);
    distance = Math.min(distance, distanceToSegment(x, y, previous[0], previous[1], current[0], current[1]));
    previous = current;
  }
  return distance;
}

function drawSample(x, y) {
  let pixel = [0, 0, 0, 0];

  if (roundedRectContains(x, y, 0, 0, 128, 128, 28)) {
    const t = Math.max(0, Math.min(1, (x + y - 40) / 176));
    pixel = composite(pixel, mix(color.primary, color.success, t), 1);
  }

  if (tabContains(x - 9, y - 6)) {
    pixel = composite(pixel, color.text, 0.18);
  }

  if (tabContains(x, y)) {
    const t = Math.max(0, Math.min(1, (x + y - 40) / 128));
    pixel = composite(pixel, mix(color.white, color.primaryWeak, t), 1);
  }

  if (distanceToSegment(x, y, 24, 53, 101, 53) <= 3) {
    pixel = composite(pixel, color.primary, 0.24);
  }

  const trailDistance = distanceToTrail(x, y);
  if (trailDistance <= 4.5) {
    pixel = composite(pixel, color.success, 1);
  }
  if (trailDistance <= 2) {
    pixel = composite(pixel, color.primary, 1);
  }

  for (const node of [
    [42, 83, 9, color.primary, 3],
    [64, 67, 7, color.success, 2.5],
    [87, 76, 9, color.primary, 3]
  ]) {
    const [cx, cy, radius, fill, innerRadius] = node;
    const distance = Math.hypot(x - cx, y - cy);
    if (distance <= radius) {
      pixel = composite(pixel, fill, 1);
    }
    if (distance <= innerRadius) {
      pixel = composite(pixel, color.white, 1);
    }
  }

  return pixel;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return output;
}

function encodePng(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    rows[rowOffset] = 0;
    pixels.copy(rows, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const sampleCount = samples * samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const accumulated = [0, 0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = ((x + (sx + 0.5) / samples) * 128) / size;
          const py = ((y + (sy + 0.5) / samples) * 128) / size;
          const sample = drawSample(px, py);
          accumulated[0] += sample[0] * sample[3];
          accumulated[1] += sample[1] * sample[3];
          accumulated[2] += sample[2] * sample[3];
          accumulated[3] += sample[3];
        }
      }

      const alpha = accumulated[3] / sampleCount;
      const offset = (y * size + x) * 4;
      pixels[offset] = alpha === 0 ? 0 : Math.round(accumulated[0] / accumulated[3]);
      pixels[offset + 1] = alpha === 0 ? 0 : Math.round(accumulated[1] / accumulated[3]);
      pixels[offset + 2] = alpha === 0 ? 0 : Math.round(accumulated[2] / accumulated[3]);
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }

  return encodePng(size, size, pixels);
}

await mkdir(outputDir, { recursive: true });
for (const size of sizes) {
  await writeFile(`${outputDir}/tabtrail-${size}.png`, renderIcon(size));
}

console.log(`Generated ${sizes.length} TabTrail icon sizes in ${outputDir}/`);
