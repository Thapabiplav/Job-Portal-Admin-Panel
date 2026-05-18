function clientPublicBase() {
  return String(
    import.meta.env.VITE_CLIENT_URL ||
      (typeof window !== "undefined" ? window.location.origin : ""),
  ).replace(/\/+$/, "");
}

function normalizeSlugSegment(slug) {
  if (slug == null || slug === "") return null;
  const segment = String(slug)
    .trim()
    .replace(/^\/+/, "")
    .replace(/^store\//i, "");
  return segment || null;
}

/**
 * Public portfolio / CV URL (root slug).
 * Client route: /:slugId
 */
export function profilePublicUrl(slug) {
  const segment = normalizeSlugSegment(slug);
  if (!segment) return null;
  return `${clientPublicBase()}/${encodeURIComponent(segment)}`;
}

/**
 * Public storefront URL for a user's profile slug (cvSlug).
 * Client route: /store/:slugId
 */
export function storefrontPublicUrl(slug) {
  const segment = normalizeSlugSegment(slug);
  if (!segment) return null;
  return `${clientPublicBase()}/store/${encodeURIComponent(segment)}`;
}
