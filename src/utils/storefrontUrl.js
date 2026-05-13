/**
 * Public storefront URL for a user's profile slug (cvSlug).
 * Client route: /store/:slugId
 */
export function storefrontPublicUrl(slug) {
  if (slug == null || slug === "") return null;
  const base = String(
    import.meta.env.VITE_CLIENT_URL ||
      (typeof window !== "undefined" ? window.location.origin : ""),
  ).replace(/\/+$/, "");
  const segment = String(slug)
    .trim()
    .replace(/^\/+/, "")
    .replace(/^store\//i, "");
  if (!segment) return null;
  return `${base}/store/${encodeURIComponent(segment)}`;
}
