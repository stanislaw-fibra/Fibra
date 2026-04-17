export const FIBRA_CONSENT_COOKIE = "fibra_consent";
export const FIBRA_CONSENT_UPDATED_EVENT = "fibra-consent-updated";

export type FibraConsentValue = "all" | "essential";

export function readFibraConsent(): FibraConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${FIBRA_CONSENT_COOKIE}=([^;]*)`));
  if (!match) return null;
  const v = decodeURIComponent(match[1].trim());
  if (v === "all" || v === "essential") return v;
  return null;
}

export function writeFibraConsent(value: FibraConsentValue): void {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${FIBRA_CONSENT_COOKIE}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function notifyFibraConsentUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FIBRA_CONSENT_UPDATED_EVENT));
}
