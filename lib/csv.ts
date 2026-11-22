export function csvCell(value: unknown) {
  const text = String(value ?? '');
  // Customer-supplied text must stay text when opened in spreadsheet software.
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
