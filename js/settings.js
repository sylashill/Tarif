// ============================================================
// settings.js — Ayarlar paneli (font, renk, etiketler)
// ============================================================

const Settings = (() => {

  let _s = {};   // aktif ayarlar
  let _ingTags  = {};
  let _toolTags = {};

  function load() {
    _s = Storage.getSettings();
    _ingTags  = Storage.getIngTags()  || JSON.parse(JSON.stringify(DEFAULT_INGREDIENT_TAGS));
    _toolTags = Storage.getToolTags() || JSON.parse(JSON.stringify(DEFAULT_TOOL_TAGS));
  }

  function save() {
    Storage.saveSettings(_s);
    Storage.saveIngTags(_ingTags);
    Storage.saveToolTags(_toolTags);
  }

  function get(key)       { return _s[key]; }
  function set(key, val)  { _s[key] = val; save(); applyTheme(); }

  function getIngTags()   { return _ingTags; }
  function getToolTags()  { return _toolTags; }

  /** Tüm araç listesi (flat, alternatifleriyle birlikte) */
  function getAllTools() {
    const result = [];
    Object.values(_toolTags).forEach(arr => arr.forEach(t => result.push(t)));
    return result;
  }

  function getToolByName(name) {
    return getAllTools().find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /** Tüm malzemeleri flat array olarak döner */
  function getAllIngredients() {
    return Object.values(_ingTags).flat();
  }

  // ---------- Tema uygula ----------
  function applyTheme() {
    const bodyFont   = FONTS.find(f => f.id === (_s.font       || 'dm'))       || FONTS[0];
    const headerFont = FONTS.find(f => f.id === (_s.headerFont || 'playfair')) || FONTS[1];
    const accent     = _s.accentColor || '#e8521a';

    document.documentElement.style.setProperty('--font',        bodyFont.css);
    document.documentElement.style.setProperty('--header-font', headerFont.css);
    document.documentElement.style.setProperty('--accent',      accent);

    // Bütün buton/input font'larını güncelle (CSS variable üzerinden zaten handle edilecek)
  }

  // ---------- Panel render ----------
  let _activeTab = 'genel';

  function openPanel() {
    document.getElementById('settings-overlay').classList.add('open');
    renderPanel();
  }
  function closePanel() {
    document.getElementById('settings-overlay').classList.remove('open');
  }

  function renderPanel() {
    const tabs = ['genel','etiketler','araclar'];
    const tabLabels = { genel:'⚙️ Genel', etiketler:'🧂 Malzeme Etiketleri', araclar:'🔧 Araç Etiketleri' };
    document.getElementById('settings-content').innerHTML = `
      <div class="settings-tabs">
        ${tabs.map(t=>`<button class="stab${_activeTab===t?' active':''}" onclick="Settings._setTab('${t}')">${tabLabels[t]}</button>`).join('')}
      </div>
      <div id="settings-tab-body"></div>
    `;
    renderTabBody();
  }

  function _setTab(tab) { _activeTab = tab; renderPanel(); }

  function renderTabBody() {
    const el = document.getElementById('settings-tab-body');
    if (_activeTab === 'genel')     el.innerHTML = _renderGeneral();
    if (_activeTab === 'etiketler') el.innerHTML = _renderIngTags();
    if (_activeTab === 'araclar')   el.innerHTML = _renderToolTags();
  }

  function _renderGeneral() {
    return `
      <div class="settings-section">
        <div class="settings-section-label">Metin Fontu</div>
        <div class="font-grid">
          ${FONTS.map(f=>`
            <div class="font-pick${_s.font===f.id?' selected':''}" onclick="Settings._setFont('${f.id}')">
              <div class="font-pick-name">${f.name}</div>
              <div class="font-pick-sample" style="font-family:${f.css}">${f.sample}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-label">Başlık Fontu</div>
        <div class="font-grid">
          ${FONTS.map(f=>`
            <div class="font-pick${_s.headerFont===f.id?' selected':''}" onclick="Settings._setHeaderFont('${f.id}')">
              <div class="font-pick-name">${f.name}</div>
              <div class="font-pick-sample" style="font-family:${f.css}">${f.sample}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-label">Vurgu Rengi</div>
        <div class="color-row">
          ${COLORS.map(c=>`<button class="color-dot${_s.accentColor===c?' selected':''}" style="background:${c}" onclick="Settings._setAccent('${c}')"></button>`).join('')}
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-label">Veri Yönetimi</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button class="settings-action-btn" onclick="App.exportAll()">📤 Tüm Verileri Dışa Aktar (JSON)</button>
          <button class="settings-action-btn" onclick="App.exportAllWithImages()">🖼️ Görsellerle Birlikte Dışa Aktar</button>
          <button class="settings-action-btn" onclick="document.getElementById('import-file').click()">📥 Verileri İçe Aktar</button>
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="App.importAll(this)">
        </div>
      </div>
    `;
  }

  function _renderIngTags() {
    const cats = Object.keys(_ingTags);
    return `
      <div class="settings-section">
        ${cats.map(cat => `
          <div class="tag-cat-block">
            <div class="tag-cat-label">${cat}
              <button class="tag-add-cat-btn" onclick="Settings._addIngCat()">+ Kategori</button>
            </div>
            <div class="tag-cloud" id="ing-tags-${_slugify(cat)}">
              ${(_ingTags[cat]||[]).map((tag,i)=>`
                <span class="tag-chip">
                  ${tag}
                  <button class="tag-del" onclick="Settings._delIngTag('${cat}',${i})">×</button>
                </span>`).join('')}
              <button class="tag-chip tag-chip-add" onclick="Settings._addIngTag('${cat}')">+</button>
            </div>
          </div>`).join('')}
        <button class="settings-action-btn" style="margin-top:8px" onclick="Settings._addIngCat()">+ Yeni Kategori Ekle</button>
      </div>
    `;
  }

  function _renderToolTags() {
    const cats = Object.keys(_toolTags);
    return `
      <div class="settings-section">
        ${cats.map(cat => `
          <div class="tag-cat-block">
            <div class="tag-cat-label">${cat}</div>
            <div class="tag-cloud">
              ${(_toolTags[cat]||[]).map((tool,i)=>`
                <span class="tag-chip tool-chip" onclick="Settings._editTool('${cat}',${i})">
                  🔧 ${tool.name}
                </span>`).join('')}
              <button class="tag-chip tag-chip-add" onclick="Settings._addTool('${cat}')">+</button>
            </div>
          </div>`).join('')}
        <button class="settings-action-btn" style="margin-top:8px" onclick="Settings._addToolCat()">+ Yeni Kategori Ekle</button>
      </div>
    `;
  }

  // --- Genel ayar değiştirme ---
  function _setFont(id)       { _s.font = id;        save(); applyTheme(); renderPanel(); }
  function _setHeaderFont(id) { _s.headerFont = id;  save(); applyTheme(); renderPanel(); }
  function _setAccent(c)      { _s.accentColor = c;  save(); applyTheme(); renderPanel(); }

  // --- Malzeme etiket işlemleri ---
  function _addIngTag(cat) {
    const val = prompt(`"${cat}" kategorisine yeni malzeme:`);
    if (!val || !val.trim()) return;
    const t = val.trim().toLowerCase();
    if (!_ingTags[cat]) _ingTags[cat] = [];
    if (!_ingTags[cat].includes(t)) _ingTags[cat].push(t);
    save(); renderTabBody();
  }
  function _delIngTag(cat, idx) {
    _ingTags[cat].splice(idx, 1);
    save(); renderTabBody();
  }
  function _addIngCat() {
    const cat = prompt('Yeni malzeme kategorisi adı:');
    if (!cat || !cat.trim()) return;
    if (!_ingTags[cat.trim()]) _ingTags[cat.trim()] = [];
    save(); renderTabBody();
  }

  // --- Araç etiket işlemleri ---
  function _addTool(cat) {
    const name = prompt(`"${cat}" kategorisine yeni araç adı:`);
    if (!name || !name.trim()) return;
    if (!_toolTags[cat]) _toolTags[cat] = [];
    _toolTags[cat].push({ name: name.trim().toLowerCase(), alt: [] });
    save(); renderTabBody();
  }
  function _addToolCat() {
    const cat = prompt('Yeni araç kategorisi adı:');
    if (!cat || !cat.trim()) return;
    if (!_toolTags[cat.trim()]) _toolTags[cat.trim()] = [];
    save(); renderTabBody();
  }
  function _editTool(cat, idx) {
    const tool = _toolTags[cat][idx];
    const newName = prompt(`Araç adı:`, tool.name);
    if (newName !== null && newName.trim()) tool.name = newName.trim().toLowerCase();
    save(); renderTabBody();
  }

  function _slugify(str) { return str.replace(/[^a-zA-Z0-9]/g,'_'); }

  return {
    load, save, get, set, applyTheme,
    getIngTags, getToolTags, getAllTools, getToolByName, getAllIngredients,
    openPanel, closePanel,
    _setTab, _setFont, _setHeaderFont, _setAccent,
    _addIngTag, _delIngTag, _addIngCat,
    _addTool, _addToolCat, _editTool,
  };
})();
