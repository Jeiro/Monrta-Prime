import { useEffect } from "react";

// Lightweight per-route SEO. React SPAs ship one static <title>/<meta> in
// index.html for every route; this hook updates the document title and the
// key meta/OG/Twitter/canonical tags per page so each public route has its
// own, relevant metadata (and shared links render properly). It upserts the
// SAME tags index.html declares, so there are never duplicates.

const SITE_URL = "https://monetaprime.xyz";
// 1200x630 social preview image. Drop the real asset at public/og-image.png.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = "Moneta Prime";

export interface SeoOptions {
  title: string;
  description: string;
  /** Route path beginning with "/", e.g. "/markets". Used for canonical + og:url. */
  path: string;
  image?: string;
}

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const useSeo = ({ title, description, path, image = DEFAULT_OG_IMAGE }: SeoOptions) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;

    upsertMeta("name", "description", description);
    upsertLink("canonical", url);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
  }, [title, description, path, image]);
};
