<script>
  // Eigen pagina voor standplaatsbeheer. Bewust een losse pagina (en niet
  // alleen de modal op "Mijn tuin"): hier kan later een plattegrond van de
  // tuin bij, bv. als tweede .panel naast of boven de lijst.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import LocationManager from "./LocationManager.svelte";
</script>

<div class="panel">
  <h2>Standplaatsen ({gardenState.locations.length})</h2>
  <LocationManager idPrefix="page" />
</div>
