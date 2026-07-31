/**
 * Obraz Open Graph per-agent: portret po prawej (zdjęcie z panelu albo klatka
 * z auto-prezentacji na Cloudflare Stream), po lewej markowy panel z imieniem,
 * rolą, telefonem i adresem własnej podstrony.
 *
 * Po co: agenci rozsyłają swój link (`fibra.pl/agent/justyna`) na WhatsAppie,
 * Messengerze i LinkedInie - podgląd ma pokazywać KONKRETNĄ osobę, a nie
 * ogólną kartę firmy.
 *
 * Gdy nie ma ani zdjęcia, ani filmu - inicjały na markowym tle (nigdy pusty kadr).
 */
import { ImageResponse } from "next/og";
import { getPublicAgentBySlug } from "@/lib/team-query";
import { cloudflareStreamThumbnailViaDeliveryNet } from "@/lib/cloudflare-stream";
import {
  loadOgFonts,
  loadBrandLogoOnDark,
  BRAND_LOGO_RATIO,
  ogColors,
  OG_SIZE,
  OG_CONTENT_TYPE,
  fetchCoverImageDataUri,
  clampText,
} from "@/lib/og";

export const alt = "Agent Fibra Nieruchomości";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Karta odświeżana raz dziennie - zdjęcie/rola zmieniają się rzadko.
export const revalidate = 86400;

/** Szerokość kolumny z portretem (reszta to panel tekstowy). */
const PORTRAIT_W = 470;
/** Szerokość logo Fibry w lewym górnym rogu. */
const LOGO_W = 168;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [agent, fonts, logo] = await Promise.all([
    getPublicAgentBySlug(slug),
    loadOgFonts(),
    loadBrandLogoOnDark().catch(() => null),
  ]);

  // Brak agenta (ukryty / zły slug) - neutralna markowa karta zamiast błędu buildu.
  if (!agent) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ogColors.navy900,
            color: ogColors.white,
            fontFamily: "Instrument Serif",
            fontSize: 64,
          }}
        >
          Fibra Nieruchomości
        </div>
      ),
      { ...size, fonts },
    );
  }

  // Zdjęcie z panelu ma pierwszeństwo; inaczej klatka z filmu auto-prezentacji.
  // `videodelivery.net` działa bez zmiennej z kodem klienta CF, więc render OG
  // nie zależy od konfiguracji środowiska buildu.
  //
  // Klatka z 3. sekundy, nie z pierwszej: na starcie rolek wisi jeszcze plansza
  // z napisami (wypalone w wideo), a po kilku sekundach jest sama osoba.
  const thumb = agent.cloudflareVideoId
    ? cloudflareStreamThumbnailViaDeliveryNet(agent.cloudflareVideoId, {
        time: "3s",
        height: 1920,
      })
    : null;
  // Kadr od samej góry ujęcia: w pionowych rolkach twarz jest wysoko, a na dole
  // podłoga i pasek z napisami. Zero zapasu = zero uciętych głów.
  const frame = { width: PORTRAIT_W * 2, height: OG_SIZE.height * 2, verticalBias: 0 };
  const portrait =
    (await fetchCoverImageDataUri(agent.photoUrl, frame)) ??
    (await fetchCoverImageDataUri(thumb, frame));

  // Role bywają długie i sklejone ukośnikiem („Licencjonowany Agent / Specjalista ds. …") -
  // w karcie zostawiamy pierwszy człon, żeby nie kończyć urwanym „ds…".
  const roleParts = agent.role.split("/").map((p) => p.trim()).filter(Boolean);
  const role = clampText(
    agent.role.length > 52 && roleParts.length > 1 ? roleParts[0] : agent.role,
    52,
  );
  const isFounder = agent.kind === "founder";
  const panelW = OG_SIZE.width - PORTRAIT_W;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: ogColors.navy900,
          fontFamily: "Inter",
          color: ogColors.white,
        }}
      >
        {/* Lewy panel: marka + dane osoby */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: panelW,
            height: "100%",
            padding: "52px 48px 52px 56px",
            backgroundImage: `linear-gradient(135deg, ${ogColors.navy800} 0%, ${ogColors.navy900} 62%)`,
          }}
        >
          {/* Logo marki (wektor z repo) - pewniejsze niż tekst, bo satori nie
              renderuje naszego Instrument Serif i podmieniałby go na Inter. */}
          <div style={{ display: "flex" }}>
            {logo ? (
              <img
                src={logo}
                width={LOGO_W}
                height={Math.round(LOGO_W / BRAND_LOGO_RATIO)}
                style={{ display: "flex" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>Fibra</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: ogColors.brand100,
              }}
            >
              {isFounder ? "Założyciel Fibry" : "Zespół Fibry"}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: agent.name.length > 18 ? 52 : 62,
                fontWeight: 600,
                letterSpacing: -1,
                lineHeight: 1.05,
                color: ogColors.white,
                maxWidth: panelW - 104,
              }}
            >
              {agent.name}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: 24,
                lineHeight: 1.3,
                color: ogColors.brand200,
                maxWidth: panelW - 104,
              }}
            >
              {role}
            </div>

            {agent.phone ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  marginTop: 26,
                  padding: "12px 24px",
                  borderRadius: 14,
                  backgroundColor: ogColors.accent,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {agent.phone}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            fibra.pl/agent/{agent.slug ?? slug}
          </div>
        </div>

        {/* Prawa kolumna: portret (zdjęcie lub klatka z wideo) */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: PORTRAIT_W,
            height: "100%",
            backgroundColor: ogColors.navy800,
          }}
        >
          {portrait ? (
            <img
              src={portrait}
              width={PORTRAIT_W}
              height={OG_SIZE.height}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: `linear-gradient(160deg, ${ogColors.brand500} 0%, ${ogColors.navy800} 100%)`,
                fontFamily: "Instrument Serif",
                fontSize: 150,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {initials(agent.name)}
            </div>
          )}

          {/* Miękkie przejście panel -> zdjęcie, żeby krawędź nie cięła kadru na pół */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 120,
              display: "flex",
              backgroundImage: `linear-gradient(to right, ${ogColors.navy900} 0%, rgba(0,22,35,0) 100%)`,
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
