<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import DdayBanner from './DdayBanner.svelte';
  import { app, clock, addHabit, removeHabit, habitDone, toggleHabit } from './lib/state.svelte.js';
  import { parse, addDays, WD, hoursOf, fmtMinutes } from './lib/util.js';

  let offset = $state(0);

  let week = $derived.by(() => {
    const base = addDays(clock.today, offset * 7);
    const startD = addDays(base, -parse(base).getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(startD, i));
  });

  let range = $derived(`${parse(week[0]).getMonth() + 1}.${parse(week[0]).getDate()} – ${parse(week[6]).getMonth() + 1}.${parse(week[6]).getDate()}`);
  let totalMin = $derived(week.reduce((sum, d) => sum + (app.days[d]?.focus ?? 0) * 30, 0));

  function ratio(d) {
    const day = app.days[d];
    if (!day || day.todos.length === 0) return '-';
    const score = day.todos.reduce((s, t) => s + (t.mark === 'o' ? 1 : t.mark === 't' ? 0.5 : 0), 0);
    return `${Math.round((score / day.todos.length) * 100)}%`;
  }

  function hoursCell(d) {
    if (d > clock.today) return '-';
    return hoursOf(app.days[d]?.focus ?? 0);
  }

  let habitOpen = $state(false);
  let newHabit = $state('');
  let confirmDel = $state(null);

  function submitHabit(e) {
    e.preventDefault();
    const v = newHabit.trim();
    if (!v) return;
    addHabit(v);
    newHabit = '';
  }

  function delHabit(id) {
    if (confirmDel === id) {
      removeHabit(id);
      confirmDel = null;
    } else confirmDel = id;
  }
</script>

<header class="top cal-head">
  <span class="title-group">
    <span class="big">{offset === 0 ? '이번 주' : offset === -1 ? '지난주' : '위클리'}</span>
    <span class="sub">{range}</span>
  </span>
  <span class="head-btns">
    <button class="icon-btn outline" aria-label="이전 주" onclick={() => offset--}><Icon name="left" size={18} /></button>
    <button class="icon-btn outline" aria-label="다음 주" disabled={offset >= 0} onclick={() => offset++}><Icon name="right" size={18} /></button>
  </span>
</header>

<section class="card">
  <div class="diary">
    <div class="dh dl"></div>
    {#each week as d, i}<div class="dh" class:cur={d === clock.today}>{WD[i]}</div>{/each}
    <div class="dl">時間</div>
    {#each week as d}<div class="dc" class:cur={d === clock.today}>{hoursCell(d)}</div>{/each}
    <div class="dl last">比率</div>
    {#each week as d}<div class="dc last" class:cur={d === clock.today}>{ratio(d)}</div>{/each}
  </div>
  <div class="row-between total">
    <span>주간 총 집중 시간</span>
    <b>{fmtMinutes(totalMin)}</b>
  </div>
</section>

<section class="card">
  <div class="row-between center">
    <span class="bold">해빗 트래커</span>
    <button class="icon-btn tight" aria-label="습관 관리" onclick={() => { confirmDel = null; habitOpen = true; }}><Icon name="plus" size={18} /></button>
  </div>
  {#if app.habits.length === 0}
    <p class="empty">+ 버튼으로 매일 체크할 습관을 추가해 보세요</p>
  {:else}
    <div class="habits">
      <span></span>
      {#each week as d, i}<span class="hh" class:cur={d === clock.today}>{WD[i]}</span>{/each}
      <span></span>
      {#each app.habits as h (h.id)}
        <span class="hname">{h.name}</span>
        {#each week as d}
          <span class="hcell">
            <button
              class="hdot"
              class:on={habitDone(d, h.id)}
              disabled={d > clock.today}
              aria-label="{h.name} {d}"
              aria-pressed={habitDone(d, h.id)}
              onclick={() => toggleHabit(d, h.id)}
            >
              {#if habitDone(d, h.id)}<Icon name="check" size={12} />{/if}
            </button>
          </span>
        {/each}
        <span class="hcount">{week.filter((d) => habitDone(d, h.id)).length}/7</span>
      {/each}
    </div>
  {/if}
</section>

<DdayBanner />

<Modal bind:open={habitOpen} title="습관 관리">
  {#each app.habits as h (h.id)}
    <div class="m-row">
      <span class="m-name">{h.name}</span>
      <button class="del" class:confirm={confirmDel === h.id} aria-label="{h.name} 삭제" onclick={() => delHabit(h.id)}>
        {#if confirmDel === h.id}삭제{:else}<Icon name="trash" size={16} />{/if}
      </button>
    </div>
  {:else}
    <p class="empty">아직 습관이 없어요</p>
  {/each}
  <form class="add" onsubmit={submitHabit}>
    <input placeholder="예: 7시 기상" aria-label="새 습관 이름" bind:value={newHabit} enterkeyhint="done" />
    <button class="add-btn" aria-label="습관 추가"><Icon name="plus" /></button>
  </form>
</Modal>
