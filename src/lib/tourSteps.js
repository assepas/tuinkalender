// Stappen van de rondleiding (Tour.svelte). `target` verwijst naar een
// data-tour-attribuut in de pagina; zonder target staat de kaart in het
// midden. Met `tab` schakelt de app eerst naar die weergave. Een stap
// waarvan het target niet bestaat (bv. account zonder Supabase) valt weg.

// helpInMenu: de rondleiding staat in het accountmenu (mobiel met account),
// anders onder het vraagteken rechtsonder.
export function tourSteps({ isMobile, helpInMenu }) {
  return [
    {
      title: "Welkom bij TuinTaak",
      text: "Je persoonlijke tuinkalender: per maand zie je welke taken horen bij de planten die jij hebt staan. In een paar stappen laten we zien hoe het werkt.",
    },
    {
      target: "garden-menu",
      title: "Mijn tuin",
      text: isMobile
        ? "Hier beheer je de planten in je tuin."
        : "Onder Mijn tuin beheer je je planten en standplaatsen.",
    },
    {
      target: "add-plant",
      tab: "tuin",
      title: "Planten toevoegen",
      text: "Zoek een plant, kies waar hij staat en klik op Toevoegen. De taken komen er vanzelf bij.",
    },
    {
      target: "locations",
      title: "Standplaatsen",
      text: "Verdeel je tuin in plekken, zoals voortuin, moestuin of kas. Zo kun je later filteren.",
    },
    {
      target: "timeline",
      title: "Tijdlijn",
      text: "Het hele jaar per plant in één oogopslag: wanneer zaaien, snoeien, bloeien. Klik op een plant voor uitleg.",
    },
    {
      target: "calendar",
      title: "Maandoverzicht",
      text: "Alle taken per maand op een rij. Handig om af te drukken en op te hangen.",
    },
    {
      target: "account",
      title: "Inloggen (optioneel)",
      text: "Zonder account staat je tuin alleen in deze browser. Met een account zie je hem op al je apparaten en kun je hem delen.",
    },
    {
      title: "Klaar!",
      text: helpInMenu
        ? "Deze rondleiding vind je terug in het accountmenu rechtsboven. Veel tuinierplezier!"
        : "Deze rondleiding vind je terug onder het vraagteken rechtsonder. Veel tuinierplezier!",
      finish: { label: "Begin met planten", tab: "tuin" },
    },
  ];
}
