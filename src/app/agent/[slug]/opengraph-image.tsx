/**
 * Obraz Open Graph per-agent: wyśrodkowany „medalion" - logo, okrągły portret,
 * imię, rola i telefon - na rozmytym tle z tego samego zdjęcia.
 *
 * DLACZEGO WSZYSTKO NA ŚRODKU (uwaga Romana, 31.07.2026): karta 1200x630 wygląda
 * dobrze tylko tam, gdzie serwis pokazuje ją w całości. W KOMENTARZU na Facebooku
 * podgląd jest kwadratową miniaturą przyciętą do środka - poprzedni układ (tekst
 * z lewej, zdjęcie z prawej) pokazywał wtedy ucięte słowo i skrawek zdjęcia.
 * Teraz cała treść mieści się w środkowym kwadracie 630x630, więc mała miniatura
 * jest kompletną wizytówką, a szeroka karta - tą samą wizytówką z tłem.
 *
 * Portret: zdjęcie z panelu, a gdy go nie ma - klatka z auto-prezentacji.
 * Bez jednego i drugiego zostają inicjały na markowym tle.
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
  fetchImageBuffer,
  coverImageDataUri,
  blurredBackdropDataUri,
  clampText,
} from "@/lib/og";

export const alt = "Agent Fibra Nieruchomości";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Karta odświeżana raz dziennie - zdjęcie/rola zmieniają się rzadko.
export const revalidate = 86400;

/** Średnica okrągłego portretu. */
const AVATAR = 250;
/** Szerokość logo nad portretem. */
const LOGO_W = 150;
/**
 * Bezpieczna szerokość treści = wysokość karty. Tyle widać w kwadratowej
 * miniaturze, więc nic ważnego nie może z tego wystawać.
 */
const SAFE_W = OG_SIZE.height;

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
  // `videodelivery.net` działa bez zmiennej z kodem klienta CF, a klatkę bierzemy
  // z 3. sekundy, bo na starcie rolek wisi plansza z wypalonymi napisami.
  const thumb = agent.cloudflareVideoId
    ? cloudflareStreamThumbnailViaDeliveryNet(agent.cloudflareVideoId, {
        time: "3s",
        height: 1920,
      })
    : null;
  const source =
    (await fetchImageBuffer(agent.photoUrl)) ?? (await fetchImageBuffer(thumb));

  // Kółko: największy możliwy kwadrat, wyśrodkowany w poziomie i osadzony tuż pod
  // górną krawędzią. Zbliżanie kadru („zoom") odpada - przy ciasnych portretach
  // ucinało brodę, a zysk przy zdjęciach całej sylwetki był niewielki.
  // Tło rozmywamy z tego samego pliku.
  const [avatar, backdrop] = await Promise.all([
    coverImageDataUri(source, {
      width: AVATAR * 2,
      height: AVATAR * 2,
      verticalBias: 0.05,
    }),
    blurredBackdropDataUri(source, { width: OG_SIZE.width, height: OG_SIZE.height }),
  ]);

  // Role bywają długie i sklejone kreską („Agent Nieruchomości | Specjalista ds. …") -
  // w karcie zostawiamy pierwszy człon, żeby nie kończyć urwanym „ds…".
  const roleParts = agent.role.split(/[/|]/).map((p) => p.trim()).filter(Boolean);
  const role = clampText(
    agent.role.length > 46 && roleParts.length > 1 ? roleParts[0] : agent.role,
    46,
  );
  const nameSize = agent.name.length > 20 ? 42 : agent.name.length > 15 ? 48 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: ogColors.navy900,
          fontFamily: "Inter",
          color: ogColors.white,
        }}
      >
        {/* Tło: rozmyte zdjęcie albo markowy gradient */}
        {backdrop ? (
          <img
            src={backdrop}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              backgroundImage: `linear-gradient(135deg, ${ogColors.navy800} 0%, ${ogColors.navy900} 100%)`,
            }}
          />
        )}

        {/* Przyciemnienie - żeby biały tekst trzymał kontrast na każdym zdjęciu */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(0,16,26,0.92) 0%, rgba(0,16,26,0.72) 30%, rgba(0,16,26,0.72) 70%, rgba(0,16,26,0.92) 100%)",
          }}
        />

        {/* Kolumna treści - mieści się w środkowym kwadracie karty */}
        <div
          style={{
            position: "relative",
            width: SAFE_W,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 40px 34px",
          }}
        >
          {logo ? (
            <img
              src={logo}
              width={LOGO_W}
              height={Math.round(LOGO_W / BRAND_LOGO_RATIO)}
              style={{ display: "flex" }}
            />
          ) : (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>FIBRA</div>
          )}

          {/* Portret w kółku z pomarańczową obwódką */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 26,
              width: AVATAR,
              height: AVATAR,
              borderRadius: AVATAR,
              border: `4px solid ${ogColors.accent}`,
              backgroundColor: ogColors.navy800,
              overflow: "hidden",
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                width={AVATAR}
                height={AVATAR}
                style={{
                  width: AVATAR,
                  height: AVATAR,
                  borderRadius: AVATAR,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Instrument Serif",
                  fontSize: 96,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {initials(agent.name)}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: nameSize,
              fontWeight: 600,
              letterSpacing: -0.8,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            {agent.name}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 21,
              lineHeight: 1.3,
              color: ogColors.brand100,
              textAlign: "center",
            }}
          >
            {role}
          </div>

          {agent.phone ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 20,
                padding: "10px 24px",
                borderRadius: 12,
                backgroundColor: ogColors.accent,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {agent.phone}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 19,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            fibra.pl/agent/{agent.slug ?? slug}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
