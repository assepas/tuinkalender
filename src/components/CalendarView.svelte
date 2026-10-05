<script>
  import { buildCalendar, resolveMarkerMeta } from "../lib/domain/calendar.js";
  import { buildLocationIndex } from "../lib/domain/plantings.js";
  import { catalog } from "../lib/state/catalog.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import DetailModal from "./DetailModal.svelte";
  import Icon from "./Icon.svelte";
  import Legend from "./Legend.svelte";
  import Modal from "./Modal.svelte";
  import MonthCard from "./MonthCard.svelte";
  import PrintView from "./PrintView.svelte";

  let months = $derived(
    buildCalendar(gardenState.garden, catalog.speciesIndex, gardenState.regionProfile)
  );

  let printOpen = $state(false);

  // Klik op een plant: venster met de uitleg over deze taak én de plant.
  let selected = $state(null);

  function showEntry(entry) {
    const planting = gardenState.plantings.find((p) => p.uid === entry.plantingUid);
    const species = catalog.speciesIndex[entry.speciesId];
    const typeMeta = catalog.taskTypeIndex[entry.taskType];
    if (!planting || !species) return;
    selected = {
      kind: "species-task",
      species,
      planting,
      location: buildLocationIndex(gardenState.garden.locations)[planting.locationId] ?? null,
      taskType: entry.taskType,
      meta: typeMeta ? resolveMarkerMeta(entry.task, typeMeta).meta : null,
      entry,
    };
  }
  // Op mobiel (één kolom) is de legenda inklapbaar en staat hij standaard dicht.
  let legendExpanded = $state(false);

  const currentMonth = new Date().getMonth() + 1; // 1–12, zoals month.month

  // Doorlopende carousel: de 12 maanden staan drie keer achter elkaar en je
  // kijkt altijd in de middelste reeks. Kom je na het scrollen in de eerste
  // of laatste reeks uit, dan springt de rij ongemerkt naar dezelfde maand in
  // het midden. Zo staat januari naast december en andersom.
  const COPIES = 3;
  const MIDDLE = 12; // index van januari in de middelste reeks
  const stripMonths = $derived(
    Array.from({ length: COPIES }, (_, copy) => months.map((month) => ({ copy, month }))).flat()
  );
  let strip = $state();
  let activeIndex = $state(MIDDLE + currentMonth - 1);
  const activeMonth = $derived(stripMonths[activeIndex]?.month.month ?? currentMonth);

  // scrollLeft waarbij een kaart precies in het midden van de rij staat.
  const centeredLeft = (card) => card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2;

  function jumpTo(index) {
    const card = strip?.children[index];
    if (!card) return;
    strip.scrollLeft = centeredLeft(card);
    activeIndex = index;
  }

  // Start: de huidige maand in het midden van de middelste reeks.
  $effect(() => {
    if (strip) jumpTo(MIDDLE + currentMonth - 1);
  });

  // Actieve kaart = de kaart die het dichtst bij het midden staat. Staat de
  // rij een moment stil buiten de middelste reeks, dan terug naar het midden.
  let scrollFrame = 0;
  let settleTimer = 0;
  function handleScroll() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (!strip) return;
      const middle = strip.scrollLeft + strip.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      [...strip.children].forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
        if (distance < bestDistance) {
          best = i;
          bestDistance = distance;
        }
      });
      activeIndex = best;
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (activeIndex < MIDDLE || activeIndex >= MIDDLE + 12) jumpTo(MIDDLE + (activeIndex % 12));
    }, 150);
  }

  function scrollToIndex(index) {
    const card = strip?.children[index];
    if (!card) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: centeredLeft(card), behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Stipje: naar de dichtstbijzijnde kaart van die maand (van december naar
  // januari is dus één stap naar rechts, niet elf naar links).
  function scrollToMonth(monthNumber) {
    const candidates = Array.from({ length: COPIES }, (_, copy) => copy * 12 + monthNumber - 1);
    const nearest = candidates.reduce((a, b) => (Math.abs(b - activeIndex) < Math.abs(a - activeIndex) ? b : a));
    scrollToIndex(nearest);
  }
</script>

<div class="calendar-toolbar no-print" class:mobile={ui.isMobile}>
  {#if ui.isMobile}
    <div class="panel calendar-legend-panel">
      <h3>
        <button
          type="button"
          class="panel-toggle"
          aria-expanded={legendExpanded}
          aria-controls="calendar-legend-body"
          onclick={() => (legendExpanded = !legendExpanded)}
        >
          <span class="chevron">{legendExpanded ? "▾" : "▸"}</span>
          Legenda
        </button>
      </h3>
      {#if legendExpanded}
        <div id="calendar-legend-body" class="calendar-legend-body"><Legend /></div>
      {/if}
    </div>
  {:else}
    <Legend />
  {/if}
  {#if gardenState.plantings.length > 0}
    <button type="button" class="btn calendar-print" onclick={() => (printOpen = true)}>Printen</button>
  {/if}
</div>

{#if gardenState.plantings.length === 0}
  <p class="empty-state">
    Je tuin is nog leeg. Ga naar <strong>Mijn tuin</strong> om planten toe te voegen — de kalender
    vult zich daar automatisch mee.
  </p>
{:else}
  <!-- Pijlen en stipjes boven de rij (onder de rij zouden ze onder de
       hoogste kaart belanden, ver van de maand die je bekijkt). -->
  <div class="calendar-dots no-print">
    <button
      type="button"
      class="calendar-arrow prev"
      aria-label="Vorige maand"
      onclick={() => scrollToIndex(activeIndex - 1)}
    >
      <Icon name="chevron-left" size={18} />
    </button>
    {#each months as month (month.month)}
      <button
        type="button"
        class="calendar-dot"
        class:now={month.month === currentMonth}
        aria-label={month.name}
        title={month.name}
        aria-current={month.month === activeMonth ? "true" : undefined}
        onclick={() => scrollToMonth(month.month)}
      ></button>
    {/each}
    <button
      type="button"
      class="calendar-arrow next"
      aria-label="Volgende maand"
      onclick={() => scrollToIndex(activeIndex + 1)}
    >
      <Icon name="chevron-right" size={18} />
    </button>
  </div>
  <div class="calendar-strip-wrap no-print">
    <!-- Focusbaar zodat je de rij ook met de pijltjestoetsen kunt scrollen
         (aanbevolen voor scrollbare regio's). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="calendar-strip"
      role="region"
      aria-label="Maanden"
      tabindex="0"
      bind:this={strip}
      onscroll={handleScroll}
    >
      {#each stripMonths as { copy, month } (`${copy}-${month.month}`)}
        <MonthCard
          {month}
          current={month.month === currentMonth}
          clone={copy !== 1}
          onselect={showEntry}
        />
      {/each}
    </div>
  </div>
{/if}

{#if printOpen}
  <Modal title="Printvoorbeeld" wide printable onclose={() => (printOpen = false)}>
    <PrintView {months} />
  </Modal>
{/if}

{#if selected}
  <DetailModal detail={selected} onclose={() => (selected = null)} />
{/if}
