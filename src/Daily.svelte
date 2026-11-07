<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import {
    app, clock, dayOf, addTodo, removeTodo, setCarry, moveTodo, cycleMark, updateTodo,
    subjectOf, addSubject, removeSubject, FOCUS, BREAK,
  } from './lib/state.svelte.js';
  import { start, stop, togglePause, toggleFocusMode, remainingMs } from './lib/timer.js';
  import { parse, WD } from './lib/util.js';

  const MARK_CHAR = { o: 'O', t: '△', x: 'X' };

  let day = $derived(dayOf(clock.today));
  let date = $derived(parse(clock.today));
  let t = $derived(app.timer);
  let rem = $derived(remainingMs(clock.now));
  let total = $derived(t.phase === 'focus' ? FOCUS : BREAK);
  let elapsed = $derived(t.status === 'idle' ? 0 : total - rem);
  let statusLabel = $derived(
    t.status === 'idle' ? '대기' : t.status === 'paused' ? '일시정지' : t.phase === 'focus' ? '집중 중' : '휴식 중',
  );

  let selId = $state(null);
  let selected = $derived(day.todos.find((x) => x.id === selId) ?? null);
  let selSubject = $derived(subjectOf(app.prefs.lastSubject));

  let newText = $state('');
  let subjOpen = $state(false);
  let newSubject = $state('');
  let confirmDel = $state(null);

  let menuOpen = $state(false);
  let menuMode = $state('menu');
  let edText = $state('');
  let edSubject = $state(null);
  let delConfirm = $state(false);

  let listEl;
  let pillScroll;

  // keep the selected row visible inside the small screen
  $effect(() => {
    selId;
    const el = listEl?.querySelector('.row.sel');
    el?.scrollIntoView({ block: 'nearest' });
  });

  $effect(() => {
    app.prefs.lastSubject;
    const el = pillScroll?.querySelector('.pill.on');
    if (!el) return;
    const left = el.offsetLeft - pillScroll.offsetLeft;
    if (left < pillScroll.scrollLeft || left + el.offsetWidth > pillScroll.scrollLeft + pillScroll.clientWidth - 28) {
      pillScroll.scrollTo({ left: Math.max(0, left - 8), behavior: 'smooth' });
    }
  });

  function mmss(ms) {
    const s = Math.round(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  /* ----- wheel ----- */
  function playPause() {
    if (t.status === 'idle') start();
    else togglePause();
  }

  function nextMark() {
    if (!selected) {
      if (day.todos.length) selId = day.todos[0].id;
      return;
    }
    cycleMark(clock.today, selected);
  }

  function openMenu() {
    if (!selected) return;
    menuMode = 'menu';
    delConfirm = false;
    menuOpen = true;
  }

  /* ----- menu actions ----- */
  function moveBy(n) {
    const i = day.todos.findIndex((x) => x.id === selId);
    const target = n < 0 ? Math.max(0, i - 1) : Math.min(day.todos.length, i + 2);
    moveTodo(clock.today, selId, target);
  }

  function startEdit() {
    edText = selected.text;
    edSubject = subjectOf(selected.subject)?.id ?? null;
    menuMode = 'edit';
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!edText.trim()) return;
    updateTodo(clock.today, selId, { text: edText.trim(), subject: edSubject, mark: selected.mark });
    menuOpen = false;
  }

  function del() {
    if (!delConfirm) {
      delConfirm = true;
      return;
    }
    removeTodo(clock.today, selId);
    selId = null;
    menuOpen = false;
  }

  /* ----- add ----- */
  function submit(e) {
    e.preventDefault();
    const v = newText.trim();
    if (!v) return;
    addTodo(v, selSubject?.id ?? null);
    newText = '';
  }

  function chooseSubject(id) {
    app.prefs.lastSubject = app.prefs.lastSubject === id ? null : id;
  }

  function submitSubject(e) {
    e.preventDefault();
    const v = newSubject.trim();
    if (!v) return;
    const s = addSubject(v);
    app.prefs.lastSubject = s.id;
    newSubject = '';
  }

  function delSubject(id) {
    if (confirmDel === id) {
      removeSubject(id);
      confirmDel = null;
    } else confirmDel = id;
  }
</script>

<header class="top">
  <span class="big">{date.getMonth() + 1}월 {date.getDate()}일</span>
  <span class="sub">{WD[date.getDay()]}요일 · 데일리</span>
</header>

<div class="ipod">
  <div class="bezel">
    <div class="lcd">
      <div class="lcd-head">
        <span class="lcd-title">오늘 할 일</span>
        <span class="lcd-status">
          {#if t.focusMode}<span class="focus-badge">FOCUS</span>{/if}
          {#if t.status === 'running'}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor" /></svg>
          {:else if t.status === 'paused'}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.5" height="8" fill="currentColor" /><rect x="6" y="1" width="2.5" height="8" fill="currentColor" /></svg>
          {/if}
          <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="9" rx="1.5" fill="none" stroke="currentColor" /><rect x="2" y="2" width="9" height="6" fill="#8DB88A" /><rect x="16" y="3" width="1.5" height="4" fill="currentColor" /></svg>
        </span>
      </div>

      <div class="lcd-list" bind:this={listEl}>
        {#each day.todos as todo (todo.id)}
          {@const subj = subjectOf(todo.subject)}
          <button class="row" class:sel={todo.id === selId} aria-pressed={todo.id === selId} onclick={() => (selId = todo.id)}>
            <span class="row-t">{#if subj}<b class="row-sj" style:color={todo.id === selId ? null : subj.color}>[{subj.name}]</b>{/if}{todo.text}</span>
            <span class="row-mk mk-{todo.mark ?? 'none'}">{MARK_CHAR[todo.mark] ?? ''}</span>
          </button>
        {:else}
          <p class="lcd-empty">아래에서 할 일을 추가해 보세요</p>
        {/each}
      </div>

      <div class="lcd-foot">
        <div class="lcd-times">
          <span>{mmss(elapsed)}</span>
          <span class="lcd-state">{statusLabel} · 오늘 {day.focus}회</span>
          <span>-{mmss(rem)}</span>
        </div>
        <div class="lcd-bar"><div class="lcd-fill" class:rest={t.phase === 'break'} style:width="{(elapsed / total) * 100}%"></div></div>
      </div>
    </div>
  </div>

  <div class="wheel">
    <button class="wbtn w-top" class:on={t.focusMode} aria-label="집중 모드" aria-pressed={t.focusMode} onclick={toggleFocusMode}>MUSIC</button>
    <button class="wbtn w-left" aria-label="끝내기" disabled={t.status === 'idle'} onclick={stop}>
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="1.5" fill="currentColor" /></svg>
    </button>
    <button class="wbtn w-right" aria-label="선택한 할 일에 O △ X 표시" onclick={nextMark}>
      <svg width="26" height="16" viewBox="0 0 26 18" aria-hidden="true"><path d="M2 2l9 7-9 7z M12 2l9 7-9 7z" fill="currentColor" /><rect x="21" y="2" width="3" height="14" fill="currentColor" /></svg>
    </button>
    <button class="wbtn w-bottom" aria-label={t.status === 'running' ? '일시정지' : '재생'} onclick={playPause}>
      <svg width="34" height="16" viewBox="0 0 34 18" aria-hidden="true"><path d="M2 2l12 7-12 7z" fill="currentColor" /><rect x="19" y="2" width="4.5" height="14" fill="currentColor" /><rect x="27" y="2" width="4.5" height="14" fill="currentColor" /></svg>
    </button>
    <button class="wcenter" aria-label="선택한 할 일 메뉴" disabled={!selected} onclick={openMenu}></button>
  </div>
</div>

<section class="card">
  <div class="pill-bar" style="margin-top:0">
    <button class="pill dashed" aria-label="과목 관리" onclick={() => { confirmDel = null; subjOpen = true; }}><Icon name="plus" size={12} />과목</button>
    <div class="pill-scroll" bind:this={pillScroll}>
      {#each app.subjects as s (s.id)}
        <button class="pill" class:on={app.prefs.lastSubject === s.id} aria-pressed={app.prefs.lastSubject === s.id} onclick={() => chooseSubject(s.id)}>{s.name}</button>
      {/each}
    </div>
  </div>
  <form class="add" onsubmit={submit}>
    <input placeholder={selSubject ? `[${selSubject.name}] 할 일 추가` : '할 일 추가'} aria-label="할 일 추가" bind:value={newText} enterkeyhint="done" />
    <button class="add-btn" aria-label="추가"><Icon name="plus" /></button>
  </form>
</section>

<Modal bind:open={menuOpen} title="선택한 할 일">
  {#if selected}
    {@const subj = subjectOf(selected.subject)}
    <p class="menu-target">{#if subj}<b style:color={subj.color}>[{subj.name}]</b> {/if}{selected.text}</p>
    {#if menuMode === 'menu'}
      <div class="menu">
        <button class="menu-it" onclick={() => moveBy(-1)} disabled={day.todos[0]?.id === selId}><Icon name="up" size={18} />위로 옮기기</button>
        <button class="menu-it" onclick={() => moveBy(1)} disabled={day.todos.at(-1)?.id === selId}><Icon name="down" size={18} />아래로 옮기기</button>
        <label class="menu-it" class:off={selected.mark !== 'x' && selected.mark !== 't'}>
          <Icon name="right" size={18} />
          <span class="grow-text">내일 투두에 띄우기{#if selected.mark !== 'x' && selected.mark !== 't'}<small> (△, X일 때만)</small>{/if}</span>
          <input
            type="checkbox"
            class="switch"
            checked={selected.carry}
            disabled={selected.mark !== 'x' && selected.mark !== 't'}
            onchange={(e) => setCarry(clock.today, selected, e.currentTarget.checked)}
          />
        </label>
        <button class="menu-it" onclick={startEdit}><Icon name="edit" size={18} />과목 · 내용 수정</button>
        <button class="menu-it danger-text" onclick={del}><Icon name="trash" size={18} />{delConfirm ? '한 번 더 누르면 삭제돼요' : '삭제'}</button>
      </div>
    {:else}
      <form class="form" onsubmit={saveEdit}>
        <div class="field-label">과목</div>
        <div class="pills wrap">
          <button type="button" class="pill" class:on={edSubject === null} onclick={() => (edSubject = null)}>없음</button>
          {#each app.subjects as s (s.id)}
            <button type="button" class="pill" class:on={edSubject === s.id} onclick={() => (edSubject = s.id)}>{s.name}</button>
          {/each}
        </div>
        <label>내용<input bind:value={edText} required /></label>
        <button class="btn accent wide">저장</button>
      </form>
    {/if}
  {/if}
</Modal>

<Modal bind:open={subjOpen} title="과목 관리">
  {#each app.subjects as s (s.id)}
    <div class="m-row">
      <span class="swatch" style:background={s.color}></span>
      <span class="m-name">{s.name}</span>
      <button class="del" class:confirm={confirmDel === s.id} aria-label="{s.name} 삭제" onclick={() => delSubject(s.id)}>
        {#if confirmDel === s.id}삭제{:else}<Icon name="trash" size={16} />{/if}
      </button>
    </div>
  {:else}
    <p class="empty">아직 과목이 없어요</p>
  {/each}
  <form class="add" onsubmit={submitSubject}>
    <input placeholder="새 과목 이름" aria-label="새 과목 이름" bind:value={newSubject} enterkeyhint="done" />
    <button class="add-btn" aria-label="과목 추가"><Icon name="plus" /></button>
  </form>
</Modal>
