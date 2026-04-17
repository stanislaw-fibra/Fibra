"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { FIBRA_CONSENT_UPDATED_EVENT, readFibraConsent } from "@/lib/fibra-consent";

export function AnalyticsScripts() {
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    function sync() {
      setAllowAnalytics(readFibraConsent() === "all");
    }
    sync();
    window.addEventListener(FIBRA_CONSENT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(FIBRA_CONSENT_UPDATED_EVENT, sync);
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim();

  if (!allowAnalytics) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="fibra-ga4" strategy="afterInteractive">
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
        <Script id="fibra-fb-pixel" strategy="afterInteractive">
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
