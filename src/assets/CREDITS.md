# Image credits and licensing

Every image in this directory is served from `images.unsplash.com` and is
therefore covered by the [Unsplash License](https://unsplash.com/license),
which grants free use — including commercial use — without permission or
attribution.

The files are committed to this repo rather than hotlinked, so the site never
depends on a third-party CDN at runtime and the exact bytes we shipped stay
pinned.

Attribution is **not required** by the licence, but the canonical source URL of
each photo is recorded below so provenance can be audited and the photographer
credited if we choose to. Look up the URL on Unsplash to get the photographer's
name.

| File | Source | Used in |
|---|---|---|
| `hero-market-terminal-1600.jpg`, `hero-market-terminal-800.jpg` | `https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f` | `src/pages/PublicHome.tsx` — hero |
| `proof-team-1200.jpg`, `proof-team-600.jpg` | `https://images.unsplash.com/photo-1521737604893-d14cc237f11d` | `src/components/home/Proof.tsx` |

## Rules for adding images here

- Free-for-commercial-use sources only — Unsplash or Pexels. Do **not** pull
  images from search results, other sites, or anywhere without an explicit
  commercial licence.
- Download the file and commit it. Never hotlink an external URL into
  production.
- Add a row above with the canonical source URL.
- These pages are dark and restrained. A bright, saturated photo will read as
  a rectangle dropped on top of the design rather than part of it — apply the
  `--mp-ground` gradient tint the existing usages do, and prefer photos that
  are already muted.
