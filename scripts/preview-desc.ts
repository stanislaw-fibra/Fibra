/**
 * Pokazuje cleaned description dla FIB-MW-4131 — diagnostyka pełnego output.
 *
 * XML_PATH=oferty.xml npx tsx scripts/preview-desc.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";
import { mapOffer } from "../src/lib/importer/field-mapper";

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);
  const offerId = process.env.OFFER_ID ?? "FIB-MW-4131";
  const raw = parsed.offers.find((o) => o.id === offerId);
  if (!raw) {
    console.error(`${offerId} nie znaleziona`);
    process.exit(1);
  }
  const m = mapOffer(raw);
  console.log(m.description ?? "");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
