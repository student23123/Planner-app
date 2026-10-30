<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import { app, clock, addEvent, removeEvent, addDday, removeDday } from './lib/state.svelte.js';
  import { ymd, parse, addDays, diffDays, label, WD, hoursOf, PALETTE } from './lib/util.js';
  import { readImage } from './lib/image.js';

  const todayDate = parse(clock.today);
  let viewY = $state(todayDate.getFullYear());
  let viewM = $state(todayDate.getMonth());
  let selected = $state(clock.today);

  let cells = $derived.by(() => {
    const first = new Date(viewY, viewM, 1);
    const days = new Date(viewY, viewM + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < first.getDay(); i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(ymd(new Date(viewY, viewM, d)));
    return out;
  });

  let eventDates = $derived(new Set(app.events.map((e) => e.date)));

  let selDay = $derived(app.days[selected]);
  let selEvents = $derived(
    app.events.filter((e) => e.date === selected).sort((a, b) => (a.time || '99').localeCompare(b.time || '99')),
  );

  let week = $derived.by(() => {
    const startD = addDays(selected, -parse(selected).getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(startD, i));
  });

  let weekTotalMin = $derived(week.reduce((sum, d) => sum + (app.days[d]?.focus ?? 0) * 30, 0));

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

  function move(n) {
    const d = new Date(viewY, viewM + n, 1);
    viewY = d.getFullYear();
    viewM = d.getMonth();
  }

  function markChar(m) {
    return m === 'o' ? 'O' : m === 't' ? '△' : m === 'x' ? 'X' : '·';
  }

  /* ----- events ----- */
  let evOpen = $state(false);
  let evTitle = $state('');
  let evDate = $state('');
  let evTime = $state('');
  let confirmEv = $state(null);

  function openEvent() {
    evTitle = '';
    evDate = selected;
    evTime = '';
    evOpen = true;
  }

  function saveEvent(e) {
    e.preventDefault();
    if (!evTitle.trim() || !evDate) return;
    addEvent({ title: evTitle.trim(), date: evDate, time: evTime });
    selected = evDate;
    evOpen = false;
  }

  function delEvent(id) {
    if (confirmEv === id) {
      removeEvent(id);
      confirmEv = null;
    } else confirmEv = id;
  }

  /* ----- d-day ----- */
  let ddOpen = $state(false);
  let ddTitle = $state('');
  let ddDate = $state('');
  let ddPhoto = $state(null);
  let ddError = $state('');
  let confirmDd = $state(null);
  let ddFile;
  let scroller;
  let slide = $state(0);

  function dLabel(date) {
    const n = diffDays(date, clock.today);
    if (n > 0) return `D-${n}`;
    if (n === 0) return 'D-DAY';
    return `D+${-n}`;
  }

  function dSub(date) {
    const n = diffDays(date, clock.today);
    return n < 0 ? `${label(date)} - ${-n}일째` : label(date);
  }

  function bannerStyle(dd) {
    const shade = 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.62))';
    if (dd.photo) return `background-image:${shade},url("${dd.photo}");background-size:cover;background-position:center`;
    const [a, b] = PALETTE[dd.color % PALETTE.length];
    return `background-image:${shade},linear-gradient(135deg,${a},${b})`;
  }

  function swatch(dd) {
    if (dd.photo) return `background-image:url("${dd.photo}");background-size:cover;background-position:center`;
    const [a, b] = PALETTE[dd.color % PALETTE.length];
    return `background-image:linear-gradient(135deg,${a},${b})`;
  }

  function onScroll() {
    if (!scroller) return;
    slide = Math.round(scroller.scrollLeft / scroller.clientWidth);
  }

  function openDday() {
    ddTitle = '';
    ddDate = clock.today;
    ddPhoto = null;
    ddError = '';
    ddOpen = true;
  }

  async function onDdFile(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      ddPhoto = (await readImage(f, 1000, true)).src;
      ddError = '';
    } catch {
      ddError = '사진을 불러오지 못했어요.';
    }
  }

  function saveDday(e) {
    e.preventDefault();
    if (!ddTitle.trim() || !ddDate) return;
    addDday({ title: ddTitle.trim(), date: ddDate, photo: ddPhoto });
    ddOpen = false;
  }

  function delDday(id) {
    if (confirmDd === id) {
      removeDday(id);
      confirmDd = null;
    } else confirmDd = id;
  }
</script>

<header class="top cal-head">
  <span class="big">{viewY}년 {viewM + 1}월</span>
  <span class="head-btns">
    <button class="icon-btn outline" aria-label="이전 달" onclick={() => move(-1)}><Icon name="left" size={18} /></button>
    <button class="icon-btn outline" aria-label="다음 달" onclick={() => move(1)}><Icon name="right" size={18} /></button>
    <button class="icon-btn accent" aria-label="일정 추가" onclick={openEvent}><Icon name="plus" size={18} /></button>
  </span>
</header>

<section class="card cal">
  <div class="grid7">
    {#each WD as w}<div class="wd">{w}</div>{/each}
  </div>
  <div class="grid7">
    {#each cells as c}
      {#if c}
        <button class="dcell" class:today={c === clock.today} aria-pressed={c === selected} onclick={() => (selected = c)}>
          <span class="num" class:sel={c === selected}>{parse(c).getDate()}</span>
          <i class="dot" class:show={eventDates.has(c)}></i>
        </button>
      {:else}
        <span></span>
      {/if}
    {/each}
  </div>
</section>

<section class="card">
  <div class="row-between">
    <span class="bold">{label(selected)}</span>
    <span class="accent-text bold small">집중 {selDay?.focus ?? 0}회 · {hoursOf(selDay?.focus ?? 0)}시간</span>
  </div>
  {#each selEvents as ev (ev.id)}
    <div class="ev-row">
      <span class="ev-time">{ev.time || '종일'}</span>
      <span class="ev-title">{ev.title}</span>
      <button class="del" class:confirm={confirmEv === ev.id} aria-label="일정 삭제" onclick={() => delEvent(ev.id)}>
        {#if confirmEv === ev.id}삭제{:else}<Icon name="trash" size={16} />{/if}
      </button>
    </div>
  {/each}
  {#if selDay && selDay.todos.length}
    <div class="day-todos">
      {#each selDay.todos as td (td.id)}
        <div class="td"><b class="m-{td.mark ?? 'none'}">{markChar(td.mark)}</b>{td.text}</div>
      {/each}
    </div>
  {:else if selEvents.length === 0}
    <p class="empty">기록이 없어요</p>
  {/if}
</section>

<section class="card">
  <div class="row-between">
    <span class="bold">이번 주</span>
    <span class="muted small">{parse(week[0]).getMonth() + 1}.{parse(week[0]).getDate()} – {parse(week[6]).getMonth() + 1}.{parse(week[6]).getDate()}</span>
  </div>
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
    <b>{Math.floor(weekTotalMin / 60)}시간 {String(weekTotalMin % 60).padStart(2, '0')}분</b>
  </div>
</section>

<section class="dday-wrap">
  <div class="dday" bind:this={scroller} onscroll={onScroll}>
    {#each app.ddays as dd (dd.id)}
      <div class="banner" style={bannerStyle(dd)}>
        <div class="d-big">{dLabel(dd.date)}</div>
        <div class="d-title">{dd.title}</div>
        <div class="d-sub">{dSub(dd.date)}</div>
      </div>
    {/each}
    <div class="banner manage">
      <div class="bold">디데이 관리</div>
      <div class="manage-list">
        {#each app.ddays as dd (dd.id)}
          <div class="m-row">
            <span class="swatch" style={swatch(dd)}></span>
            <span class="m-name">{dd.title}</span>
            <span class="muted small">{dLabel(dd.date)}</span>
            <button class="del" class:confirm={confirmDd === dd.id} aria-label="{dd.title} 삭제" onclick={() => delDday(dd.id)}>
              {#if confirmDd === dd.id}삭제{:else}<Icon name="trash" size={16} />{/if}
            </button>
          </div>
        {:else}
          <p class="empty">아직 디데이가 없어요</p>
        {/each}
      </div>
      <button class="btn dashed wide" onclick={openDday}><Icon name="plus" size={16} />디데이 추가</button>
    </div>
  </div>
  <div class="dots" aria-hidden="true">
    {#each { length: app.ddays.length + 1 } as _, i}<i class:on={i === slide}></i>{/each}
  </div>
</section>

<Modal bind:open={evOpen} title="일정 추가">
  <form class="form" onsubmit={saveEvent}>
    <label>제목<input bind:value={evTitle} placeholder="예: 병원 예약" required /></label>
    <label>날짜<input type="date" bind:value={evDate} required /></label>
    <label>시간 (선택)<input type="time" bind:value={evTime} /></label>
    <button class="btn accent wide">저장</button>
  </form>
</Modal>

<Modal bind:open={ddOpen} title="디데이 추가">
  <form class="form" onsubmit={saveDday}>
    <label>이름<input bind:value={ddTitle} placeholder="예: 시험일" required /></label>
    <label>날짜<input type="date" bind:value={ddDate} required /></label>
    <div class="photo-row">
      {#if ddPhoto}
        <span class="photo-prev" style="background-image:url('{ddPhoto}')"></span>
        <button type="button" class="btn ghost" onclick={() => (ddPhoto = null)}>사진 빼기</button>
      {:else}
        <button type="button" class="btn ghost" onclick={() => ddFile.click()}><Icon name="image" size={18} />사진 고르기 (선택)</button>
      {/if}
    </div>
    <p class="muted small">사진이 없으면 색 그라데이션으로 표시돼요.</p>
    {#if ddError}<p class="error">{ddError}</p>{/if}
    <button class="btn accent wide">저장</button>
  </form>
</Modal>

<input type="file" accept="image/*" hidden bind:this={ddFile} onchange={onDdFile} />
