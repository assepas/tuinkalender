<script>
  // Standplaatsen zijn een puur tuin-eigen concept (net als plantingen) —
  // geen gedeelde soortdata, want iedere tuinier noemt zijn plekken anders.
  // Dit paneel staat bovenaan de pagina: je moet minstens één standplaats
  // kunnen kiezen vóór je 'm nodig hebt bij het toevoegen van een plant.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { LOCATION_KIND_LABELS } from "../lib/domain/plantings.js";

  let name = $state("");
  let kind = $state("");
  let soil = $state("");
  let addError = $state("");

  function submit(event) {
    event.preventDefault();
    addError = "";
    try {
      gardenState.addLocation({ name, kind: kind || null, soil });
      name = "";
      kind = "";
      soil = "";
    } catch (err) {
      addError = err.message;
    }
  }
</script>

<div class="panel">
  <h2>Standplaatsen ({gardenState.locations.length})</h2>
  <p class="hint">
    De plekken in jouw tuin (bv. "Kas", "Border noord"). Kies je "soort plek" alleen als het
    letterlijk een kas, buiten of een pot is — sommige taken (zoals opbinden bij tomaat in de kas)
    reageren daarop. Grondsoort is optioneel en geldt voor de hele standplaats.
  </p>

  <form class="field-grid" onsubmit={submit}>
    <div>
      <label for="location-name">Naam</label>
      <input id="location-name" type="text" placeholder="bv. Kas, Border noord" bind:value={name} />
    </div>
    <div>
      <label for="location-kind">Soort plek (optioneel)</label>
      <select id="location-kind" bind:value={kind}>
        <option value="">— geen —</option>
        {#each Object.entries(LOCATION_KIND_LABELS) as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="location-soil">Grondsoort (optioneel)</label>
      <input id="location-soil" type="text" placeholder="bv. klei, zand, potgrond" bind:value={soil} />
    </div>
  </form>
  <button type="submit" class="btn btn-primary" onclick={submit}>Standplaats toevoegen</button>
  {#if addError}
    <p class="error-text">{addError}</p>
  {/if}

  {#if gardenState.locations.length === 0}
    <p class="empty-state">Nog geen standplaatsen — voeg er hierboven een toe.</p>
  {:else}
    <ul class="location-list">
      {#each gardenState.locations as location (location.id)}
        <li class="location-row">
          <input
            type="text"
            value={location.name}
            aria-label="Naam"
            onchange={(e) => gardenState.updateLocation(location.id, { name: e.target.value })}
          />
          <select
            value={location.kind ?? ""}
            aria-label="Soort plek"
            onchange={(e) => gardenState.updateLocation(location.id, { kind: e.target.value || null })}
          >
            <option value="">— geen —</option>
            {#each Object.entries(LOCATION_KIND_LABELS) as [value, label] (value)}
              <option {value}>{label}</option>
            {/each}
          </select>
          <input
            type="text"
            value={location.soil ?? ""}
            aria-label="Grondsoort"
            placeholder="grondsoort"
            onchange={(e) => gardenState.updateLocation(location.id, { soil: e.target.value })}
          />
          <button
            type="button"
            class="btn btn-danger"
            onclick={() => gardenState.removeLocation(location.id)}
          >
            Verwijderen
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
