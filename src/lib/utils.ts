/** Append a hex alpha suffix to a CSS hex color. e.g. tint("#2563eb", "22") → "#2563eb22" */
export function tint(hex: string, alpha: string): string {
  return hex + alpha;
}
