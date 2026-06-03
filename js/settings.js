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

  // ---------- Temalar ----------
  const THEMES = [
    { id:'default',  label:'Turuncu Gün', colors:['#e8521a','#faf8f5','#1a1a2e'] },
    { id:'dark',     label:'Koyu Gece',   colors:['#8b7cf8','#121220','#0d0d1a'] },
    { id:'midnight', label:'Gece Mavisi', colors:['#4fc3f7','#0f1e35','#0a1628'] },
    { id:'warm',     label:'Sıcak Toprak',colors:['#c0622a','#fdf6ee','#3d2410'] },
    { id:'mint',     label:'Nane Yeşil',  colors:['#00897b','#f0faf8','#0d2b28'] },
    { id:'rose',     label:'Gül',         colors:['#ec407a','#1a0f14','#261720'] },
    { id:'emerald',  label:'Zümrüt',      colors:['#26d0a0','#08140f','#0f2018'] },
    { id:'amber',    label:'Kehribar',    colors:['#ffb300','#1a1206','#26190a'] },
    { id:'rosegold', label:'Pudra',       colors:['#c08552','#fdf3ee','#3a2418'] },
    { id:'slate',    label:'Arduvaz',     colors:['#56c8d8','#0f1419','#1a2128'] },
  ];

  // ---------- App tema renk setleri (data-theme yoksa JS ile uygula) ----------
  const THEME_VARS = {
    rose: { '--accent':'#ec407a','--dark':'#1a0f14','--cream':'#1a0f14','--card':'#261720','--card2':'#321d29','--border':'#3a2230','--muted':'#9a6a80','--text':'#fce4ec','--text2':'#caa0b0','--input-bg':'#261720','--top-bg':'#120a0e','--top-text':'#fce4ec','--top-sub':'#7a4a5e','--nav-bg':'#120a0e','--nav-border':'#3a2230','--nav-inactive':'#5a3045','--toggle-bg':'#2a1620','--toggle-active':'#ec407a','--settings-bg':'#261720','--modal-bg':'#261720','--step-bg':'#1a0f14','--note-bg':'#1e0f16','--heat-card-bg':'#1a0f14','--shadow':'0 2px 12px rgba(0,0,0,.5)','--shadow-lg':'0 4px 24px rgba(40,0,20,.7)' },
    emerald: { '--accent':'#26d0a0','--dark':'#08140f','--cream':'#08140f','--card':'#0f2018','--card2':'#152d22','--border':'#1d3a2d','--muted':'#4a8a74','--text':'#d4f5e9','--text2':'#8accb4','--input-bg':'#0f2018','--top-bg':'#050d0a','--top-text':'#d4f5e9','--top-sub':'#3a6a55','--nav-bg':'#050d0a','--nav-border':'#1d3a2d','--nav-inactive':'#2a5a45','--toggle-bg':'#0f2818','--toggle-active':'#26d0a0','--settings-bg':'#0f2018','--modal-bg':'#0f2018','--step-bg':'#08140f','--note-bg':'#0a1a12','--heat-card-bg':'#08140f','--shadow':'0 2px 12px rgba(0,0,0,.5)','--shadow-lg':'0 4px 24px rgba(0,30,20,.7)' },
    amber: { '--accent':'#ffb300','--dark':'#1a1206','--cream':'#1a1206','--card':'#26190a','--card2':'#332410','--border':'#3a2c14','--muted':'#9a7a40','--text':'#fff3d6','--text2':'#ccac70','--input-bg':'#26190a','--top-bg':'#120c04','--top-text':'#fff3d6','--top-sub':'#7a5e2a','--nav-bg':'#120c04','--nav-border':'#3a2c14','--nav-inactive':'#5a4520','--toggle-bg':'#2a1e08','--toggle-active':'#ffb300','--settings-bg':'#26190a','--modal-bg':'#26190a','--step-bg':'#1a1206','--note-bg':'#1e1608','--heat-card-bg':'#1a1206','--shadow':'0 2px 12px rgba(0,0,0,.5)','--shadow-lg':'0 4px 24px rgba(30,20,0,.7)' },
    rosegold: { '--accent':'#c08552','--dark':'#3a2418','--cream':'#fdf3ee','--card':'#ffffff','--card2':'#f8ede4','--border':'#ecd9c8','--muted':'#a88468','--text':'#3a2418','--text2':'#6b4a30','--input-bg':'#ffffff','--top-bg':'#4a3020','--top-text':'#fdf3ee','--top-sub':'#a8845e','--nav-bg':'#ffffff','--nav-border':'#ecd9c8','--nav-inactive':'#c8a888','--toggle-bg':'#f5e6da','--toggle-active':'#c08552','--settings-bg':'#ffffff','--modal-bg':'#ffffff','--step-bg':'#f8ede4','--note-bg':'#fdf6ef','--heat-card-bg':'#f8ede4','--shadow':'0 2px 8px rgba(120,80,40,.1)','--shadow-lg':'0 4px 20px rgba(120,80,40,.18)' },
    slate: { '--accent':'#56c8d8','--dark':'#0f1419','--cream':'#0f1419','--card':'#1a2128','--card2':'#222b34','--border':'#2a343e','--muted':'#5a7080','--text':'#e0e8ec','--text2':'#9ab0bc','--input-bg':'#1a2128','--top-bg':'#0a0e12','--top-text':'#e0e8ec','--top-sub':'#456070','--nav-bg':'#0a0e12','--nav-border':'#2a343e','--nav-inactive':'#3a5060','--toggle-bg':'#142028','--toggle-active':'#56c8d8','--settings-bg':'#1a2128','--modal-bg':'#1a2128','--step-bg':'#0f1419','--note-bg':'#0f1a1e','--heat-card-bg':'#0f1419','--shadow':'0 2px 12px rgba(0,0,0,.5)','--shadow-lg':'0 4px 24px rgba(0,10,20,.7)' },
  };

  // ---------- Tema uygula ----------
  // CSS [data-theme] bloğu olan temalar: default, dark, midnight, warm, mint
  const CSS_THEMES = ['default','dark','midnight','warm','mint'];

  function applyTheme() {
    const bodyFont   = FONTS.find(f => f.id === (_s.font       || 'dm'))       || FONTS[0];
    const headerFont = FONTS.find(f => f.id === (_s.headerFont || 'playfair')) || FONTS[1];
    const themeId    = _s.theme || 'default';
    const root = document.documentElement;

    // Önce JS ile uygulanan tema değişkenlerini temizle
    Object.keys(THEME_VARS).forEach(tid => {
      Object.keys(THEME_VARS[tid]).forEach(v => root.style.removeProperty(v));
    });

    if (CSS_THEMES.includes(themeId)) {
      // CSS bloğu olan tema → data-theme ile
      if (themeId === 'default') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', themeId);
    } else if (THEME_VARS[themeId]) {
      // JS ile uygulanan tema → data-theme kaldır, değişkenleri set et
      root.removeAttribute('data-theme');
      const vars = THEME_VARS[themeId];
      Object.keys(vars).forEach(v => root.style.setProperty(v, vars[v]));
    } else {
      root.removeAttribute('data-theme');
    }

    // Font override
    root.style.setProperty('--font',        bodyFont.css);
    root.style.setProperty('--header-font', headerFont.css);

    // Yazı büyüklüğü (ölçek faktörü)
    const scale = _s.fontScale || 1;
    root.style.setProperty('--font-scale', scale);

    // Vurgu rengi (kullanıcı özel seçtiyse tema üzerine yazılır)
    if (_s.accentColor) {
      root.style.setProperty('--accent', _s.accentColor);
    } else if (!THEME_VARS[themeId]) {
      root.style.removeProperty('--accent');
    }
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
    const currentTheme = _s.theme || 'default';
    return `
      <div class="settings-section">
        <div class="settings-section-label">🎨 Tema</div>
        <div class="theme-picker">
          ${THEMES.map(t => `
            <button class="theme-swatch${currentTheme===t.id?' selected':''}" onclick="Settings._setTheme('${t.id}')">
              <div class="theme-swatch-circle" style="background:linear-gradient(135deg,${t.colors[2]} 0%,${t.colors[2]} 50%,${t.colors[0]} 50%,${t.colors[0]} 100%)"></div>
              <span class="theme-swatch-label">${t.label}</span>
            </button>`).join('')}
        </div>
      </div>
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
        <div class="settings-section-label">Yazı Büyüklüğü</div>
        <div class="fontsize-row">
          <span class="fontsize-label" style="font-size:13px">A</span>
          <input type="range" class="fontsize-slider" min="0.85" max="1.35" step="0.05" value="${_s.fontScale||1}" oninput="Settings._setFontScale(this.value)">
          <span class="fontsize-label" style="font-size:22px">A</span>
        </div>
        <div class="fontsize-preview" style="font-size:calc(15px * ${_s.fontScale||1})">Örnek: Mercimek Çorbası tarifi</div>
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
  function _setTheme(id)      { _s.theme = id; _s.accentColor = null; save(); applyTheme(); renderPanel(); }
  function _setFontScale(v)   { _s.fontScale = parseFloat(v); save(); applyTheme(); const p=document.querySelector('.fontsize-preview'); if(p)p.style.fontSize='calc(15px * '+v+')'; }

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
    _setTab, _setFont, _setHeaderFont, _setAccent, _setTheme, _setFontScale,
    _addIngTag, _delIngTag, _addIngCat,
    _addTool, _addToolCat, _editTool,
  };
})();
