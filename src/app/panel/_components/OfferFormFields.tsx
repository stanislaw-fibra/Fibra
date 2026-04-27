type Agent = { id: string; name: string };

type Defaults = Partial<{
  id: string;
  galactica_offer_id: string;
  category: string;
  listing_type: string;
  title: string;
  advertisement_text: string;
  description: string;
  price: number | null;
  city: string;
  district: string;
  area_usable: number | null;
  area_total: number | null;
  area_plot: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  parking_spaces: number | null;
  heating: string;
  building_material: string;
  building_state: string;
  property_state: string;
  kitchen_type: string;
  market_type: string;
  virtual_tour_url: string;
  floor_plan_image_url: string;
  floor_plan_pdf_url: string;
  is_active: boolean;
  is_exclusive: boolean;
  is_price_negotiable: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_basement: boolean;
  has_garden: boolean;
  has_loggia: boolean;
  has_elevator: boolean;
  has_air_conditioning: boolean;
  agent_id: string;
}>;

type Props = {
  action: (formData: FormData) => Promise<void>;
  agents: Agent[];
  defaults?: Defaults;
  submitLabel: string;
};

const CATEGORIES = [
  ["mieszkania", "Mieszkania"],
  ["domy", "Domy"],
  ["dzialki", "Działki"],
  ["lokale", "Lokale"],
] as const;

const LISTING = [
  ["sprzedaz", "Sprzedaż"],
  ["wynajem", "Wynajem"],
] as const;

const selectLight =
  "panel-select panel-select--light mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300/90 bg-paper py-3 pl-4 pr-10 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400";

function formatPlNumber(n: number | null | undefined, maxFrac: number): string {
  if (n == null) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat("pl-PL", {
    useGrouping: false,
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(num);
}

function inp(
  name: string,
  label: string,
  opts?: {
    type?: string;
    defaultValue?: string | number | null;
    required?: boolean;
    rows?: number;
    step?: string;
    /** Liczby z przecinkiem/kropką - pole tekstowe, parsowanie po stronie serwera */
    humanDecimal?: boolean;
    /** Liczby całkowite (pokoje itd.) */
    humanInt?: boolean;
  },
) {
  const { type = "text", defaultValue = "", required, rows, step, humanDecimal, humanInt } = opts ?? {};
  let dv = "";
  if (humanDecimal && (typeof defaultValue === "number" || defaultValue != null)) {
    dv = formatPlNumber(typeof defaultValue === "number" ? defaultValue : Number(defaultValue), 8);
  } else if (humanInt && (typeof defaultValue === "number" || defaultValue != null)) {
    dv = formatPlNumber(typeof defaultValue === "number" ? defaultValue : Number(defaultValue), 0);
  } else if (defaultValue !== null && defaultValue !== undefined) {
    dv = String(defaultValue);
  }

  const fieldClass =
    "mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300/90 bg-paper px-4 py-3 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400";

  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">{label}</span>
      {rows ? (
        <textarea
          name={name}
          required={required}
          rows={rows}
          defaultValue={dv}
          className={fieldClass}
        />
      ) : humanDecimal || humanInt ? (
        <input
          name={name}
          type="text"
          inputMode={humanDecimal ? "decimal" : "numeric"}
          autoComplete="off"
          required={required}
          defaultValue={dv}
          placeholder={humanDecimal ? "np. 65,5 lub 65.5" : undefined}
          className={fieldClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={dv}
          className={fieldClass}
        />
      )}
    </label>
  );
}

function chk(name: string, label: string, defaultChecked?: boolean) {
  return (
    <label className="panel-checkbox-label">
      <input type="checkbox" name={name} value="on" defaultChecked={defaultChecked} className="panel-checkbox" />
      <span className="panel-checkbox-box shrink-0" aria-hidden />
      <span className="text-[13px] text-ink-700 leading-snug">{label}</span>
    </label>
  );
}

export function OfferFormFields({ action, agents, defaults, submitLabel }: Props) {
  const d = defaults ?? {};

  return (
    <form action={action} className="space-y-10 max-w-4xl">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      {d.galactica_offer_id && (
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">ID (Galactica / ręczne)</span>
          <input
            readOnly
            value={d.galactica_offer_id}
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50 px-4 py-3 text-[14px] text-ink-600"
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Kategoria *</span>
          <select name="category" required defaultValue={d.category ?? "mieszkania"} className={selectLight}>
            {CATEGORIES.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Typ *</span>
          <select name="listing_type" required defaultValue={d.listing_type ?? "sprzedaz"} className={selectLight}>
            {LISTING.map(([v, lab]) => (
              <option key={v} value={v}>
                {lab}
              </option>
            ))}
          </select>
        </label>
      </div>

      {inp("title", "Tytuł *", { defaultValue: d.title, required: true })}
      {inp("advertisement_text", "Tekst reklamowy (krótki)", { defaultValue: d.advertisement_text })}
      {inp("description", "Opis", { defaultValue: d.description, rows: 8 })}

      <div className="grid sm:grid-cols-2 gap-5">
        {inp("price", "Cena (PLN)", { humanDecimal: true, defaultValue: d.price })}
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Widoczność na stronie</span>
          <select name="is_active" defaultValue={d.is_active === false ? "false" : "true"} className={selectLight}>
            <option value="true">Aktywna</option>
            <option value="false">Nieaktywna</option>
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {inp("city", "Miasto", { defaultValue: d.city })}
        {inp("district", "Dzielnica", { defaultValue: d.district })}
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {inp("area_usable", "Pow. użytkowa (m²)", { humanDecimal: true, defaultValue: d.area_usable })}
        {inp("area_total", "Pow. całkowita (m²)", { humanDecimal: true, defaultValue: d.area_total })}
        {inp("area_plot", "Pow. działki (m²)", { humanDecimal: true, defaultValue: d.area_plot })}
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {inp("rooms", "Pokoje", { humanInt: true, defaultValue: d.rooms })}
        {inp("bedrooms", "Sypialnie", { humanInt: true, defaultValue: d.bedrooms })}
        {inp("bathrooms", "Łazienki", { humanInt: true, defaultValue: d.bathrooms })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {inp("floor", "Piętro", { humanInt: true, defaultValue: d.floor })}
        {inp("floors_total", "Pięter w budynku", { humanInt: true, defaultValue: d.floors_total })}
        {inp("year_built", "Rok budowy", { humanInt: true, defaultValue: d.year_built })}
        {inp("parking_spaces", "Miejsca parkingowe", { humanInt: true, defaultValue: d.parking_spaces })}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {inp("heating", "Ogrzewanie", { defaultValue: d.heating })}
        {inp("building_material", "Materiał budowy", { defaultValue: d.building_material })}
        {inp("building_state", "Stan budynku", { defaultValue: d.building_state })}
        {inp("property_state", "Stan nieruchomości", { defaultValue: d.property_state })}
        {inp("kitchen_type", "Typ kuchni", { defaultValue: d.kitchen_type })}
        {inp("market_type", "Rynek (tekst)", { defaultValue: d.market_type })}
        {inp("virtual_tour_url", "Link wirtualnej wizyty", { defaultValue: d.virtual_tour_url })}
        {inp("floor_plan_image_url", "Rzut (zdjęcie URL)", { defaultValue: d.floor_plan_image_url })}
        {inp("floor_plan_pdf_url", "Rzut (PDF URL)", { defaultValue: d.floor_plan_pdf_url })}
      </div>

      <label className="block max-w-md">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Agent</span>
        <select name="agent_id" defaultValue={d.agent_id ?? ""} className={selectLight}>
          <option value="">- brak -</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-[var(--radius-md)] border border-ink-200/80 bg-paper-warm p-5 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Atuty</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {chk("is_exclusive", "Wyłączność", d.is_exclusive)}
          {chk("is_price_negotiable", "Cena do negocjacji", d.is_price_negotiable)}
          {chk("has_balcony", "Balkon", d.has_balcony)}
          {chk("has_terrace", "Taras", d.has_terrace)}
          {chk("has_basement", "Piwnica", d.has_basement)}
          {chk("has_garden", "Ogród", d.has_garden)}
          {chk("has_loggia", "Loggia", d.has_loggia)}
          {chk("has_elevator", "Winda", d.has_elevator)}
          {chk("has_air_conditioning", "Klimatyzacja", d.has_air_conditioning)}
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex rounded-full bg-brand-500 hover:bg-accent-400 hover:text-ink-950 text-white text-[14px] font-medium px-8 py-3.5 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
