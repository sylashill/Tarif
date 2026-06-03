// ============================================================
// detailview.js — Detaylı tarif görüntüleme (sekmeli, banner)
//   Yüklenen tiftik-burger HTML tasarımına benzer tam sayfa görünüm
// ============================================================

const DetailView = (() => {

  let _activeTab = 0;
  let _recipe = null;

  function open(recipe) {
    _recipe = recipe;
    _activeTab = 0;
    App.showView('detail-view');
    _render();
  }

  function _theme() {
    return ENTRY_THEMES.find(t => t.id === (_recipe.entryTheme||'gold')) || ENTRY_THEMES[0];
  }

  async function _render() {
    const r = _recipe;
    const th = _theme();
    const root = document.getElementById('detail-view-root');
    if (!root) return;

    // Tema değişkenlerini bu görünüme uygula
    root.style.setProperty('--dv-bg', th.bg);
    root.style.setProperty('--dv-card', th.card);
    root.style.setProperty('--dv-accent', th.accent);
    root.style.setProperty('--dv-cream', th.cream);

    // Banner
    let bannerInner;
    if (r.hasImage) {
      bannerInner = `<img class="dv-banner-img" id="dv-banner-img" src="">`;
    } else {
      bannerInner = `<div class="dv-banner-emoji">${r.image||'🍽️'}</div>`;
    }

    const infoPills = [
      r.duration   ? `<span class="dv-pill">⏱ <b>${_esc(r.duration)}</b></span>` : '',
      `<span class="dv-pill">👥 <b>${r.servings} kişilik</b></span>`,
      r.difficulty ? `<span class="dv-pill">📊 <b>${_esc(r.difficulty)}</b></span>` : '',
      r.calories   ? `<span class="dv-pill">🔥 <b>${_esc(r.calories)} kcal</b></span>` : '',
    ].join('');

    const tabs = r.tabs || [];

    root.innerHTML = `
      <div class="dv-topbar">
        <button class="dv-back" onclick="App.showPage(App._cp||'recipes')">←</button>
        <div class="dv-topbar-actions">
          <button class="dv-icon-btn" onclick="DetailView._edit()">✏️</button>
          <button class="dv-icon-btn" onclick="App.addToShopping(${r.id})">🛒</button>
          <button class="dv-icon-btn" onclick="App.printRecipe(${r.id})">🖨️</button>
          <button class="dv-icon-btn" onclick="App.copyRecipe(${r.id})">📋</button>
          <button class="dv-icon-btn" onclick="App.exportRecipe(${r.id})">📤</button>
          <button class="dv-icon-btn danger" onclick="App.openDeleteModal(${r.id})">🗑️</button>
        </div>
      </div>

      <div class="dv-scroll" id="dv-scroll">
        <div class="dv-banner ${r.hasImage?'has-img':''}" id="dv-banner">
          ${bannerInner}
          <div class="dv-banner-overlay">
            ${r.subtitle?`<div class="dv-label">${_esc(r.subtitle)}</div>`:''}
            <h1 class="dv-title">${_esc(r.name)}</h1>
            ${(r.categories&&r.categories.length)?`<div class="dv-cats">${r.categories.join(' · ')}</div>`:''}
          </div>
        </div>

        <div class="dv-tabs" id="dv-tabs">
          ${tabs.map((t,i)=>`<button class="dv-tab-btn${i===_activeTab?' active':''}" onclick="DetailView._tab(${i})">${t.icon||'📄'} ${_esc(t.title)}</button>`).join('')}
          ${r.alternatives&&r.alternatives.length?`<button class="dv-tab-btn${_activeTab==='alt'?' active':''}" onclick="DetailView._tab('alt')">🔄 Alternatifler</button>`:''}
        </div>

        <div class="dv-info-row">${infoPills}</div>

        <div class="dv-content" id="dv-content">${_renderTab()}</div>
      </div>
    `;

    // banner görselini yükle + scroll collapse
    if (r.hasImage) {
      const blob = await Storage.getImage(r.id);
      if (blob) { const img=document.getElementById('dv-banner-img'); if(img)img.src=URL.createObjectURL(blob); }
    }
    _setupScrollCollapse();
  }

  function _tab(i){
    _activeTab=i;
    document.getElementById('dv-content').innerHTML=_renderTab();
    // aktif sekme vurgusunu güncelle (tam re-render YOK → scroll korunur)
    const r=_recipe;
    const btns=document.querySelectorAll('.dv-tab-btn');
    btns.forEach((b,idx)=>{
      const isAlt = (r.alternatives&&r.alternatives.length) && idx===btns.length-1;
      const tabIndex = isAlt ? 'alt' : idx;
      b.classList.toggle('active', String(tabIndex)===String(i));
    });
  }

  function _renderTab() {
    const r=_recipe;
    if (_activeTab==='alt') return _renderAlternatives();
    const tab=(r.tabs||[])[_activeTab];
    if (!tab) return '';
    if (!tab.blocks || !tab.blocks.length) return `<div class="dv-empty">Bu sekmede içerik yok</div>`;
    return tab.blocks.map(b=>_renderBlock(b)).join('');
  }

  function _renderBlock(b) {
    if (b.type==='ingredients') {
      return `<div class="dv-section">
        ${b.title?`<div class="dv-ing-group-title">${_esc(b.title)}</div>`:''}
        <ul class="dv-ing-list">
          ${(b.items||[]).filter(i=>i.name).map(it=>`
            <li>
              <span class="dv-ing-name">${_esc(it.name)}${it.note?`<span class="dv-ing-note">${_esc(it.note)}</span>`:''}</span>
              ${it.amount?`<span class="dv-ing-amount">${_esc(it.amount)}</span>`:''}
            </li>`).join('')}
        </ul>
      </div>`;
    }
    if (b.type==='steps') {
      return `<ol class="dv-steps">
        ${(b.items||[]).filter(i=>i.text||i.title).map((it,i)=>{
          let boxHtml='';
          if(it.box && it.box.text){
            const bt=BOX_TYPES.find(x=>x.id===(it.box.type||'tip'))||BOX_TYPES[0];
            boxHtml=`<div class="dv-box ${bt.cls}" style="margin-top:10px"><b>${bt.icon} ${bt.label}:</b> ${_esc(it.box.text)}</div>`;
          }
          return `
          <li class="dv-step">
            <div class="dv-step-num">${i+1}</div>
            <div class="dv-step-body">
              ${it.title?`<div class="dv-step-title">${_esc(it.title)}</div>`:''}
              <div class="dv-step-text">${_esc(it.text||'')}</div>
              ${boxHtml}
            </div>
          </li>`;
        }).join('')}
      </ol>`;
    }
    if (b.type==='box') {
      const bt=BOX_TYPES.find(x=>x.id===(b.boxType||'tip'))||BOX_TYPES[0];
      return `<div class="dv-box ${bt.cls}"><b>${bt.icon} ${bt.label}:</b> ${_esc(b.text||'')}</div>`;
    }
    if (b.type==='text') {
      return `<div class="dv-text">${_esc(b.text||'').replace(/\n/g,'<br>')}</div>`;
    }
    if (b.type==='layers') {
      return `<div class="dv-layers">
        ${b.title?`<h3>${_esc(b.title)}</h3>`:''}
        ${(b.items||[]).filter(i=>i.name).map((it,i,arr)=>`
          <div class="dv-layer">
            <div class="dv-layer-arrow">${i===0||i===arr.length-1?'—':'↓'}</div>
            <div class="dv-layer-name">${_esc(it.name)}</div>
            ${it.note?`<div class="dv-layer-note">${_esc(it.note)}</div>`:''}
          </div>`).join('')}
      </div>`;
    }
    if (b.type==='mini') {
      return `<div class="dv-mini">
        <h3>${_esc(b.title||'Mini Tarif')}</h3>
        ${b.sub?`<div class="dv-mini-sub">${_esc(b.sub)}</div>`:''}
        <ul class="dv-ing-list">
          ${(b.items||[]).filter(i=>i.name).map(it=>`
            <li><span class="dv-ing-name">${_esc(it.name)}</span>${it.amount?`<span class="dv-ing-amount">${_esc(it.amount)}</span>`:''}</li>`).join('')}
        </ul>
      </div>`;
    }
    return '';
  }

  function _renderAlternatives() {
    const r=_recipe;
    return `<div class="dv-alt-box">
      <h3>🔄 Aynı Tariften Ne Çıkar?</h3>
      <ul class="dv-alt-list">
        ${r.alternatives.map(a=>`<li>${a.emoji||'•'} <span>${_esc(a.text)}</span></li>`).join('')}
      </ul>
    </div>`;
  }

  // Scroll'da banner küçülmesi
  function _setupScrollCollapse() {
    const scroll=document.getElementById('dv-scroll');
    const banner=document.getElementById('dv-banner');
    if(!scroll||!banner)return;
    scroll.onscroll=()=>{
      if(scroll.scrollTop>40) banner.classList.add('collapsed');
      else banner.classList.remove('collapsed');
    };
  }

  function _edit(){ DetailForm.openEdit(_recipe.id); }

  function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  return { open, _tab, _edit };
})();
