export const formatOrderVariantLine = (color, size) => {
  const c = String(color ?? "").trim();
  const s = String(size ?? "").trim();
  if (!c && !s) return "";
  const parts = [];
  if (c) parts.push(`Color=${c}`);
  if (s) parts.push(`Size=${s}`);
  return `Variant: ${parts.join(", ")}`;
};
