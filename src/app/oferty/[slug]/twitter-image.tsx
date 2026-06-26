// Karta dla X (Twitter) per-oferta = ta sama grafika co Open Graph.
// `revalidate` to konfiguracja segmentu - Next wymaga deklaracji wprost
// (nie da się jej re-eksportować), dlatego powtarzamy ją tu jawnie.
export const revalidate = 86400;
export { default, alt, size, contentType } from "./opengraph-image";
