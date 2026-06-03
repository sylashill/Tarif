// ============================================================
// app.js — Ana kontrolcü
// ============================================================

const App = (() => {

  let _currentPage  = 'recipes'; // 'recipes' | 'heat'
  let _currentView  = 'list';    // 'list' | 'detail' | 'form' | 'heat-form' | 'heat-detail'
  let _activeCategory = 'Tümü';
  let _searchMode   = 'name';
  let _searchQuery  = '';
  let _sortMode     = 'date';
  let _deleteTarget = null;
  let _heatDeleteTarget = null;

  // ---------- Boot ----------
  async function init() {
    await Storage.openDB();
    Settings.load();
    Settings.applyTheme();
    _buildCategoryTabs();
    _buildSortChips();
    Render.heatList(Storage.getHeatItems());
    showPage('recipes');
    _setupBottomNav();
    _renderQuickActions();
  }

  // ---------- Sayfalar ----------
  function showPage(page) {
    _currentPage = page;
    document.getElementById('page-recipes').style.display = page === 'recipes' ? 'flex' : 'none';
    document.getElementById('page-heat').style.display    = page === 'heat'    ? 'flex' : 'none';
    document.getElementById('view-form').style.display    = 'none';
    document.getElementById('view-heat-form').style.display = 'none';
    document.getElementById('view-detail').style.display  = 'none';
    document.getElementById('view-heat-detail').style.display = 'none';
    var dfv=document.getElementById('view-detail-form'); if(dfv)dfv.style.display='none';
    var dvv=document.getElementById('view-detail-view'); if(dvv)dvv.style.display='none';

    // Bottom nav aktif
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('nav-' + page)?.classList.add('active');

    if (page === 'recipes') { _buildCategoryTabs(); _renderList(); }
    if (page === 'heat')    { _renderHeatList(); }
  }

  function showView(view) {
    _currentView = view;
    const allViews = ['page-recipes','page-heat','view-form','view-heat-form','view-detail','view-heat-detail','view-detail-form','view-detail-view'];
    allViews.forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });
    const target = document.getElementById('view-' + view) || document.getElementById(view);
    if (target) target.style.display = 'flex';
  }

  function _setupBottomNav() {
    document.getElementById('bottom-nav').innerHTML = `
      <button class="nav-btn active" id="nav-recipes" onclick="App.showPage('recipes')">
        <span class="nav-icon">🍽️</span><span class="nav-label">Tarifler</span>
      </button>
      <button class="nav-btn" id="nav-heat" onclick="App.showPage('heat')">
        <span class="nav-icon">🌡️</span><span class="nav-label">Isıt-Ye</span>
      </button>
    `;
  }

  // ---------- Tarifler ----------
  function _renderList() {
    const filtered = _getFiltered();
    document.getElementById('recipe-count').textContent = Storage.getRecipes().length + ' tarif';
    Render.recipeList(filtered);
  }

  function _getFiltered() {
    let list = [...Storage.getRecipes()];
    if (_activeCategory !== 'Tümü')
      list = list.filter(r => (r.categories || [r.category]).includes(_activeCategory));
    if (_searchMode === 'ingredient' && _searchQuery.trim()) {
      const q = _searchQuery.toLowerCase();
      list = list.filter(r => r.ingredients?.some(i => String(i).toLowerCase().includes(q)));
    } else if (_searchMode === 'name' && _searchQuery.trim()) {
      const q = _searchQuery.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q));
    }
    if (_sortMode === 'alpha') list.sort((a,b) => a.name.localeCompare(b.name,'tr'));
    else if (_sortMode === 'cat') list.sort((a,b) => {
      const ca=(a.categories||[a.category||''])[0]||'';
      const cb=(b.categories||[b.category||''])[0]||'';
      return ca.localeCompare(cb,'tr')||a.name.localeCompare(b.name,'tr');
    });
    else list.sort((a,b) => (b.addedAt||0)-(a.addedAt||0));
    return list;
  }

  function _buildCategoryTabs() {
    const cats = ['Tümü', ...DEFAULT_RECIPE_CATS, ...Storage.getCustomCats()];
    document.getElementById('cat-scroll').innerHTML = cats.map(c =>
      `<button class="cat-btn${c===_activeCategory?' active':''}" onclick="App._setCategory('${c}')">${c}</button>`
    ).join('');
  }

  function _buildSortChips() {
    const sorts = [['date','🕐 En Yeni'],['alpha','🔤 Alfabetik'],['cat','📂 Kategori']];
    document.getElementById('sort-bar').innerHTML = sorts.map(([id,label]) =>
      `<button class="sort-chip${_sortMode===id?' active':''}" onclick="App._setSort('${id}')">${label}</button>`
    ).join('');
  }

  function _setCategory(cat) {
    _activeCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cat-btn').forEach(b => { if(b.textContent.trim()===cat) b.classList.add('active'); });
    _renderList();
  }

  function _setSort(mode) {
    _sortMode = mode;
    _buildSortChips();
    _renderList();
  }

  function setSearchMode(mode) {
    _searchMode = mode; _searchQuery = '';
    document.getElementById('search-input').value = '';
    document.getElementById('search-input').placeholder = mode === 'name' ? 'Tarif ara...' : 'Malzeme ara...';
    document.getElementById('search-icon').textContent = mode === 'name' ? '🔍' : '🧂';
    document.getElementById('btn-search-name').classList.toggle('active', mode==='name');
    document.getElementById('btn-search-ing').classList.toggle('active', mode==='ingredient');
    document.getElementById('suggestions').innerHTML='';
    _renderList();
  }

  function onSearch(val) {
    _searchQuery = val;
    if (_searchMode === 'ingredient' && val.trim()) {
      const q = val.toLowerCase();
      const all = [...new Set(Storage.getRecipes().flatMap(r => r.ingredients?.map(i=>String(i))||[]))];
      const matches = all.filter(i => i.toLowerCase().includes(q)).slice(0,6);
      document.getElementById('suggestions').innerHTML = matches.map(m =>
        `<button class="suggestion-chip" onclick="App._selectSuggestion('${m}')">${m}</button>`
      ).join('');
    } else {
      document.getElementById('suggestions').innerHTML='';
    }
    _renderList();
  }

  function _selectSuggestion(val) {
    document.getElementById('search-input').value = val;
    _searchQuery = val;
    document.getElementById('suggestions').innerHTML='';
    _renderList();
  }

  // ---------- Entry Tipi Seçici ----------
  function chooseEntryType() {
    document.getElementById('entry-type-overlay').classList.add('open');
  }
  function closeEntryType() {
    document.getElementById('entry-type-overlay').classList.remove('open');
  }
  function newDefaultEntry() { closeEntryType(); Form.openAdd(); }
  function newDetailedEntry() { closeEntryType(); DetailForm.openAdd(); }

  // ---------- Hızlı Aksiyonlar ----------
  function _renderQuickActions() {
    const el = document.getElementById('quick-actions');
    if (!el) return;
    el.innerHTML = `
      <button class="quick-btn" onclick="App.randomRecipe()">🎲 Rastgele Tarif</button>
      <button class="quick-btn" onclick="App.openShopping()">🛒 Alışveriş Listesi</button>`;
  }

  function randomRecipe() {
    const recipes = Storage.getRecipes().filter(r => !r.isDraft);
    if (!recipes.length) { showToast('Henüz tarif yok'); return; }
    const r = recipes[Math.floor(Math.random()*recipes.length)];
    openDetail(r.id);
  }

  // ---------- Alışveriş Listesi ----------
  // Bir tarifin tüm malzemelerini düz liste olarak çıkar (default + detaylı)
  function _extractIngredients(r) {
    const out = [];
    if (r.type === 'detailed') {
      (r.tabs || []).forEach(tab => (tab.blocks || []).forEach(b => {
        if (b.type === 'ingredients' || b.type === 'mini') {
          (b.items || []).forEach(it => {
            if (it.name && it.name.trim()) out.push({ amount: (it.amount||'').trim(), name: it.name.trim() });
          });
        }
      }));
    } else {
      (r.ingredients || []).forEach(ing => {
        const s = String(ing).trim();
        if (!s) return;
        // "500 g un" → amount + name ayır (kabaca)
        const m = s.match(/^([\d.,]+\s*[^\s]*)\s+(.+)$/);
        if (m && /\d/.test(m[1])) out.push({ amount: m[1].trim(), name: m[2].trim() });
        else out.push({ amount:'', name:s });
      });
    }
    return out;
  }

  // Malzeme adından market kategorisi tahmin et
  function _guessAisle(name) {
    const n = name.toLowerCase();
    const tags = Settings.getIngTags ? Settings.getIngTags() : {};
    for (const [cat, arr] of Object.entries(tags)) {
      if (arr.some(t => n.includes(t.toLowerCase()) || t.toLowerCase().includes(n))) return cat;
    }
    return 'Diğer';
  }

  function addToShopping(recipeId) {
    const r = getRecipeById(recipeId);
    if (!r) return;
    const ings = _extractIngredients(r);
    if (!ings.length) { showToast('Malzeme bulunamadı'); return; }
    const list = Storage.getShopping();
    let added = 0;
    ings.forEach(ing => {
      const existing = list.find(x => x.name.toLowerCase() === ing.name.toLowerCase());
      if (existing) {
        // Aynı malzeme tekrar → miktarı not olarak birleştir
        if (ing.amount && existing.amount && !existing.amount.includes(ing.amount)) {
          existing.amount = existing.amount + ' + ' + ing.amount;
        } else if (ing.amount && !existing.amount) {
          existing.amount = ing.amount;
        }
      } else {
        list.push({
          id: Date.now()+Math.random(),
          name: ing.name, amount: ing.amount || '',
          from: r.name, aisle: _guessAisle(ing.name), done: false
        });
        added++;
      }
    });
    Storage.saveShopping(list);
    showToast(added ? `🛒 ${added} malzeme eklendi` : '🛒 Liste güncellendi');
  }

  function openShopping() {
    document.getElementById('shop-overlay').classList.add('open');
    _renderShopping();
  }
  function closeShopping() {
    document.getElementById('shop-overlay').classList.remove('open');
  }

  let _shopGroupBy = 'aisle'; // 'aisle' | 'recipe' | 'none'
  function setShopGroup(mode) { _shopGroupBy = mode; _renderShopping(); }

  function _renderShopping() {
    const list = Storage.getShopping();
    const body = document.getElementById('shop-list');
    const countEl = document.getElementById('shop-count');

    const total = list.length, done = list.filter(x=>x.done).length;
    if (countEl) countEl.textContent = total ? `${done}/${total} tamamlandı` : '';

    // Grup başlığı seçici
    const grpBar = document.getElementById('shop-group-bar');
    if (grpBar) {
      grpBar.innerHTML = [['aisle','📦 Reyona Göre'],['recipe','🍽️ Tarife Göre'],['none','📋 Düz Liste']]
        .map(([id,l])=>`<button class="shop-grp-chip${_shopGroupBy===id?' active':''}" onclick="App.setShopGroup('${id}')">${l}</button>`).join('');
    }

    if (!list.length) {
      body.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-text">Liste boş</div><div class="empty-hint">Tariflerden 🛒 ile malzeme ekle</div></div>';
      return;
    }

    // Gruplama
    let groups = {};
    if (_shopGroupBy === 'none') {
      groups = { '': list };
    } else {
      const key = _shopGroupBy === 'recipe' ? 'from' : 'aisle';
      list.forEach(item => {
        const g = item[key] || (key==='from'?'Elle eklenen':'Diğer');
        (groups[g] = groups[g] || []).push(item);
      });
    }

    body.innerHTML = Object.entries(groups).map(([grp, items]) => `
      ${grp ? `<div class="shop-group-label">${grp}</div>` : ''}
      ${items.map(item => `
        <div class="shop-item ${item.done?'done':''}">
          <div class="shop-check ${item.done?'checked':''}" onclick="App.toggleShopItem('${item.id}')">${item.done?'✓':''}</div>
          <div class="shop-item-main">
            <span class="shop-item-name">${item.name}</span>
            ${item.amount?`<span class="shop-item-amount">${item.amount}</span>`:''}
            ${(_shopGroupBy!=='recipe'&&item.from)?`<div class="shop-item-from">${item.from}</div>`:''}
          </div>
          <button class="tag-del" onclick="App.removeShopItem('${item.id}')">×</button>
        </div>`).join('')}
    `).join('');
  }

  function toggleShopItem(id) {
    const list = Storage.getShopping();
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.done = !item.done; Storage.saveShopping(list); _renderShopping(); }
  }
  function removeShopItem(id) {
    Storage.saveShopping(Storage.getShopping().filter(x => String(x.id) !== String(id)));
    _renderShopping();
  }
  function addShopManual() {
    const inp = document.getElementById('shop-add-input');
    const val = inp?.value.trim();
    if (!val) return;
    // "2 kg elma" gibi girilirse miktarı ayır
    const m = val.match(/^([\d.,]+\s*[^\s]*)\s+(.+)$/);
    const item = (m && /\d/.test(m[1]))
      ? { amount:m[1].trim(), name:m[2].trim() }
      : { amount:'', name:val };
    const list = Storage.getShopping();
    list.push({ id: Date.now()+Math.random(), name:item.name, amount:item.amount, from:'', aisle:_guessAisle(item.name), done:false });
    Storage.saveShopping(list);
    if (inp) inp.value = '';
    _renderShopping();
  }
  function clearShoppingDone() {
    Storage.saveShopping(Storage.getShopping().filter(x => !x.done));
    _renderShopping();
    showToast('Tamamlananlar temizlendi');
  }
  function clearShoppingAll() {
    if (!Storage.getShopping().length) return;
    if (!confirm('Tüm alışveriş listesi silinsin mi?')) return;
    Storage.saveShopping([]);
    _renderShopping();
  }

  // Listeyi metin olarak paylaş/kopyala
  async function shareShopping() {
    const list = Storage.getShopping();
    if (!list.length) { showToast('Liste boş'); return; }
    let text = '🛒 Alışveriş Listesi\n\n';
    // reyona göre grupla
    const groups = {};
    list.forEach(i => { const g=i.aisle||'Diğer'; (groups[g]=groups[g]||[]).push(i); });
    Object.entries(groups).forEach(([g, items]) => {
      text += `${g}:\n`;
      items.forEach(i => { text += `${i.done?'✓':'•'} ${i.amount?i.amount+' ':''}${i.name}\n`; });
      text += '\n';
    });
    try {
      if (navigator.share) { await navigator.share({ title:'Alışveriş Listesi', text }); }
      else { await navigator.clipboard.writeText(text); showToast('📋 Panoya kopyalandı'); }
    } catch(e) {
      try { await navigator.clipboard.writeText(text); showToast('📋 Panoya kopyalandı'); } catch(_) {}
    }
  }


  // ---------- Detay ----------
  function openDetail(id) {
    const _r = getRecipeById(id);
    if (_r && _r.type === 'detailed') { DetailView.open(_r); return; }
    const r = getRecipeById(id);
    if (!r) return;
    showView('detail');
    Render.detail(r);
  }

  function getRecipeById(id) {
    return Storage.getRecipes().find(r => r.id === id) || null;
  }

  // ---------- Kopyala ----------
  async function copyRecipe(id) {
    const r = getRecipeById(id);
    if (!r) return;
    const newId = Date.now();
    const copy  = { ...r, id: newId, name: r.name + ' (kopya)', addedAt: newId };
    if (r.hasImage) {
      const blob = await Storage.getImage(r.id);
      if (blob) await Storage.saveImage(newId, blob);
    }
    const recipes = Storage.getRecipes();
    recipes.unshift(copy);
    Storage.saveRecipes(recipes);
    showToast('📋 Tarif kopyalandı!');
    _renderList();
  }

  // ---------- Sil ----------
  function openDeleteModal(id) {
    _deleteTarget = id;
    document.getElementById('delete-modal').classList.add('open');
  }
  function closeDeleteModal() {
    _deleteTarget = null;
    document.getElementById('delete-modal').classList.remove('open');
  }
  async function confirmDelete() {
    if (!_deleteTarget) return;
    const r = getRecipeById(_deleteTarget);
    if (r?.hasImage) await Storage.deleteImage(r.id);
    const recipes = Storage.getRecipes().filter(r => r.id !== _deleteTarget);
    Storage.saveRecipes(recipes);
    closeDeleteModal();
    showPage('recipes');
  }

  // ---------- Isıt-Ye ----------
  function _renderHeatList() {
    Render.heatList(Storage.getHeatItems());
  }

  function openHeatDetail(id) {
    const items = Storage.getHeatItems();
    const item  = items.find(x => x.id === id);
    if (!item) return;
    showView('heat-detail');
    Render.heatDetail(item);
  }

  function openHeatDeleteModal(id) {
    _heatDeleteTarget = id;
    document.getElementById('heat-delete-modal').classList.add('open');
  }
  function closeHeatDeleteModal() {
    _heatDeleteTarget = null;
    document.getElementById('heat-delete-modal').classList.remove('open');
  }
  async function confirmHeatDelete() {
    if (!_heatDeleteTarget) return;
    await Storage.deleteImage('heat_' + _heatDeleteTarget);
    const items = Storage.getHeatItems().filter(x => x.id !== _heatDeleteTarget);
    Storage.saveHeatItems(items);
    closeHeatDeleteModal();
    showPage('heat');
  }

  // ---------- Export / Import ----------
  async function exportAll() {
    const json = await Storage.exportAll(false);
    Storage.downloadJSON(json, `tarif-defteri-${_dateStr()}.json`);
    showToast('📤 Dışa aktarıldı!');
  }
  async function exportAllWithImages() {
    showToast('⏳ Görseller hazırlanıyor...');
    const json = await Storage.exportAll(true);
    Storage.downloadJSON(json, `tarif-defteri-gorselli-${_dateStr()}.json`);
    showToast('📤 Görsellerle dışa aktarıldı!');
  }
  async function exportRecipe(id) {
    const r = getRecipeById(id);
    if (!r) return;
    const json = await Storage.exportRecipe(r);
    Storage.downloadJSON(json, `${r.name.replace(/\s+/g,'-')}-${_dateStr()}.json`);
    showToast('📤 Tarif dışa aktarıldı!');
  }
  async function importAll(input) {
    const file = input.files[0]; if (!file) return;
    const text = await file.text();
    try {
      if (text.includes('"single":true')) {
        await Storage.importRecipe(text);
        showToast('✅ Tarif içe aktarıldı!');
      } else {
        await Storage.importAll(text);
        Settings.load(); Settings.applyTheme();
        showToast('✅ Tüm veriler içe aktarıldı!');
      }
      showPage('recipes');
    } catch(e) {
      alert('Hata: ' + e.message);
    }
  }

  function _dateStr() {
    return new Date().toISOString().slice(0,10);
  }

  // ---------- Yazdır / PDF ----------
  async function printRecipe(id) {
    const r = getRecipeById(id);
    if (!r) return;

    // Görsel varsa base64 al
    let imgTag = '';
    if (r.hasImage) {
      const blob = await Storage.getImage(r.id);
      if (blob) {
        const b64 = await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob);});
        imgTag = `<img src="${b64}" style="width:100%;max-height:280px;object-fit:cover;border-radius:10px;margin-bottom:16px">`;
      }
    }

    const ings = _extractIngredients(r);
    const ingHtml = ings.map(i=>`<li>${i.amount?`<b>${i.amount}</b> `:''}${i.name}</li>`).join('');

    // Adımlar
    let stepsHtml = '';
    if (r.type === 'detailed') {
      (r.tabs||[]).forEach(tab=>{
        (tab.blocks||[]).forEach(b=>{
          if (b.type==='steps') {
            stepsHtml += (b.items||[]).map((it,i)=>`<li>${it.title?`<b>${_e(it.title)}</b><br>`:''}${_e(it.text||'')}${it.box&&it.box.text?`<div style="background:#f4f0e8;border-left:3px solid #c9a84c;padding:6px 10px;margin-top:6px;font-size:13px">${_e(it.box.text)}</div>`:''}</li>`).join('');
          }
        });
      });
    } else if (r.stepsMode==='list' && r.stepsArray?.length) {
      stepsHtml = r.stepsArray.map(s=>`<li>${_e(s)}</li>`).join('');
    } else if (r.stepsText) {
      stepsHtml = r.stepsText.split(/\n\n+/).map(s=>`<li>${_e(s.trim())}</li>`).join('');
    }

    const meta = [
      r.duration?`⏱ ${r.duration}`:'',
      `👥 ${r.servings} kişilik`,
      r.difficulty?`📊 ${r.difficulty}`:'',
      r.calories?`🔥 ${r.calories} kcal`:''
    ].filter(Boolean).join(' &nbsp;•&nbsp; ');

    const win = window.open('', '_blank');
    if (!win) { showToast('Açılır pencere engellendi'); return; }
    win.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
      <title>${_e(r.name)}</title>
      <style>
        @media print { @page { margin:1.5cm; } }
        body{font-family:Georgia,'Times New Roman',serif;color:#222;max-width:720px;margin:0 auto;padding:24px;line-height:1.6}
        h1{font-size:28px;margin:0 0 4px;border-bottom:3px solid #c9a84c;padding-bottom:8px}
        .sub{color:#888;font-style:italic;margin-bottom:8px}
        .meta{color:#555;font-size:14px;margin-bottom:18px}
        h2{font-size:18px;color:#c9a84c;border-bottom:1px solid #eee;padding-bottom:4px;margin-top:24px}
        ul,ol{padding-left:22px} li{margin-bottom:8px}
        .note{background:#fffbf0;border-left:4px solid #c9a84c;padding:10px 14px;margin-top:16px;font-style:italic}
        .foot{margin-top:30px;text-align:center;color:#bbb;font-size:12px}
        .btn{position:fixed;top:16px;right:16px;background:#c9a84c;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer}
        @media print { .btn{display:none} }
      </style></head><body>
      <button class="btn" onclick="window.print()">🖨️ Yazdır / PDF</button>
      ${imgTag}
      <h1>${_e(r.name)}</h1>
      ${r.subtitle?`<div class="sub">${_e(r.subtitle)}</div>`:''}
      <div class="meta">${meta}</div>
      ${ingHtml?`<h2>🛒 Malzemeler</h2><ul>${ingHtml}</ul>`:''}
      ${stepsHtml?`<h2>👨‍🍳 Hazırlanış</h2><ol>${stepsHtml}</ol>`:''}
      ${r.notes?`<div class="note"><b>📝 Not:</b> ${_e(r.notes)}</div>`:''}
      <div class="foot">Tarif Defterim ile oluşturuldu</div>
      <script>setTimeout(()=>window.print(),400)<\/script>
      </body></html>`);
    win.document.close();
  }
  function _e(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ---------- Toast ----------
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  return {
    get _cp(){ return _currentPage; },
    init, showPage, showView,
    setSearchMode, onSearch, _selectSuggestion,
    _setCategory, _setSort,
    openDetail, getRecipeById,
    copyRecipe,
    openDeleteModal, closeDeleteModal, confirmDelete,
    openHeatDetail,
    openHeatDeleteModal, closeHeatDeleteModal, confirmHeatDelete,
    exportAll, exportAllWithImages, exportRecipe, importAll,
    chooseEntryType, closeEntryType, newDefaultEntry, newDetailedEntry,
    randomRecipe, addToShopping, openShopping, closeShopping,
    toggleShopItem, removeShopItem, addShopManual, clearShoppingDone, clearShoppingAll,
    setShopGroup, shareShopping, printRecipe,
    showToast,
  };
})();
