<script>
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import { app, clock, addDday, updateDday, removeDday } from './lib/state.svelte.js';
  import { diffDays, label, PALETTE } from './lib/util.js';
  import { readImage } from './lib/image.js';

  let scroller;
  let slide = $state(0);

  let open = $state(false);
  let editId = $state(null);
  let title = $state('');
  let date = $state('');
  let photo = $state(null);
  let error = $state('');
  let confirmDel = $state(false);
  let fileInput;

  function dLabel(d) {
    const n = diffDays(d, clock.today);
    if (n > 0) return `D-${n}`;
    if (n === 0) return 'D-DAY';
    return `D+${-n}`;
  }

  function dSub(d) {
    const n = diffDays(d, clock.today);
    return n < 0 ? `${label(d)} - ${-n}일째` : label(d);
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

  function openNew() {
    editId = null;
    title = '';
    date = clock.today;
    photo = null;
    error = '';
    confirmDel = false;
    open = true;
  }

  function openEdit(dd) {
    editId = dd.id;
    title = dd.title;
    date = dd.date;
    photo = dd.photo;
    error = '';
    confirmDel = false;
    open = true;
  }

  async function onFile(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      photo = (await readImage(f, 1000, true)).src;
      error = '';
    } catch {
      error = '사진을 불러오지 못했어요.';
    }
  }

  function save(e) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const data = { title: title.trim(), date, photo };
    if (editId) updateDday(editId, data);
    else addDday(data);
    open = false;
  }

  function del() {
    if (!confirmDel) {
      confirmDel = true;
      return;
    }
    removeDday(editId);
    open = false;
  }
</script>

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
          <button class="m-row m-btn" onclick={() => openEdit(dd)}>
            <span class="swatch" style={swatch(dd)}></span>
            <span class="m-name">{dd.title}</span>
            <span class="muted small">{dLabel(dd.date)}</span>
            <Icon name="right" size={14} />
          </button>
        {:else}
          <p class="empty">아직 디데이가 없어요</p>
        {/each}
      </div>
      <button class="btn dashed wide" onclick={openNew}><Icon name="plus" size={16} />디데이 추가</button>
    </div>
  </div>
  <div class="dots" aria-hidden="true">
    {#each { length: app.ddays.length + 1 } as _, i}<i class:on={i === slide}></i>{/each}
  </div>
</section>

<Modal bind:open title={editId ? '디데이 수정' : '디데이 추가'}>
  <form class="form" onsubmit={save}>
    <label>이름<input bind:value={title} placeholder="예: 시험일" required /></label>
    <label>날짜<input type="date" bind:value={date} required /></label>
    <div class="photo-row">
      {#if photo}
        <span class="photo-prev" style="background-image:url('{photo}')"></span>
        <button type="button" class="btn ghost" onclick={() => fileInput.click()}>사진 바꾸기</button>
        <button type="button" class="btn plain" onclick={() => (photo = null)}>사진 빼기</button>
      {:else}
        <button type="button" class="btn ghost" onclick={() => fileInput.click()}><Icon name="image" size={18} />사진 고르기 (선택)</button>
      {/if}
    </div>
    <p class="muted small">사진이 없으면 색 그라데이션으로 표시돼요.</p>
    {#if error}<p class="error">{error}</p>{/if}
    <div class="btn-row">
      {#if editId}
        <button type="button" class="btn ghost danger" class:confirm={confirmDel} onclick={del}>{confirmDel ? '정말 삭제' : '삭제'}</button>
      {/if}
      <button class="btn accent grow">저장</button>
    </div>
  </form>
</Modal>

<input type="file" accept="image/*" hidden bind:this={fileInput} onchange={onFile} />
