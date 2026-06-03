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
  function addToShopping(recipeId) {
    const r = getRecipeById(recipeId);
    if (!r || !r.ingredients?.length) { showToast('Malzeme yok'); return; }
    const list = Storage.getShopping();
    let added = 0;
    r.ingredients.forEach(ing => {
      const name = String(ing).trim();
      if (!list.find(x => x.name.toLowerCase() === name.toLowerCase())) {
        list.push({ id: Date.now()+Math.random(), name, from: r.name, done: false });
        added++;
      }
    });
    Storage.saveShopping(list);
    showToast(`🛒 ${added} malzeme eklendi`);
  }

  function openShopping() {
    document.getElementById('shop-overlay').classList.add('open');
    _renderShopping();
  }
  function closeShopping() {
    document.getElementById('shop-overlay').classList.remove('open');
  }
  function _renderShopping() {
    const list = Storage.getShopping();
    const body = document.getElementById('shop-list');
    if (!list.length) {
      body.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-text">Liste boş</div><div class="empty-hint">Tariflerden malzeme ekleyebilirsin</div></div>';
    } else {
      body.innerHTML = list.map(item => `
        <div class="shop-item ${item.done?'done':''}">
          <div class="shop-check ${item.done?'checked':''}" onclick="App.toggleShopItem('${item.id}')">${item.done?'✓':''}</div>
          <div class="shop-item-name">${item.name}${item.from?`<div class="shop-item-from">${item.from}</div>`:''}</div>
          <button class="tag-del" onclick="App.removeShopItem('${item.id}')">×</button>
        </div>`).join('');
    }
  }
  function toggleShopItem(id) {
    const list = Storage.getShopping();
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.done = !item.done; Storage.saveShopping(list); _renderShopping(); }
  }
  function removeShopItem(id) {
    let list = Storage.getShopping().filter(x => String(x.id) !== String(id));
    Storage.saveShopping(list);
    _renderShopping();
  }
  function addShopManual() {
    const inp = document.getElementById('shop-add-input');
    const val = inp?.value.trim();
    if (!val) return;
    const list = Storage.getShopping();
    list.push({ id: Date.now()+Math.random(), name: val, from:'', done:false });
    Storage.saveShopping(list);
    if (inp) inp.value = '';
    _renderShopping();
  }
  function clearShoppingDone() {
    const list = Storage.getShopping().filter(x => !x.done);
    Storage.saveShopping(list);
    _renderShopping();
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
    toggleShopItem, removeShopItem, addShopManual, clearShoppingDone,
    showToast,
  };
})();
