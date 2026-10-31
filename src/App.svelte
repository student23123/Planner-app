<script>
  import { onMount } from 'svelte';
  import Daily from './Daily.svelte';
  import Weekly from './Weekly.svelte';
  import CalendarView from './CalendarView.svelte';
  import Icon from './Icon.svelte';
  import { app, meta, clock, ensureDay, hydrate } from './lib/state.svelte.js';
  import { tick } from './lib/timer.js';
  import { load, save, flush } from './lib/persist.js';
  import { logicalDate } from './lib/util.js';

  let tab = $state('daily');

  function refresh() {
    const now = Date.now();
    clock.now = now;
    const today = logicalDate(now);
    if (today !== clock.today) clock.today = today;
    if (meta.ready) tick(now);
  }

  function go(t) {
    tab = t;
    window.scrollTo(0, 0);
  }

  onMount(() => {
    load().then(hydrate);
    const id = setInterval(refresh, 500);
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
      else refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
    };
  });

  $effect(() => {
    if (meta.ready) ensureDay(clock.today);
  });

  $effect(() => {
    if (!meta.ready || meta.loadError) return;
    save($state.snapshot(app));
  });
</script>

<main class="screen">
  {#if meta.loadError}
    <div class="warn">저장된 데이터를 불러오지 못했어요. 데이터 보호를 위해 이번 실행에서는 저장하지 않아요. 앱을 다시 켜 주세요.</div>
  {/if}
  {#if meta.ready}
    {#if tab === 'daily'}
      <Daily />
    {:else if tab === 'weekly'}
      <Weekly />
    {:else}
      <CalendarView />
    {/if}
  {/if}
</main>

<nav class="tabbar">
  <button class="tab" class:active={tab === 'daily'} onclick={() => go('daily')}>
    <Icon name="clock" size={22} />데일리
  </button>
  <button class="tab" class:active={tab === 'weekly'} onclick={() => go('weekly')}>
    <Icon name="bars" size={22} />위클리
  </button>
  <button class="tab" class:active={tab === 'calendar'} onclick={() => go('calendar')}>
    <Icon name="cal" size={22} />캘린더
  </button>
</nav>
