/**
 * HTML-escape a value for safe interpolation into an HTML string. Use this for
 * any user-supplied text that ends up in a document that gets written to the
 * DOM (e.g. the printable PDF/agenda exporters, which document.write() into a
 * same-origin window — unescaped input there is DOM XSS).
 */
export function escapeHtml(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
