// Evalueert een taak-"window" (uit een species-bestand) naar de lijst van
// maanden waarin de taak actief is, gegeven een regioprofiel en jaar.
//
// Bewust op maand-granulariteit: de kalender toont per maand welke taken
// spelen, niet per dag. "recurring" en "dates" leveren dus dezelfde
// maand-set op; het verschil zit in het frequentie-label voor de UI.
//
// Puur en zonder side effects — dit bestand is de kern die het makkelijkst
// stuk kan gaan (jaargrens-overgang, negatieve week-offsets) en dus het
// zwaarst getest wordt.

const CUMULATIVE_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const FREQUENCY_LABELS = {
  week: "wekelijks",
  "2weeks": "elke 2 weken",
  month: "maandelijks",
};

/** "05-12" -> { month: 5, day: 12 } */
export function parseMonthDay(monthDay) {
  const [month, day] = monthDay.split("-").map(Number);
  return { month, day };
}

/** { month, day } -> "05-12" */
export function formatMonthDay({ month, day }) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toOrdinalDay({ month, day }) {
  return CUMULATIVE_DAYS[month - 1] + day;
}

function fromOrdinalDay(ordinal) {
  // Non-leap-jaar aanname (365 dagen). Voor tuintaken op maand-granulariteit
  // is het 29-februari-verschil verwaarloosbaar; we clampen defensief.
  const total = 365;
  let n = ((ordinal - 1) % total + total) % total;
  let month = 0;
  while (month < 11 && n >= DAYS_IN_MONTH[month]) {
    n -= DAYS_IN_MONTH[month];
    month++;
  }
  return { month: month + 1, day: n + 1 };
}

/** Telt weken (7 dagen) op/af bij een MM-DD, met correcte jaarwrap. */
export function addWeeks(monthDay, weeks) {
  const ordinal = toOrdinalDay(parseMonthDay(monthDay));
  return formatMonthDay(fromOrdinalDay(ordinal + weeks * 7));
}

/**
 * Geeft de lijst maandnummers (1-12) tussen twee MM-DD's, inclusief,
 * met correcte afhandeling van een venster dat de jaargrens overschrijdt
 * (bv. "11-15" t/m "02-28" voor winterbescherming).
 */
export function monthsBetween(fromMonthDay, toMonthDay) {
  const from = parseMonthDay(fromMonthDay).month;
  const to = parseMonthDay(toMonthDay).month;
  const months = [];

  if (from <= to) {
    for (let m = from; m <= to; m++) months.push(m);
  } else {
    for (let m = from; m <= 12; m++) months.push(m);
    for (let m = 1; m <= to; m++) months.push(m);
  }
  return months;
}

/**
 * Splitst een maandenlijst (zoals monthsBetween teruggeeft, mogelijk over de
 * jaargrens) in oplopende segmenten die je direct als CSS grid-column-bereik
 * kunt tekenen op een lineaire 12-kolommen-grid. Bijvoorbeeld [11,12,1,2]
 * wordt [[11,12],[1,2]] — twee balkjes in plaats van één die "terugloopt".
 */
export function toVisualSegments(months) {
  if (!months || months.length === 0) return [];
  const segments = [];
  let segStart = months[0];
  let prev = months[0];

  for (let i = 1; i < months.length; i++) {
    const m = months[i];
    if (m === prev + 1) {
      prev = m;
    } else {
      segments.push([segStart, prev]);
      segStart = m;
      prev = m;
    }
  }
  segments.push([segStart, prev]);
  return segments;
}

/**
 * Evalueert één window-object naar { months, frequency, from, to }.
 * `regionProfile` is het object uit data/regions/*.json (met .anchors).
 */
export function evaluateWindow(window, regionProfile) {
  switch (window.kind) {
    case "dates": {
      return {
        months: monthsBetween(window.from, window.to),
        from: window.from,
        to: window.to,
      };
    }

    case "recurring": {
      return {
        months: monthsBetween(window.from, window.to),
        frequency: FREQUENCY_LABELS[window.every] ?? window.every,
        from: window.from,
        to: window.to,
      };
    }

    case "relative": {
      const anchor = regionProfile?.anchors?.[window.anchor];
      if (!anchor) {
        throw new Error(
          `Onbekend anker "${window.anchor}" — controleer data/regions/${regionProfile?.id ?? "?"}.json`
        );
      }
      const from = addWeeks(anchor, window.fromWeeks);
      const to = addWeeks(anchor, window.toWeeks);
      return { months: monthsBetween(from, to), from, to };
    }

    default:
      throw new Error(`Onbekend window-type: "${window.kind}"`);
  }
}
