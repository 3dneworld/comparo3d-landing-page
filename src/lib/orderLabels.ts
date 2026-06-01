export function formatPublicOrderLabel(
  publicOrderId?: string | null,
  fallbackId?: number | string | null
) {
  const publicValue = String(publicOrderId ?? "").trim();
  if (publicValue) return /^\d+$/.test(publicValue) ? `#${publicValue}` : publicValue;

  const fallbackValue = String(fallbackId ?? "").trim();
  return fallbackValue ? `#${fallbackValue}` : "";
}
