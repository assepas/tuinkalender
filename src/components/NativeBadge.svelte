<script>
  let { status } = $props();

  const STYLES = {
    inheems: { label: "inheems", background: "#3A4A2E" },
    archeofyt: { label: "archeofyt", background: "#6B7A3A" },
    exoot: { label: "exoot", background: "#A64B2A" },
    onbekend: { label: "soort?", background: "#5C6350" },
  };

  const style = $derived(STYLES[status] ?? STYLES.onbekend);
</script>

{#if status}
  <span class="native-badge" style:background={style.background}>{style.label}</span>
{/if}

<style>
  .native-badge {
    display: inline-block;
    color: #f6f4e8;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    white-space: nowrap;
  }
</style>
