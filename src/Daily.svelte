<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import {
    app, clock, dayOf, addTodo, removeTodo, setMark, setCarry, moveTodo,
    addStamp, setStamp, removeStamp, subjectOf, addSubject, removeSubject, FOCUS, BREAK,
  } from './lib/state.svelte.js';
  import { start, stop, togglePause, toggleFocusMode, remainingMs } from './lib/timer.js';
  import { readImage } from './lib/image.js';
  import { parse, WD, hoursOf } from './lib/util.js';

  const C = 2 * Math.PI * 54;
  const MARKS = [
    { m: 'o', label: '완료' },
    { m: 't', label: '일부 완료' },
    { m: 'x', label: '미완료' },
  ];

  let day = $derived(dayOf(clock.today));
  let date = $derived(parse(clock.today));
  let t = $derived(app.timer);
  let rem = $derived(remainingMs(clock.now));
  let total = $derived(t.phase === 'focus' ? FOCUS : BREAK);
  let progress = $derived(t.status === 'idle' ? 0 : 1 - rem / total);
  let statusLabel = $derived(
    t.status === 'idle' ? '대기' : t.status === 'paused' ? '일시정지' : t.phase === 'focus' ? '집중 중' : '휴식 중',
  );

  let stamp = $derived(day.stamp ? app.stamps.find((s) => s.id === day.stamp) : null);
  let stampSize = $derived(stamp ? fit(stamp.w, stamp.h) : null);
  let selSubject = $derived(subjectOf(app.prefs.lastSubject));

  let newText = $state('');
  let stampOpen = $state(false);
  let subjOpen = $state(false);
  let newSubject = $state('');
  let confirmDel = $state(null);
  let errorMsg = $state('');
  let dragId = $state(null);
  let fileInput;
  let listEl;

  function fit(w, h) {
    const s = Math.sqrt(32000 / (w * h));
    const dw = w * s;
    const dh = h * s;
    const k = Math.min(1, 250 / dw, 230 / dh);
    return { w: Math.round(dw * k), h: Math.round(dh * k) };
  }

  function fmt(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

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

  /* ----- drag to reorder ----- */
  function gripDown(e, id) {
    e.preventDefault();
    dragId = id;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function gripMove(e) {
    if (!dragId || !listEl) return;
    const rows = [...listEl.querySelectorAll(':scope > .todo')];
    let target = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) {
        target = i;
        break;
      }
    }
    moveTodo(clock.today, dragId, target);
  }

  function gripUp() {
    dragId = null;
  }

  /* ----- stamps ----- */
  async function onFile(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    errorMsg = '';
    try {
      const img = await readImage(f, 520);
      const s = addStamp(img);
      setStamp(clock.today, s.id);
      stampOpen = false;
    } catch {
      errorMsg = '사진을 불러오지 못했어요. 다른 사진으로 시도해 주세요.';
    }
  }

  function pick(id) {
    setStamp(clock.today, id);
    stampOpen = false;
  }

  function delStamp(id) {
    if (confirmDel === id) {
      removeStamp(id);
      confirmDel = null;
    } else confirmDel = id;
  }
</script>

<header class="top">
  <span class="big">{date.getMonth() + 1}월 {date.getDate()}일</span>
  <span class="sub">{WD[date.getDay()]}요일 · 데일리</span>
</header>

<section class="card">
  <div class="pomo-row">
    <div class="ring">
      <svg width="120" height="120" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="54" fill="none" stroke="var(--line)" stroke-width="8" />
        <circle
          cx="64" cy="64" r="54" fill="none"
          stroke={t.phase === 'break' ? 'var(--green)' : 'var(--accent)'}
          stroke-width="8" stroke-linecap="round"
          stroke-dasharray={C} stroke-dashoffset={C * (1 - progress)}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div class="ring-text">
        <span class="time">{fmt(rem)}</span>
        <span class="muted small">{statusLabel}</span>
      </div>
    </div>
    <div class="pomo-side">
      <div class="count">오늘 집중 {day.focus}회</div>
      <div class="muted small">{hoursOf(day.focus)}시간 · 25분을 채워야 카운트</div>
      <div class="controls">
        <button
          class="ctl primary"
          aria-label={t.status === 'idle' ? '시작' : '끝내기'}
          onclick={() => (t.status === 'idle' ? start() : stop())}
        >
          <Icon name={t.status === 'idle' ? 'play' : 'stop'} />
        </button>
        <button
          class="ctl"
          class:dark={t.status === 'paused'}
          aria-label={t.status === 'paused' ? '다시 시작' : '일시정지'}
          aria-pressed={t.status === 'paused'}
          disabled={t.status === 'idle'}
          onclick={togglePause}
        >
          <Icon name="pause" />
        </button>
        <span class="sep"></span>
        <button class="ctl" class:dark={t.focusMode} aria-label="집중 모드" aria-pressed={t.focusMode} onclick={toggleFocusMode}>
          <Icon name="pen" />
        </button>
      </div>
    </div>
  </div>
  {#if t.focusMode}
    <div class="mode-note"><Icon name="pen" size={14} />집중 모드 ON · 25분 집중 → 5분 휴식 반복</div>
  {/if}
</section>

<section class="card todos" style:min-height={stamp ? `${stampSize.h + 70}px` : null}>
  <h2 class="card-title">오늘 할 일</h2>
  {#if stamp}
    <img class="stamp" src={stamp.src} alt="" style:width="{stampSize.w}px" style:height="{stampSize.h}px" />
  {/if}

  {#if day.todos.length === 0}
    <p class="empty">할 일을 추가해 보세요</p>
  {/if}

  <div bind:this={listEl}>
    {#each day.todos as todo (todo.id)}
      {@const subj = subjectOf(todo.subject)}
      <div class="todo" class:dragging={dragId === todo.id}>
        <div class="todo-row">
          <button
            class="grip"
            aria-label="순서 이동"
            onpointerdown={(e) => gripDown(e, todo.id)}
            onpointermove={gripMove}
            onpointerup={gripUp}
            onpointercancel={gripUp}
          >
            <Icon name="grip" size={18} />
          </button>
          <span class="todo-text">
            {#if subj}<b class="subj" style:color={subj.color}>[{subj.name}]</b>{/if}{todo.text}
          </span>
          <span class="marks">
            {#each MARKS as { m, label }}
              <button
                class="mark mark-{m}"
                class:sel={todo.mark === m}
                aria-label={label}
                aria-pressed={todo.mark === m}
                onclick={() => setMark(clock.today, todo, m)}
              >
                <Icon name={m} size={15} />
              </button>
            {/each}
          </span>
          <button class="del" aria-label="삭제" onclick={() => removeTodo(clock.today, todo.id)}>
            <Icon name="trash" size={18} />
          </button>
        </div>
        {#if todo.mark === 'x' || todo.mark === 't'}
          <label class="carry">
            <input type="checkbox" checked={todo.carry} onchange={(e) => setCarry(clock.today, todo, e.currentTarget.checked)} />
            내일 투두에 띄우기
          </label>
        {/if}
      </div>
    {/each}
  </div>

  <div class="pills">
    {#each app.subjects as s (s.id)}
      <button class="pill" class:on={app.prefs.lastSubject === s.id} aria-pressed={app.prefs.lastSubject === s.id} onclick={() => chooseSubject(s.id)}>{s.name}</button>
    {/each}
    <button class="pill dashed" onclick={() => { confirmDel = null; subjOpen = true; }}><Icon name="plus" size={12} />과목</button>
  </div>
  <form class="add" onsubmit={submit}>
    <input placeholder={selSubject ? `[${selSubject.name}] 할 일 추가` : '할 일 추가'} aria-label="할 일 추가" bind:value={newText} enterkeyhint="done" />
    <button class="add-btn" aria-label="추가"><Icon name="plus" /></button>
  </form>
</section>

<section class="card">
  <div class="finish-row">
    <div>
      <div class="bold">하루 마무리</div>
      <div class="muted small">저장된 스탬프에서 고르거나 새로 추가</div>
    </div>
    <button class="btn accent" onclick={() => { confirmDel = null; errorMsg = ''; stampOpen = true; }}>스탬프 찍기</button>
  </div>
</section>

<Modal bind:open={stampOpen} title="스탬프 고르기">
  <div class="stamp-grid">
    {#each app.stamps as s (s.id)}
      <div class="stamp-cell">
        <button class="stamp-pick" class:sel={day.stamp === s.id} aria-label="이 스탬프 찍기" onclick={() => pick(s.id)}>
          <img src={s.src} alt="" />
        </button>
        <button class="stamp-x" class:confirm={confirmDel === s.id} aria-label="스탬프 삭제" onclick={() => delStamp(s.id)}>
          {#if confirmDel === s.id}삭제{:else}<Icon name="close" size={12} />{/if}
        </button>
      </div>
    {/each}
    <button class="stamp-add" onclick={() => fileInput.click()}>
      <Icon name="image" size={22} /><span>갤러리</span>
    </button>
  </div>
  {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
  {#if day.stamp}
    <button class="btn ghost wide" onclick={() => pick(null)}>오늘 스탬프 지우기</button>
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

<input type="file" accept="image/*" hidden bind:this={fileInput} onchange={onFile} />
