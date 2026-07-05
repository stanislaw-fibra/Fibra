// Globalne typy wskaźników analitycznych wstrzykiwanych na `window`:
// GA4 (gtag) i Meta Pixel (fbq). Trzymane w JEDNYM miejscu, żeby uniknąć
// konfliktu zduplikowanych `declare global` w wielu komponentach
// (TS: "Subsequent property declarations must have the same type").
//
// Sygnatury są celowo luźne (wariadyczne), żeby pasowały do wszystkich wywołań:
//   window.gtag?.("event", "phone_click", { ... })
//   window.fbq?.("track", "Lead", { ... })

interface Window {
  gtag?: (command: string, ...params: unknown[]) => void;
  fbq?: (command: string, ...params: unknown[]) => void;
}
