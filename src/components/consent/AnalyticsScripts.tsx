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
// fbclid z URL -> utrwalamy _fbc (format Meta: fb.1.<ts>.<fbclid>) i kopię
// w cookie pierwszej strony (fibra_fbclid), żeby doklejać go do koszyka na
// salescrm.pl. Ten skrypt odpala Cookiebot dopiero po zgodzie marketingowej,
// więc zapis tych cookies jest z definicji za zgodą.
(function(){try{
  var cid=new URLSearchParams(location.search).get('fbclid');
  if(cid){
    if(!/(?:^|; )_fbc=/.test(document.cookie)){
      document.cookie='_fbc=fb.1.'+Date.now()+'.'+cid+'; path=/; max-age=7776000; samesite=Lax';
    }
    document.cookie='fibra_fbclid='+cid+'; path=/; max-age=7776000; samesite=Lax';
  }
}catch(e){}})();
// Wspólny event_id dla piksela i CAPI -> Meta deduplikuje PageView.
// MetaPixelPageView (klient) odczyta go i dośle PageView serwerowo z fbc/IP/UA.
window.__fbPageViewId=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():('pv-'+Date.now()+'-'+Math.round(Math.random()*1e9));
fbq('track', 'PageView', {}, {eventID: window.__fbPageViewId});
          `.trim()}
        </Script>
      ) : null}
    </>
  );
}
