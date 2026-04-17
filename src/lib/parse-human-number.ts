/**
 * Parses numeric form values with Polish-style input: spaces, comma or dot as decimal,
 * optional thousands (e.g. 1.234,56 → 1234.56).
 */
export function parseHumanNumber(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const raw = String(v).trim();
  if (raw === "") return null;
  const normalized = normalizeNumberString(raw.replace(/\s/g, ""));
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Integer-ish fields (pokoje, rok…) - zaokrąglenie po parsowaniu. */
export function intFromHumanOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseHumanNumber(v);
  if (n === null) return null;
  return Math.round(n);
}

function normalizeNumberString(s: string): string {
  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount = (s.match(/\./g) ?? []).length;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (commaCount === 1 && dotCount === 0) {
    return s.replace(",", ".");
  }
  if (commaCount >= 2) {
    return s.replace(/,/g, "");
  }
  if (commaCount === 1 && lastComma > lastDot) {
    return s.replace(/\./g, "").replace(",", ".");
  }
  if (dotCount >= 1 && lastDot > lastComma) {
    return s.replace(/,/g, "");
  }
  return s.replace(/,/g, "");
}
