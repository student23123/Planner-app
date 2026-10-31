<script>
  let { name, size = 20 } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if name === 'play'}
    <path d="M6 4l10 6-10 6z" fill="currentColor" stroke="none" />
  {:else if name === 'stop'}
    <rect x="4.5" y="4.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />
  {:else if name === 'pause'}
    <rect x="5" y="4" width="3.5" height="12" rx="1" fill="currentColor" stroke="none" />
    <rect x="11.5" y="4" width="3.5" height="12" rx="1" fill="currentColor" stroke="none" />
  {:else if name === 'pen'}
    <path d="M4 16l.8-3.6L14 3.2a1.5 1.5 0 012.1 0l.7.7a1.5 1.5 0 010 2.1L7.6 15.2z" />
    <path d="M12.6 4.6l2.8 2.8" />
  {:else if name === 'o'}
    <circle cx="10" cy="10" r="6" stroke-width="2.2" />
  {:else if name === 't'}
    <path d="M10 3.5L17 16H3z" stroke-width="2.2" />
  {:else if name === 'x'}
    <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" stroke-width="2.2" />
  {:else if name === 'trash'}
    <path d="M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.8 11h7.4l.8-11" />
  {:else if name === 'plus'}
    <path d="M10 4v12M4 10h12" stroke-width="2.2" />
  {:else if name === 'left'}
    <path d="M12.5 4L6.5 10l6 6" stroke-width="2.2" />
  {:else if name === 'right'}
    <path d="M7.5 4l6 6-6 6" stroke-width="2.2" />
  {:else if name === 'clock'}
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6v4l3 2" />
  {:else if name === 'cal'}
    <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
    <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
  {:else if name === 'bars'}
    <path d="M4.5 16.5V10M10 16.5V4M15.5 16.5V8" stroke-width="2.2" />
  {:else if name === 'grip'}
    <circle cx="7.5" cy="5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="15" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="15" r="1.4" fill="currentColor" stroke="none" />
  {:else if name === 'edit'}
    <path d="M4 16l.8-3.6L14 3.2a1.5 1.5 0 012.1 0l.7.7a1.5 1.5 0 010 2.1L7.6 15.2z" />
  {:else if name === 'check'}
    <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke-width="2.4" />
  {:else if name === 'close'}
    <path d="M5 5l10 10M15 5L5 15" stroke-width="2.2" />
  {:else if name === 'image'}
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <circle cx="7.5" cy="8.5" r="1.5" />
    <path d="M17 13l-4-4-7 7" />
  {/if}
</svg>
