/** Format a year string as two characters per line, with range dash on its own line. */
export function formatVerticalYear(yearStr) {
  if (!yearStr) return "";
  const normalized = yearStr.trim();
  const rangeMatch = normalized.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
  if (rangeMatch) {
    const [, start, end] = rangeMatch;
    return [
      start.slice(0, 2),
      start.slice(2, 4),
      " - ",
      end.slice(0, 2),
      end.slice(2, 4),
    ].join("\n");
  }
  const singleMatch = normalized.match(/^(\d{4})$/);
  if (singleMatch) {
    const year = singleMatch[1];
    return [year.slice(0, 2), year.slice(2, 4)].join("\n");
  }
  return normalized.replace(/\D/g, "").match(/.{1,2}/g)?.join("\n") || normalized;
}
