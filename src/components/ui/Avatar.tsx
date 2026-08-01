import { useState } from "react";

/**
 * Avatar with an initials fallback.
 *
 * The trader cards rendered `<img src={trader.avatar}>` directly, and the
 * trader records carry an empty `avatar` string. `src=""` doesn't render
 * "nothing" — the browser resolves it against the current URL and
 * **re-requests the whole page**, once per avatar. Four traders meant four
 * extra full-document fetches on every visit to Copy Trading, plus a React
 * warning per image.
 *
 * So the image is only rendered when there is genuinely a URL, and a
 * decode failure falls back too — a broken-image glyph next to someone's
 * name looks like the profile itself is broken.
 */

export interface AvatarProps {
  src?: string | null;
  /** Used for the alt text and to derive the initials. */
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-2xs",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const usable = typeof src === "string" && src.trim() !== "" && !failed;

  const base = `shrink-0 rounded-full border border-line object-cover ${sizes[size]} ${className}`;

  if (usable) {
    return (
      <img
        src={src as string}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={base}
      />
    );
  }

  return (
    <span
      // The initials duplicate the name shown beside them, so this is
      // decorative to a screen reader rather than a second announcement.
      aria-hidden="true"
      className={`grid place-items-center bg-raised font-semibold text-muted ${base}`}
    >
      {initials(name)}
    </span>
  );
}
