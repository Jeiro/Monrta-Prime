// Generates public/og-image.png (1200x630 social card) and public/favicon.ico
// from the Moneta Prime brand mark. Run: node scripts/generate-brand-assets.mjs
// Requires the dev dependency `sharp`.
import sharp from "sharp";
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

// The app's orbit logo mark (from Footer.tsx / AboutUs.tsx), viewBox 0 0 100 100.
const orbitMark = (goldId, silverId) => `
  <path d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" fill="url(#${goldId})" />
  <path d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" fill="url(#${goldId})" />
  <path d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" fill="url(#${silverId})" />
  <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
`;

const goldStops = (id) => `
  <linearGradient id="${id}" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#E05B00" />
    <stop offset="45%" stop-color="#F7931A" />
    <stop offset="100%" stop-color="#FFBA3B" />
  </linearGradient>`;
const silverStops = (id) => `
  <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FFFFFF" />
    <stop offset="50%" stop-color="#E6E8EF" />
    <stop offset="100%" stop-color="#A3AABF" />
  </linearGradient>`;

const FONT = "Segoe UI, Arial, Helvetica, sans-serif";

// ---- OG image (1200 x 630) ----
const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${goldStops("ogGold")}
    ${silverStops("ogSilver")}
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1319" />
      <stop offset="100%" stop-color="#070A0E" />
    </linearGradient>
    <radialGradient id="ogGlow" cx="18%" cy="12%" r="60%">
      <stop offset="0%" stop-color="#FFB11A" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#FFB11A" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ogGlow2" cx="88%" cy="92%" r="55%">
      <stop offset="0%" stop-color="#FF7F00" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#FF7F00" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)" />
  <rect width="1200" height="630" fill="url(#ogGlow)" />
  <rect width="1200" height="630" fill="url(#ogGlow2)" />
  <rect x="8" y="8" width="1184" height="614" rx="28" fill="none" stroke="#2B3139" stroke-opacity="0.6" stroke-width="2" />
  <rect x="0" y="0" width="1200" height="6" fill="url(#ogGold)" />

  <!-- Brand mark -->
  <g transform="translate(500,86) scale(2.0)">
    ${orbitMark("ogGold", "ogSilver")}
  </g>

  <!-- Wordmark -->
  <text x="600" y="380" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="800" letter-spacing="-1">
    <tspan fill="#FFFFFF">Moneta Prime</tspan><tspan fill="#FFB11A" dx="26">Trades</tspan>
  </text>

  <!-- Tagline -->
  <text x="600" y="446" text-anchor="middle" font-family="${FONT}" font-size="31" font-weight="500" fill="#B7BDC6">
    Crypto Trading  ·  Copy Trading  ·  Investment Plans
  </text>

  <!-- Domain -->
  <text x="600" y="552" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="700" letter-spacing="1" fill="#FFB11A">
    PLACEHOLDER-DOMAIN.example
  </text>
</svg>`;

// ---- Favicon mark (square tile) ----
const faviconSvg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${goldStops("fgGold")}
    ${silverStops("fgSilver")}
    <linearGradient id="fgTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12161D" />
      <stop offset="100%" stop-color="#090B10" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#fgTile)" />
  <rect x="4" y="4" width="504" height="504" rx="108" fill="none" stroke="#2B3139" stroke-width="6" />
  <g transform="translate(76,86) scale(3.6)">
    ${orbitMark("fgGold", "fgSilver")}
  </g>
</svg>`;

// Build a valid .ico that embeds PNG images at 16/32/48 px (PNG-in-ICO,
// supported by all modern browsers and Windows).
async function buildIco(sizes) {
  const pngs = await Promise.all(
    sizes.map((s) => sharp(Buffer.from(faviconSvg(s))).resize(s, s).png().toBuffer())
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  const entries = [];
  let offset = 6 + sizes.length * 16;
  sizes.forEach((s, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // width
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngs[i].length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset
    offset += pngs[i].length;
    entries.push(entry);
  });

  return Buffer.concat([header, ...entries, ...pngs]);
}

const run = async () => {
  // OG image: composite the supplied brand logo (public/brand-logo.png)
  // centered on a 1200x630 canvas, padded with the logo's own near-black
  // corner color (#03030d) for a seamless fill. Falls back to the generated
  // text card if the source logo isn't present.
  const brandLogo = resolve(publicDir, "brand-logo.png");
  if (existsSync(brandLogo)) {
    await sharp(brandLogo)
      .resize(1200, 630, { fit: "contain", background: { r: 3, g: 3, b: 13, alpha: 1 } })
      .png()
      .toFile(resolve(publicDir, "og-image.png"));
    console.log("✓ public/og-image.png (1200x630, from brand-logo.png)");
  } else {
    await sharp(Buffer.from(ogSvg)).png().toFile(resolve(publicDir, "og-image.png"));
    console.log("✓ public/og-image.png (1200x630, generated card)");
  }

  const ico = await buildIco([16, 32, 48]);
  writeFileSync(resolve(publicDir, "favicon.ico"), ico);
  console.log("✓ public/favicon.ico (16/32/48)");

  // Also emit a crisp PNG icon for modern <link rel="icon"> use.
  await sharp(Buffer.from(faviconSvg(512))).resize(512, 512).png().toFile(resolve(publicDir, "favicon-512.png"));
  console.log("✓ public/favicon-512.png");
};

run().catch((e) => { console.error(e); process.exit(1); });
