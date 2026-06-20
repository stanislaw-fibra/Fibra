/* -------------------------------------------------------------------------
   Stałe kursu „20 Lekcji Inwestora" - współdzielone przez stronę (page.tsx),
   przyciski CTA (CourseCta) i pasek Sticky. Trzymane w jednym miejscu, żeby
   cena/koszyk/ID produktu były spójne wszędzie (w tym w zdarzeniu AddToCart).

   CHECKOUT_URL: produkt 21500 w Imkerze (czysta historia cen). Identyczny
   ID jest też w webhooku: src/app/api/imker/webhook/route.ts (COURSE_PRODUCT_ID).
   ------------------------------------------------------------------------- */
export const CHECKOUT_URL = "https://bartosznosiadek.salescrm.pl/cart/add_product/21500";

/** Stała cena kursu (nie promocja - nie przekreślamy). */
export const PRICE = "177 zł";

/** Cena liczbowo - do parametru `value` zdarzenia AddToCart (Meta CAPI/piksel). */
export const PRICE_VALUE = 177;
export const CURRENCY = "PLN";

/** ID i nazwa produktu - do `content_ids`/`content_name` w zdarzeniu. */
export const COURSE_PRODUCT_ID = "21500";
export const COURSE_CONTENT_NAME = "20 Lekcji Inwestora";

/** Kotwica sekcji „Co dostajesz + cena" - cel przycisków-zachęt z góry strony. */
export const ORDER_ANCHOR = "#zamow";
