<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import { app, clock, addEvent, removeEvent, subjectOf, updateTodo, removeTodo } from './lib/state.svelte.js';
  import { ymd, parse, label, WD, hoursOf, fmtMinutes } from './lib/util.js';

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

  const score = (t) => (t.mark === 'o' ? 1 : t.mark === 't' ? 0.5 : 0);

  let stats = $derived.by(() => {
    const dates = cells.filter((d) => d && d <= clock.today);
    if (dates.length === 0) return null;
    let focus = 0;
    const ratios = [];
    const bySubj = new Map();
    let subjTotal = 0;
    for (const d of dates) {
      const day = app.days[d];
      if (!day) continue;
      focus += day.focus;
      if (day.todos.length) {
        ratios.push(day.todos.reduce((s, t) => s + score(t), 0) / day.todos.length);
      }
      for (const t of day.todos) {
        const subj = subjectOf(t.subject);
        const sc = score(t);
        if (!subj || sc === 0) continue;
        bySubj.set(subj.id, (bySubj.get(subj.id) ?? 0) + sc);
        subjTotal += sc;
      }
    }
    const totalMin = focus * 30;
    const shares = [...bySubj.entries()]
      .map(([id, v]) => ({ subj: subjectOf(id), pct: (v / subjTotal) * 100 }))
      .sort((a, b) => b.pct - a.pct);
    return {
      totalMin,
      avgMin: totalMin / dates.length,
      avgRatio: ratios.length ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : null,
      shares,
    };
  });

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

  /* ----- edit todo ----- */
  let edOpen = $state(false);
  let edId = $state(null);
  let edText = $state('');
  let edSubject = $state(null);
  let edMark = $state(null);
  let edConfirm = $state(false);

  function openEdit(t) {
    edId = t.id;
    edText = t.text;
    edSubject = subjectOf(t.subject)?.id ?? null;
    edMark = t.mark;
    edConfirm = false;
    edOpen = true;
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!edText.trim()) return;
    updateTodo(selected, edId, { text: edText.trim(), subject: edSubject, mark: edMark });
    edOpen = false;
  }

  function delEdit() {
    if (!edConfirm) {
      edConfirm = true;
      return;
    }
    removeTodo(selected, edId);
    edOpen = false;
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
        {@const subj = subjectOf(td.subject)}
        <div class="td">
          <b class="m-{td.mark ?? 'none'}">{markChar(td.mark)}</b>
          <span class="td-text">{#if subj}<b class="subj" style:color={subj.color}>[{subj.name}]</b>{/if}{td.text}</span>
          <button class="del" aria-label="수정" onclick={() => openEdit(td)}><Icon name="edit" size={16} /></button>
        </div>
      {/each}
    </div>
  {:else if selEvents.length === 0}
    <p class="empty">기록이 없어요</p>
  {/if}
</section>

<section class="card">
  <span class="bold">{viewM + 1}월 통계</span>
  {#if stats}
    <div class="tiles">
      <div class="tile"><div class="k">월 총 집중 시간</div><div class="v">{fmtMinutes(stats.totalMin)}</div></div>
      <div class="tile"><div class="k">하루 평균</div><div class="v">{fmtMinutes(stats.avgMin)}</div></div>
      <div class="tile"><div class="k">하루 평균 완수율</div><div class="v">{stats.avgRatio === null ? '-' : `${stats.avgRatio}%`}</div></div>
    </div>
    <div class="sub-title">과목별 투두 완수 비중</div>
    {#if stats.shares.length}
      <div class="sbar">
        {#each stats.shares as s}<span style:width="{s.pct}%" style:background={s.subj.color}></span>{/each}
      </div>
      {#each stats.shares as s}
        <div class="lg"><i style:background={s.subj.color}></i><span class="n">{s.subj.name}</span><span class="p">{Math.round(s.pct)}%</span></div>
      {/each}
    {:else}
      <p class="empty">과목을 단 할 일을 완료하면 여기에 표시돼요</p>
    {/if}
  {:else}
    <p class="empty">아직 지나지 않은 달이에요</p>
  {/if}
</section>

<Modal bind:open={evOpen} title="일정 추가">
  <form class="form" onsubmit={saveEvent}>
    <label>제목<input bind:value={evTitle} placeholder="예: 병원 예약" required /></label>
    <label>날짜<input type="date" bind:value={evDate} required /></label>
    <label>시간 (선택)<input type="time" bind:value={evTime} /></label>
    <button class="btn accent wide">저장</button>
  </form>
</Modal>

<Modal bind:open={edOpen} title="할 일 수정 · {label(selected)}">
  <form class="form" onsubmit={saveEdit}>
    <div class="field-label">과목</div>
    <div class="pills wrap">
      <button type="button" class="pill" class:on={edSubject === null} onclick={() => (edSubject = null)}>없음</button>
      {#each app.subjects as s (s.id)}
        <button type="button" class="pill" class:on={edSubject === s.id} onclick={() => (edSubject = s.id)}>{s.name}</button>
      {/each}
    </div>
    <label>내용<input bind:value={edText} required /></label>
    <div class="field-label">완수 정도</div>
    <div class="mark-pick">
      {#each [['o', '완료'], ['t', '일부 완료'], ['x', '미완료']] as [m, lb]}
        <button type="button" class="mark big-mark mark-{m}" class:sel={edMark === m} aria-label={lb} aria-pressed={edMark === m} onclick={() => (edMark = edMark === m ? null : m)}>
          <Icon name={m} size={18} />
        </button>
      {/each}
    </div>
    <div class="btn-row">
      <button type="button" class="btn ghost danger" class:confirm={edConfirm} onclick={delEdit}>{edConfirm ? '정말 삭제' : '삭제'}</button>
      <button class="btn accent grow">저장</button>
    </div>
  </form>
</Modal>
