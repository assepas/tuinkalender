<script>
  import { speciesList } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";

  let speciesId = $state(speciesList[0]?.id ?? "");
  let label = $state("");
  let position = $state("");
  let soil = $state("");

  function submit(event) {
    event.preventDefault();
    if (!speciesId) return;
    gardenState.addPlanting({ speciesId, label, position, soil });
    label = "";
    position = "";
    soil = "";
  }
</script>

<form class="panel" onsubmit={submit}>
  <h2>Plant toevoegen</h2>
  <div class="field-grid">
    <div>
      <label for="species-select">Soort</label>
      <select id="species-select" bind:value={speciesId}>
        {#each speciesList as species (species.id)}
          <option value={species.id}>{species.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="label-input">Eigen naam (optioneel)</label>
      <input id="label-input" type="text" placeholder="bv. Tomaten achterin" bind:value={label} />
    </div>
    <div>
      <label for="position-input">Standplaats (optioneel)</label>
      <input id="position-input" type="text" placeholder="bv. kas, buiten, border" bind:value={position} />
    </div>
    <div>
      <label for="soil-input">Grondsoort (optioneel)</label>
      <input id="soil-input" type="text" placeholder="bv. klei, zand, potgrond" bind:value={soil} />
    </div>
  </div>
  <button type="submit" class="btn btn-primary">Toevoegen aan tuin</button>
  <p class="hint">
    Standplaats en grondsoort zijn vrije tekst; sommige taken (zoals opbinden bij tomaat in de kas)
    reageren erop als de waarde overeenkomt met wat in de soortdata staat.
  </p>
</form>
