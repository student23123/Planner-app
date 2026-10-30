<script>
  import Icon from './Icon.svelte';
  let { open = $bindable(false), title, children } = $props();
</script>

{#if open}
  <div class="overlay" role="presentation" onclick={() => (open = false)}>
    <div
      class="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === 'Escape' && (open = false)}
    >
      <div class="sheet-head">
        <h2>{title}</h2>
        <button class="icon-btn" aria-label="닫기" onclick={() => (open = false)}><Icon name="close" /></button>
      </div>
      {@render children()}
    </div>
  </div>
{/if}
