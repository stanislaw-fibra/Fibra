import json, re
d = json.load(open('scripts/out-parter-ogrody.json'))
p = 'src/lib/investments/zamyslow-data.ts'
s = open(p, encoding='utf-8').read()

# 1) typ ogródka + pole w FloorPlan
old_t = '''export type FloorPlan = {
  image: string;
  viewBox: { width: number; height: number };
  units: FloorPlanUnit[];
  annotations?: FloorPlanAnnotation[];
};'''
assert old_t in s
s = s.replace(old_t, '''/**
 * Ogródek przynależny do lokalu na parterze (aranżacja architekta 26.08.2026).
 * `d` bywa ścieżką z KILKU podścieżek - ogródek M6 jest przecięty tarasem na
 * dwa kawałki, a kupujący ma jeden ogródek, nie dwa.
 */
export type FloorPlanGarden = {
  /** Id lokalu, do którego ogródek należy („M5"). */
  unit: string;
  areaM2: number;
  d: string;
  label: { x: number; y: number };
};

export type FloorPlan = {
  image: string;
  viewBox: { width: number; height: number };
  units: FloorPlanUnit[];
  annotations?: FloorPlanAnnotation[];
  /** Tylko parter - pozostałe kondygnacje nie mają ogródków. */
  gardens?: FloorPlanGarden[];
};''')

# 2) blok parteru: granice
start = s.index('      floorPlan: {\n        image: "/investments/zamyslow/floorplans/floor-ground-plan.webp"')
end = s.index('      id: "floor-1"', start)
end = s.rindex('    {\n', start, end)
block = s[start:end]

# obraz + viewBox
block = block.replace('image: "/investments/zamyslow/floorplans/floor-ground-plan.webp"',
                      f'image: "{d["image"]}"')
block = block.replace('viewBox: { width: 906, height: 500.5 }',
                      f'viewBox: {{ width: {d["viewBox"]["width"]}, height: {d["viewBox"]["height"]} }}')

# adnotacje
ann = "\n".join(
    f'          {{ text: "{a["text"]}", x: {a["x"]}, y: {a["y"]}'
    + (f', rotate: {a["rotate"]}' if 'rotate' in a else '') + ' },'
    for a in d['annotations'])
block = re.sub(r'        annotations: \[\n(?:.*?\n)*?        \],',
               f'        annotations: [\n{ann}\n        ],', block, count=1)

# strefy: podmiana d i label WEWNĄTRZ bloku każdego lokalu (reszta zostaje)
zones = {z['id']: z for z in d['zones']}
for uid, z in zones.items():
    m = re.search(r'(\n          \{\n            id: "%s",.*?\n          \},)' % uid, block, re.S)
    assert m, uid
    u = m.group(1)
    u2 = re.sub(r'\n(\s+)d: "[^"]*"', lambda m: '\n%sd: "%s"' % (m.group(1), z['d']), u, count=1)
    assert u2 != u and ('id: "%s",' % uid) in u2, uid
    u2 = re.sub(r'label: \{ x: [\d.-]+, y: [\d.-]+ \}',
                'label: { x: %s, y: %s }' % (z['label']['x'], z['label']['y']), u2, count=1)
    block = block.replace(u, u2, 1)

# ogródki - przed units
gard = "\n".join(
    f'          {{\n            unit: "{g["unit"]}",\n            areaM2: {g["areaM2"]},\n'
    f'            d: "{g["d"]}",\n            label: {{ x: {g["label"]["x"]}, y: {g["label"]["y"]} }},\n          }},'
    for g in d['gardens'])
block = block.replace('        units: [',
'''        // Ogródki przynależne do lokali parteru (aranżacja z 26.08.2026).
        // Powierzchnie z opisów architekta, obrysy wytrasowane z rysunku -
        // patrz `scripts/zamyslow-parter-ogrody.mjs`.
        gardens: [
''' + gard + '''
        ],
        units: [''', 1)

block = block.replace('''      // Parter ma WŁASNY kadr - tarasy wychodzą dalej niż balkony na piętrach,
      // więc wspólne okno by je ucięło. Strefy przeliczone ze wspólnego układu
      // (z kompensacją przesunięcia arkusza) i dociągnięte do granic kolorów.''',
'''      // Parter ma WŁASNY kadr i własny skrypt (`zamyslow-parter-ogrody.mjs`):
      // od aranżacji z 26.08.2026 rzut obejmuje też ogródki, więc kadr sięga
      // poza budynek. Strefy lokali przeliczone z poprzedniego, skalibrowanego
      // rzutu - rysunek budynku jest bez zmian (ta sama skala 1:100).''')

s = s[:start] + block + s[end:]

helper = """

/**
 * Ogródek przynależny do lokalu (tylko parter). Jedno źródło dla rzutu piętra
 * i strony oferty, żeby metraż ogródka nie rozjechał się między nimi.
 */
export function zamyslowGardenFor(unitId: string): FloorPlanGarden | null {
  for (const floor of zamyslowData.floors) {
    const g = floor.floorPlan?.gardens?.find((x) => x.unit === unitId.toUpperCase());
    if (g) return g;
  }
  return null;
}
"""
if "zamyslowGardenFor" not in s:
    s = s.rstrip() + helper

open(p, 'w', encoding='utf-8').write(s)
print("ok")
