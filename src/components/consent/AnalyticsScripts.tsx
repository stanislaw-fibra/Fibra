import Script from "next/script";

/**
 * Emituje skrypty trackerskie (GA4, Facebook Pixel) - Cookiebot w trybie
 * `data-blockingmode="auto"` automatycznie BLOKUJE je do czasu uzyskania
 * zgody użytkownika. Atrybuty `data-cookieconsent` jawnie deklarują kategorię
 * dla pewności (auto-blocking + tagowanie = belt-and-suspenders).
 *
 * Kategorie Cookiebot:
 *   - statistics  → analityka (GA4)
 *   - marketing   → remarketing/reklamy (FB Pixel)
 *
 * UWAGA: w trybie z manualnym tagowaniem skrypty mają `type="text/plain"` -
 * Cookiebot przepisuje typ na `application/javascript` po zgodzie.
 */
export function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim();

  return (
    <>
      {gaId ? (
        <>
          <Script
            id="fibra-ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
            type="text/plain"
            data-cookieconsent="statistics"
          />
          <Script
            id="fibra-ga4"
            strategy="afterInteractive"
            type="text/plain"
            data-cookieconsent="statistics"
          >
            {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)});
            `.trim()}
          </Script>
        </>
      ) : null}
      {fbPixelId ? (
        <Script
          id="fibra-fb-pixel"
          strategy="afterInteractive"
          type="text/plain"
          data-cookieconsent="marketing"
        >
          {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(fbPixelId)});
fbq('track', 'PageView');
          `.trim()}
        </Script>
      ) : null}
    </>
  );
}
