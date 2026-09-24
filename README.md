# TuinTaak

TuinTaak is je persoonlijke tuinkalender: per maand zie je welke onderhoudstaken horen bij
de planten die je hebt staan, afgestemd op regio Utrecht.

De app is een statische site. Zonder account staat je tuin lokaal in de
browser. Optioneel koppel je hem aan **Supabase** (zie
[Account, synchronisatie en beheer](#account-synchronisatie-en-beheer-supabase)):
dan kun je inloggen, je tuin op al je apparaten gebruiken, hem delen met
mede-tuiniers, en als beheerder de plantendata in de app bewerken.

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
│  ├─ plantings.js         Standplaats-/categorie-vocab + dubbele-combinatie-check
│  ├─ id.js                Gedeelde id-generator (plantingen + standplaatsen)
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
   ├─ SpeciesCombobox.svelte    Doorzoekbare soortenkiezer (ARIA-combobox, groepeert op categorie)
   ├─ LocationManager.svelte, LocationSelect.svelte   Standplaatsen beheren + kiezen
   ├─ PlantingRow.svelte        Eén rij in het (sorteerbare/filterbare) tuinoverzicht
   └─ PrintView.svelte, Legend.svelte             Print + legenda

tests/                 Vitest — vooral gericht op lib/domain
```

De regel die de boel onderhoudbaar houdt: **`src/lib/domain/` importeert
niets uit Svelte of `window`**. Zolang dat zo blijft, is de rekenkern apart
te testen en zelfs te hergebruiken buiten deze app.

## Twee manieren om je kalender te bekijken

- **Maandoverzicht** — per maand een kaart met wat er die maand te doen is.
  Handig voor "wat moet ik nu doen".
- **Tijdlijn** — per planting één regel over de 12 maanden: de bloeiperiode
  is een doorlopende balk in bloemkleur, en de taken staan als icoontjes per
  maand eroverheen (bij meerdere taken in één maand naast elkaar). Elke
  planting staat op een eigen regel — sta je dezelfde soort op meerdere
  standplaatsen, dan zie je ze los van elkaar (dezelfde soort kan toch al
  niet dubbel op dezelfde standplaats, zie "Standplaatsen" hieronder).
  Alleen de taaktypes met `"timeline": true` doen mee: zaaien (kas / volle
  grond), planten, bemesten, snoeien (hoofd / licht), oogsten, delen/
  verspreiden, winterhard maken en overig onderhoud.
  Klik op het plant-icoon voor soortinfo, of op een icoon/de bloeibalk voor
  de details. De plantnaam-kolom blijft vastgeprikt tijdens horizontaal
  scrollen op smalle schermen. Legenda en filter-/sorteeropties (zelfde als
  Mijn Tuin: standplaats, type, Naam/Soort/Standplaats) staan uitklapbaar
  boven het grid.

## Een nieuwe plant toevoegen

Maak een bestand `data/species/<id>.json` aan, bijvoorbeeld:

```json
{
  "schemaVersion": 1,
  "id": "courgette",
  "name": "Courgette",
  "category": "groente",
  "nativeStatus": "exoot",
  "appearance": { "shape": "bloem", "count": 5, "flowerColor": "#E8873A", "flowerColorName": "oranje" },
  "bloom": { "from": "07-01", "to": "08-15" },
  "tasks": [
    { "id": "zaaien", "type": "zaaien",
      "window": { "kind": "relative", "anchor": "lastFrost", "fromWeeks": 0, "toWeeks": 2 } },
    { "id": "bemesten", "type": "bemesten",
      "window": { "kind": "recurring", "from": "06-01", "to": "09-15", "every": "2weeks" } },
    { "id": "oogsten", "type": "oogsten",
      "window": { "kind": "dates", "from": "07-01", "to": "10-01" } }
  ]
}
```

`nativeStatus`, `appearance` en `bloom` zijn optioneel — laat ze weg en de
plant verschijnt gewoon zonder badge/bloei-lane in de tijdlijn. Waarden:

- `nativeStatus`: `inheems` | `archeofyt` | `exoot` | `onbekend` (dat laatste
  ook voor soort-onzekerheid, zoals bij een verzamelnaam als `Hosta spp.`)
- `appearance.shape`: `vrucht` | `aar` | `bloem` | `losse-wolk` — bepaalt de
  volledige opbouw van het icoon (zie `src/lib/domain/plantGlyph.js`). Het
  blad staat automatisch rechtsboven bij `vrucht` en linksonder bij de
  andere drie; alleen `aar` en `bloem` krijgen een steel
- `appearance.count`: geheel getal 1-10 — aantal vruchtjes/aar-segmenten/
  bloemblaadjes/wolk-vlekken. Bij `vrucht` loopt het silhouet mee op van
  appel (1) via kersenpaar (2) naar een aalbessen- (~5) en druiventros (10)
- `appearance.flowerColor`: een hex-kleur — kleurt de bloei-balk in de
  tijdlijn, en (behalve bij `vrucht`) ook het plant-icoon zelf. Lichte/witte
  kleuren krijgen automatisch een donkerdere rand (`src/lib/domain/color.js`)
  zodat ze zichtbaar blijven
- `appearance.fruitColor`: verplicht wanneer `shape` = `vrucht` — kleurt
  alleen de vruchtjes van het icoon, los van `flowerColor` (dat voor de
  bloei-balk blijft staan, ook bij een fruitsoort)
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
taak beperkt hem tot plantingen waarvan de standplaats dat "soort plek"-label
(`kind`) resp. die grondsoort heeft (zie "Standplaatsen" hieronder) — niet de
vrije naam die de gebruiker aan de standplaats gaf.

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
- `timeline`: `true` om het type in de tijdlijn te tonen. Laat het weg en
  het type staat alleen in het maandoverzicht en de printweergave. De
  volgorde in dit bestand is de volgorde waarin icoontjes binnen één maand
  naast elkaar komen.
- `markerStyle: "bar"`: optioneel, alleen relevant met `"timeline": true`.
  Standaard (weggelaten, of `"icon"`) krijgt het type een icoontje in elke
  actieve maand — prima voor een taak die op een paar momenten speelt, maar
  bij een taak die maandenlang actief is (zoals oogsten) geeft dat een
  wand van identieke icoontjes. Met `"bar"` wordt het in plaats daarvan één
  doorlopende streep onderin de rij, eindigend in het taak-icoontje — zie
  `oogsten` in `data/taskTypes.json`.
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

## Standplaatsen

Standplaatsen (bv. "Kas", "Border noord") zijn — anders dan soorten en
taaktypes — géén gedeelde data uit `/data`, maar een puur tuin-eigen concept:
ze staan in je eigen tuindocument (`garden.locations`), want elke tuinier
noemt zijn plekken anders. Beheer ze bovenaan **Mijn tuin**, vóór je een
plant toevoegt.

Een standplaats heeft een vrije `name` en optioneel:
- `kind` — een klein vast "soort plek"-label (`kas` | `buiten` | `pot`,
  zie `LOCATION_KINDS` in `src/lib/domain/plantings.js`), los van de vrije
  naam. Dit is wat `conditions.position` op een taak matcht — vul dit dus
  alleen in als het letterlijk klopt, niet als vrije categorisering.
- `soil` — grondsoort, wat `conditions.soil` op een taak matcht. Geldt voor
  de hele standplaats, niet per plant.

Een standplaats verwijderen die nog in gebruik is cascadeert niet: de
planting blijft bestaan en toont "Onbekende standplaats" (zelfde patroon als
een verwijderde soort-id).

**Dezelfde soort kan niet twee keer op dezelfde standplaats** — dat wordt
hard tegengehouden (`gardenState.canAddPlanting()`,
`src/lib/domain/plantings.js#findDuplicatePlantings`). Wil je bewust meerdere
planten van dezelfde soort op wat feitelijk één plek is los van elkaar
bijhouden, maak dan meerdere standplaatsen aan (bv. "Kas — plek 1",
"Kas — plek 2").

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

Met Supabase gekoppeld: log in, ga naar **Mijn tuin → Opslaan & delen →
Delen…** en maak een uitnodigingslink. Wie die opent en inlogt, kan de tuin
bekijken en bewerken; wijzigingen zie je bij elkaar direct verschijnen.

Zonder Supabase: zet `dist/` op een static host, stuur de URL rond, en
gebruik **Tuin exporteren (.json)** om een tuin over te zetten.

## Account, synchronisatie en beheer (Supabase)

Alles hieronder is optioneel. Zonder de `VITE_SUPABASE_*`-variabelen bouwt de
app precies zoals vroeger: meegebakken plantendata, tuin in localStorage.

**Hoe het werkt**

- De browser praat rechtstreeks met Supabase via de publieke *publishable key*. De
  beveiliging zit in Row Level Security in `supabase/migrations/0001_init.sql`:
  iedereen mag de plantendata lezen, alleen gebruikers in de tabel `admins`
  mogen hem wijzigen, en een tuin is alleen zichtbaar voor zijn leden.
- Inloggen gaat met een magic link per e-mail. Iedereen kan een account
  maken; beheerder word je alleen door een rij in `admins`.
- **Plantendata** (`species`, `task_types`, `regions`) komt bij het opstarten
  uit de database (`src/lib/state/catalog.svelte.js`). Tot die binnen is,
  of als je offline bent, gebruikt de app de vorige cache of de meegebakken
  bestanden uit `data/`.
- **Tuinen** (`gardens`) bevatten hetzelfde JSON-document als de lokale tuin.
  Elke wijziging gaat eerst naar een offline-kopie en daarna naar de server
  met een versiecheck. Was iemand anders je voor, dan worden beide versies
  per planting/standplaats samengevoegd (`src/lib/domain/merge.js`), dus er
  gaat niets verloren, ook niet na offline werken.
- Admins zien de tab **Plantendata**: soorten toevoegen, bewerken (formulier
  of JSON) en verwijderen, en taaktypes (naam, kleur, icoon) aanpassen. Bij
  opslaan wordt gevalideerd met hetzelfde schema als `npm run validate`.

**Eenmalig opzetten**

1. Maak een (gratis) project op [supabase.com](https://supabase.com).
2. Draai de migraties op volgorde: plak elk bestand uit
   `supabase/migrations/` (`0001_init.sql`, dan `0002_grants.sql`) in de
   **SQL Editor** en voer het uit (of gebruik `supabase db push` met de
   Supabase CLI).
3. Kopieer `.env.example` naar `.env.local` en vul de URL, de publishable
   key en een secret key in (Project Settings → API Keys, de nieuwe keys,
   niet de legacy anon/service_role). `.env.local` staat in `.gitignore`.
   De secret key omzeilt alle beveiliging, dus zet hem nooit in een
   `VITE_`-variabele.
4. Zet de plantendata in de database: `npm run db:seed`.
5. Stel onder **Authentication → URL Configuration** de *Site URL* in op het
   adres van je gehoste app, en voeg zowel dat adres als
   `http://localhost:5173` toe aan de *Redirect URLs*.
6. Log één keer in via de app, en maak jezelf dan beheerder in de SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'jij@voorbeeld.nl';
   ```
7. Bij je host (GitHub Pages, Netlify, …): zet `VITE_SUPABASE_URL` en
   `VITE_SUPABASE_PUBLISHABLE_KEY` als omgevingsvariabelen voor de build.

**Plantendata terug naar git**

Wijzigingen die je in de app doet, staan in de database. Met
`npm run db:export` schrijf je ze terug naar `data/` (als back-up in git, en
zodat de meegebakken fallback actueel blijft). Bekijk het resultaat met
`git diff data/`. De export schrijft alles als nette JSON, dus de eerste keer
verandert de opmaak van de handgeschreven bestanden.

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
- Sorteer-/filterstand in het tuinoverzicht (`GardenEditor.svelte`) wordt
  niet onthouden tussen herladen — reset bij elke paginabezoek naar
  Naam/oplopend, geen filters.
- Dubbele-combinatie-detectie is exact `(speciesId, locationId)` en hard
  geblokkeerd (zie "Standplaatsen" hierboven) — geen "bijna gelijk"-detectie
  (bv. twee losstaande standplaatsen die toevallig dezelfde naam hebben).
