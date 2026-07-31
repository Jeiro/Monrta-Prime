// Generates public/og-image.png (1200x630 social card) and public/favicon.ico
// from the Moneta Prime brand mark. Run: node scripts/generate-brand-assets.mjs
// Requires the dev dependency `sharp`.
import sharp from "sharp";
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

// The Moneta Prime mark — kept in sync with src/components/ui/Brandmark.tsx.
// A cut hexagonal prism with an ascending position line knocked out of it.
// viewBox 0 0 100 100.
const primeMark = (accentId) => `
  <path d="M50 4 L91 27 L91 73 L50 96 L9 73 L9 27 Z" fill="url(#${accentId})" />
  <polyline points="26,64 42,52 56,60 74,34" fill="none" stroke="#0B0C0F"
            stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="74" cy="34" r="8" fill="#0B0C0F" />
  <circle cx="74" cy="34" r="3.6" fill="#E9EBEF" />
`;

const accentStops = (id) => `
  <linearGradient id="${id}" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#2E6BE0" />
    <stop offset="55%" stop-color="#6AA5FF" />
    <stop offset="100%" stop-color="#8ABAFF" />
  </linearGradient>`;

// Rendered by librsvg via sharp, so these resolve against the fonts
// installed on whichever machine runs this — not against webfonts.
// DISPLAY mirrors the app's --font-display (a high-contrast serif);
// FONT mirrors --font-sans for supporting text.
const DISPLAY = "Instrument Serif, Noto Serif, Liberation Serif, Georgia, serif";
const FONT = "IBM Plex Sans, Noto Sans, Liberation Sans, Arial, sans-serif";

// ---- OG image (1200 x 630) ----
const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${accentStops("ogAccent")}
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131519" />
      <stop offset="100%" stop-color="#08090C" />
    </linearGradient>
    <radialGradient id="ogGlow" cx="18%" cy="12%" r="60%">
      <stop offset="0%" stop-color="#6AA5FF" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#6AA5FF" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ogGlow2" cx="88%" cy="92%" r="55%">
      <stop offset="0%" stop-color="#3D7DFF" stop-opacity="0.09" />
      <stop offset="100%" stop-color="#3D7DFF" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)" />
  <rect width="1200" height="630" fill="url(#ogGlow)" />
  <rect width="1200" height="630" fill="url(#ogGlow2)" />
  <rect x="8" y="8" width="1184" height="614" rx="28" fill="none" stroke="#262A32" stroke-opacity="0.6" stroke-width="2" />
  <rect x="0" y="0" width="1200" height="6" fill="url(#ogAccent)" />

  <!-- Brand mark -->
  <g transform="translate(500,86) scale(2.0)">
    ${primeMark("ogAccent")}
  </g>

  <!-- Wordmark -->
  <text x="600" y="382" text-anchor="middle" font-family="${DISPLAY}" font-size="104" font-weight="400" letter-spacing="-1">
    <tspan fill="#E9EBEF">moneta</tspan><tspan fill="#6AA5FF" dx="26">prime</tspan>
  </text>

  <!-- Tagline -->
  <text x="600" y="462" text-anchor="middle" font-family="${FONT}" font-size="31" font-weight="500" fill="#949BA9">
    Crypto Trading  ·  Copy Trading  ·  Investment Plans
  </text>

  <!-- Domain -->
  <text x="600" y="560" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="600" letter-spacing="1" fill="#6AA5FF">
    PLACEHOLDER-DOMAIN.example
  </text>
</svg>`;

// ---- Favicon mark (square tile) ----
const faviconSvg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${accentStops("fgAccent")}
    <linearGradient id="fgTile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16191F" />
      <stop offset="100%" stop-color="#0A0B0E" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#fgTile)" />
  <rect x="4" y="4" width="504" height="504" rx="108" fill="none" stroke="#262A32" stroke-width="6" />
  <g transform="translate(76,76) scale(3.6)">
    ${primeMark("fgAccent")}
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
  // OG image: generated from the mark above by default.
  //
  // This used to composite public/brand-logo.png unconditionally. That file
  // is still the pre-rebrand Orbitrio artwork, so compositing it would put
  // the old identity back into the social card. Once a Moneta Prime
  // brand-logo.png is supplied, re-enable the composite with:
  //   USE_BRAND_LOGO=1 node scripts/generate-brand-assets.mjs
  const brandLogo = resolve(publicDir, "brand-logo.png");
  if (process.env.USE_BRAND_LOGO === "1" && existsSync(brandLogo)) {
    await sharp(brandLogo)
      .resize(1200, 630, { fit: "contain", background: { r: 8, g: 9, b: 12, alpha: 1 } })
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
