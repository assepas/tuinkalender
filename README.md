# TuinTaak

TuinTaak is je persoonlijke tuinkalender: per maand zie je welke onderhoudstaken horen bij
de planten die je hebt staan, afgestemd op regio Utrecht. Geen backend —
de gedeelde plantendata zit in de repo, je eigen tuin staat lokaal in de
browser, en delen gaat via een JSON-export of dezelfde gehoste app.

## Snel starten

```bash
npm install
npm run dev
```

Open de getoonde localhost-URL. `npm run dev` bouwt eerst automatisch de
databundel uit `/data` (via de `predev`-hook), dus wijzigingen in
soortbestanden zijn zichtbaar na een herstart van de dev-server.

Productie-build (valideert data, bundelt, en bouwt naar `dist/`):

```bash
npm run build
npm run preview   # lokaal een build-preview bekijken
```

`dist/` is een volledig statische map — zet hem op GitHub Pages, Cloudflare
Pages, Netlify, of gewoon een eigen server. Geen server-side logica nodig.

Tests:

```bash
npm test
```

## Hoe het in elkaar zit

```
data/               Broninformatie — dit bewerk je om de app uit te breiden
├─ species/*.json      Eén bestand per plant: taken + wanneer
├─ taskTypes.json      Taaktypes met label + kleur (nieuw type = nieuwe regel)
├─ regions/*.json       Regioprofiel (vorstdata Utrecht)
└─ schema/*.json        JSON Schema's — vangen tikfouten in de data op

design/
└─ icon-source.svg     Bronbestand voor de PWA-iconen in public/icons/ (zie daar voor regenereren)

public/                Statisch meegekopieerd naar dist/ (Vite publicDir)
├─ manifest.json        PWA-manifest (naam, iconen, standalone-modus)
├─ sw.js                 Service worker: cachet de app-shell voor offline gebruik
└─ icons/                icon-192.png, icon-512.png, apple-touch-icon.png

scripts/
├─ build-species.mjs    Bundelt /data naar src/lib/generated/data.js
└─ validate.mjs         Valideert /data tegen de schema's (draait vóór elke build)

src/
├─ lib/domain/          Pure logica, geen Svelte, geen browser-API's
│  ├─ windows.js           Wanneer is een taak actief (dates/recurring/relative)
│  ├─ calendar.js          tuin + soorten + regio → 12 maanden met taken
│  ├─ migrate.js           Migratieketen voor het opgeslagen tuindocument
│  └─ backup.js            Puur: is de laatste export lang genoeg geleden voor een waarschuwing?
├─ lib/storage/
│  ├─ garden.js             localStorage lezen/schrijven/export/import + lastExportedAt
│  └─ persistence.js        navigator.storage.persist() aanvragen (best-effort)
├─ lib/state/garden.svelte.js   Reactieve laag (Svelte 5 runes) boven de repository
└─ components/
   ├─ CalendarView.svelte, MonthCard.svelte      Maandoverzicht
   ├─ TimelineView.svelte, DetailModal.svelte    Tijdlijn + klikbare details
   ├─ Icon.svelte, PlantIcon.svelte, NativeBadge.svelte   Parametrische iconen/badges
   ├─ GardenEditor.svelte, SpeciesPicker.svelte   Tuinbeheer (incl. back-up-waarschuwing + export)
   └─ PrintView.svelte, Legend.svelte             Print + legenda

tests/                 Vitest — vooral gericht op lib/domain
```

De regel die de boel onderhoudbaar houdt: **`src/lib/domain/` importeert
niets uit Svelte of `window`**. Zolang dat zo blijft, is de rekenkern apart
te testen en zelfs te hergebruiken buiten deze app.

## Twee manieren om je kalender te bekijken

- **Maandoverzicht** — per maand een kaart met wat er die maand te doen is.
  Handig voor "wat moet ik nu doen".
- **Tijdlijn** — per plant één regel over de 12 maanden: de bloeiperiode is
  een doorlopende balk in bloemkleur, en de taken staan als icoontjes per
  maand eroverheen (bij meerdere taken in één maand naast elkaar). Elke soort
  staat er maar één keer op, ook als je hem meerdere keren in je tuin hebt.
  Alleen de taaktypes met `"timeline": true` doen mee: zaaien (kas / volle
  grond), planten, bemesten, snoeien (hoofd / licht), oogsten en overig
  onderhoud.
  Klik op het plant-icoon voor soortinfo, of op een icoon/de bloeibalk voor
  de details.

## Een nieuwe plant toevoegen

Maak een bestand `data/species/<id>.json` aan, bijvoorbeeld:

```json
{
  "schemaVersion": 1,
  "id": "courgette",
  "name": "Courgette",
  "category": "groente",
  "nativeStatus": "exoot",
  "appearance": { "shape": "bloem", "flowerColor": "#E8873A", "flowerColorName": "oranje" },
  "bloom": { "from": "07-01", "to": "08-15" },
  "tasks": [
    { "id": "zaaien", "type": "zaaien",
      "window": { "kind": "relative", "anchor": "lastFrost", "fromWeeks": 0, "toWeeks": 2 } },
    { "id": "water", "type": "water",
      "window": { "kind": "recurring", "from": "06-01", "to": "09-15", "every": "week" } },
    { "id": "oogsten", "type": "oogsten",
      "window": { "kind": "dates", "from": "07-01", "to": "10-01" } }
  ]
}
```

`nativeStatus`, `appearance` en `bloom` zijn optioneel — laat ze weg en de
plant verschijnt gewoon zonder badge/bloei-lane in de tijdlijn. Waarden:

- `nativeStatus`: `inheems` | `archeofyt` | `exoot` | `onbekend` (dat laatste
  ook voor soort-onzekerheid, zoals bij een verzamelnaam als `Hosta spp.`)
- `appearance.shape`: `bloem` | `kruid` | `bes` | `boom` | `bol` | `struik`
  — bepaalt welk icoonsilhouet getekend wordt
- `appearance.flowerColor`: een hex-kleur — kleurt zowel het plant-icoon als
  de bloei-balk in de tijdlijn. Lichte/witte kleuren krijgen automatisch een
  donkerdere rand (`src/lib/domain/color.js`) zodat ze zichtbaar blijven
- Op een snoeitaak kan `"importance": "licht"` staan (standaard `"hoofd"`) om
  in de tijdlijn onderscheid te maken tussen verplichte en optionele snoei
- Op een zaaitaak kan `"location": "kas"` staan (standaard `"grond"`, dus
  volle grond) voor voorzaaien in de kas of binnen — die krijgt in de
  tijdlijn een eigen icoon

Drie soorten `window`:

| kind        | velden                          | gebruik voor |
|-------------|----------------------------------|--------------|
| `dates`     | `from`, `to` (MM-DD)             | vaste kalenderdata, mag jaargrens overschrijden (bv. `"11-15"` → `"02-28"`) |
| `recurring` | `from`, `to`, `every` (`week` \| `2weeks` \| `month`) | een periode met een herhaalfrequentie, voor het label in de UI |
| `relative`  | `anchor` (`lastFrost`\|`firstFrost`\|`soilWarm`), `fromWeeks`, `toWeeks` | t.o.v. een regio-datum, bv. "2 weken na de laatste vorst" |

Optioneel: `"conditions": { "position": ["kas"], "soil": ["zand"] }` op een
taak beperkt hem tot plantingen met die standplaats/grondsoort.

Draai daarna `npm run validate` (of gewoon `npm run dev`/`build`, die roepen
het zelf aan) — een tikfout of onbekend taaktype wordt direct gemeld met
bestandsnaam en reden.

## Een nieuw taaktype toevoegen

Voeg een regel toe aan `data/taskTypes.json`:

```json
{ "id": "afdekken", "label": "Afdekken", "color": "#7A5C8C", "icon": "snowflake", "timeline": true }
```

- `icon`: één van de bestaande glyph-namen in `src/components/Icon.svelte`
  (`seed`, `seed-kas`, `sprout`, `droplet`, `leaf`, `scissors`, `split`,
  `snowflake`, `basket`, `poop`, `ellipsis`, `dot`, `dot-outline`) — voor een echt nieuw icoon voeg je
  daar één `{#if name === "..."}`-tak toe
- `timeline`: `true` om het type als icoontje in de tijdlijn te tonen. Laat
  het weg en het type staat alleen in het maandoverzicht en de printweergave.
  De volgorde in dit bestand is de volgorde waarin icoontjes binnen één
  maand naast elkaar komen.
- Optioneel: varianten met een eigen label/icoon, gekozen op een veld van de
  taak. Zie `zaaien` (`"variantBy": "location"`) en `snoeien`
  (`"variantBy": "importance"`), met `"defaultVariant"` voor taken zonder
  dat veld; `"light": true` op een variant tekent het icoon dun/gestippeld.

Er is verder geen code die deze lijst kent — kleur en label in het
maandoverzicht, de tijdlijn, de legenda en de printweergave komen
automatisch mee.

## Een nieuwe regio toevoegen

Nieuw bestand in `data/regions/`, met dezelfde vorm als
`nl-utrecht.json`. Op dit moment kiest de app altijd `nl-utrecht` als
standaard (zie `DEFAULT_REGION` in `src/lib/storage/garden.js`) — voor
meerdere regio's zou je daar een keuzemenu aan toevoegen.

## Per plant afwijken van de standaardtaken

In **Mijn tuin** kun je per plant:
- individuele taken uitvinken (`mutedTasks`) — bijvoorbeeld "opbinden" als
  je tomaten geen kas hebben;
- straks handmatig `extraTasks` toevoegen aan het tuin-JSON-bestand voor een
  taak die alleen voor die ene plant geldt (dit heeft nog geen UI, maar het
  datamodel en `buildCalendar()` ondersteunen het al — zie
  `tests/calendar.test.js` voor een voorbeeld).

## Installeren als app (belangrijk voor je data)

De app is een installeerbare PWA (`public/manifest.json` + `public/sw.js`,
handmatig geregistreerd in `src/main.js` — geen extra dependency). Dat is
niet alleen fijn voor het gebruiksgemak, het is ook een vangnet voor je
tuindata:

- **iOS Safari** ruimt localStorage van een gewoon open tabblad soms op na
  een periode zonder bezoek. Een pagina die je via **Deel-icoon → Zet op
  beginscherm** installeert draait als een eigen standalone-app-instantie
  (dankzij `apple-mobile-web-app-capable` in `index.html`), los van Safari
  zelf — die opslag wordt niet op dezelfde manier opgeruimd.
- Bij het opstarten vraagt de app via `navigator.storage.persist()`
  (`src/lib/storage/persistence.js`) ook expliciet om persistente opslag;
  de browser mag dit weigeren, dus dit is een extra laag, geen garantie.
- De service worker cachet alleen de app-shell, zodat de kalender ook
  zonder netwerkverbinding opent.

**Dit vervangt geen back-ups.** Gebruik **Tuin exporteren (.json)** in
**Mijn tuin** regelmatig — de app herinnert je daaraan als het langer dan
twee weken geleden is. Op een telefoon met Web Share-support (iOS/Android)
opent exporteren het native deelvenster, zodat je het bestand direct naar
Bestanden/iCloud/Drive kunt zetten; elders krijg je een gewone download.

## Delen met je mede-tuiniers

Er is geen gedeelde server: jullie draaien ieder dezelfde app met dezelfde
plantendata (die zit in de repo/build), maar hebben elk je eigen tuin in je
eigen browser. Om te delen:

1. Zet `dist/` op een gratis static host (GitHub Pages, Cloudflare Pages) en
   stuur die ene URL naar de andere twee.
2. Gebruik **Tuin exporteren (.json)** in de app om een back-up te maken of
   je eigen tuin over te zetten naar een ander apparaat.

Nieuwe plantensoorten die je toevoegt aan `data/species/` komen bij iedereen
terecht zodra je een nieuwe versie van de app publiceert — dat is bewust:
soortkennis is gedeeld, jouw specifieke tuin niet.

## Bekende beperkingen / logische vervolgstappen

- Eén regio actief tegelijk (Utrecht); een regiokiezer in de UI is de
  voor de hand liggende volgende stap zodra dat nodig is.
- `extraTasks` per planting heeft nog geen formulier in **Mijn tuin** —
  toevoegen kan nu door het geëxporteerde JSON-bestand te bewerken en weer
  te importeren.
- De Tijdlijn-weergave heeft nog geen eigen printlayout (alleen het
  Maandoverzicht heeft dat) — dat is met dezelfde `buildTimelineRows()` en
  wat extra CSS in `print.css` toe te voegen.
- Geen automatische tests voor de Svelte-componenten zelf (wel voor alle
  onderliggende logica: `windows.js`, `calendar.js`, `migrate.js` inclusief
  `buildTimelineRows`) — als je componenten flink gaat uitbreiden is
  `@testing-library/svelte` de voor de hand liggende toevoeging.
