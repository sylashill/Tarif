// ============================================================
// form.js — Tarif ekleme / düzenleme formu
// ============================================================

const Form = (() => {

  // --- State ---
  let _editingId    = null;
  let _selectedEmoji  = '🍽️';
  let _selectedColor  = COLORS[0];
  let _selectedImage  = null;  // File blob
  let _selectedImgId  = null;  // kütüphane görseli id
  let _selectedCats   = [];
  let _stepsMode      = 'list';
  let _stepRows       = [];
  let _suggestedTags  = [];    // otomatik önerilen etiketler
  let _confirmedTags  = [];    // kullanıcı onayladıkları
  let _formPage       = 0;     // 0=Bilgi, 1=Görsel, 2=Kategori (Nesine tarzı)

  const PAGES = ['Tarif Bilgisi','Tarif Fotoğrafı','Kategori & Detaylar'];

  // ---------- Aç / Kapat ----------
  function openAdd() {
    _editingId = null;
    _reset();
    _showFormView();
  }

  async function openEdit(id) {
    const r = App.getRecipeById(id);
    if (!r) return;
    _editingId    = id;
    _selectedEmoji  = r.image || '🍽️';
    _selectedColor  = r.color || COLORS[0];
    _selectedImage  = null;
    _selectedImgId  = r.imgLibId || null;
    _selectedCats   = [...(r.categories || [])];
    _stepsMode      = r.stepsMode || 'list';
    _stepRows       = r.stepsArray ? [...r.stepsArray] : [];
    _suggestedTags  = [...(r.ingTags || [])];
    _confirmedTags  = [...(r.ingTags || [])];
    _formPage       = 0;

    _showFormView();
    _populateFields(r);
    if (r.hasImage) await _loadExistingImage(r);
  }

  function cancel() {
    if (_editingId) {
      App.openDetail(_editingId);
    } else {
      App.showPage('recipes');
    }
  }

  function _reset() {
    _selectedEmoji = '🍽️'; _selectedColor = COLORS[0];
    _selectedImage = null;  _selectedImgId = null;
    _selectedCats  = [];    _stepsMode = 'list';
    _stepRows      = ['','','']; // 3 boş adım
    _suggestedTags = [];    _confirmedTags = [];
    _formPage      = 0;
  }

  function _showFormView() {
    App.showView('form');
    _renderForm();
  }

  // ---------- Render ----------
  function _renderForm() {
    document.getElementById('form-title-text').textContent = _editingId ? 'Tarifi Düzenle' : 'Yeni Tarif';
    _renderProgressBar();
    _renderPage();
  }

  function _renderProgressBar() {
    document.getElementById('form-progress').innerHTML = `
      <div class="form-progress-bar">
        ${PAGES.map((p,i) => `
          <div class="fpb-step ${i < _formPage ? 'done' : (i===_formPage ? 'active' : '')}">
            <div class="fpb-dot">${i < _formPage ? '✓' : i+1}</div>
            <div class="fpb-label">${p}</div>
          </div>
          ${i<PAGES.length-1?'<div class="fpb-line '+(i<_formPage?'done':'')+'"></div>':''}`
        ).join('')}
      </div>
    `;
  }

  function _renderPage() {
    const el = document.getElementById('form-page-body');
    if (_formPage === 0) el.innerHTML = _renderPage0();
    if (_formPage === 1) el.innerHTML = _renderPage1();
    if (_formPage === 2) el.innerHTML = _renderPage2();
    _attachPageEvents();

    // Footer butonları
    document.getElementById('form-prev-btn').style.display = _formPage > 0 ? 'flex' : 'none';
    document.getElementById('form-next-btn').style.display = _formPage < PAGES.length-1 ? 'flex' : 'none';
    document.getElementById('form-save-btn').style.display = _formPage === PAGES.length-1 ? 'flex' : 'none';
    document.getElementById('form-draft-btn').style.display = 'flex';
  }

  // Sayfa 0: Tarif Bilgisi
  function _renderPage0() {
    const existing = _editingId ? (App.getRecipeById(_editingId) || {}) : {};
    const name  = document.getElementById('f-name')?.value || existing.name || '';
    const story = document.getElementById('f-story')?.value || existing.story || '';
    const ingVal= document.getElementById('f-ingredients')?.value || (existing.ingredients||[]).map(i=>typeof i==='object'?`${i.amount} ${i.unit} ${i.name}`:i).join(', ') || '';
    const notes = document.getElementById('f-notes')?.value || existing.notes || '';
    const diff  = existing.difficulty || 'Orta';
    const dur   = existing.duration || '';
    const serv  = existing.servings || 2;
    const cals  = existing.calories || '';
    const link  = existing.sourceLink || '';

    // Steps
    const stepsListHtml = _stepRows.map((s,i) => `
      <div class="step-row">
        <div class="step-num-badge" style="background:var(--accent)">${i+1}</div>
        <textarea class="step-input" data-step="${i}" rows="2" placeholder="${i+1}. adımı buraya yaz">${s}</textarea>
        <button class="step-del" onclick="Form._removeStep(${i})">−</button>
      </div>`).join('');

    return `
      <!-- Tarif Adı -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🍽️</span>
          <span class="form-section-title">Tarif Adı</span>
        </div>
        <input class="form-input" id="f-name" placeholder="Tarif adı gir..." value="${_esc(name)}" oninput="Form._onNameChange(this.value)">
        <div class="form-hint-text">Dikkat çekici, farklı bir tarif adı ilgi görür</div>
      </div>

      <!-- Tarif Hikayesi -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📖</span>
          <span class="form-section-title">Tarif Hikayesi</span>
        </div>
        <div class="story-hint">Tarifin malzemeleri ve hazırlanışı dışında eklemek istediklerini yaz.</div>
        <textarea class="form-textarea" id="f-story" rows="3" placeholder="Hikaye ekle...">${_esc(story)}</textarea>
      </div>

      <!-- Malzemeler -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🛒</span>
          <span class="form-section-title">Malzemeler</span>
        </div>
        <textarea class="form-textarea" id="f-ingredients" rows="4"
          placeholder="Miktar birim malzeme — örn: 500g un, 3 yumurta, 1 su bardağı süt"
          oninput="Form._onIngredientsChange(this.value)">${_esc(ingVal)}</textarea>
        <!-- Otomatik etiket önerileri -->
        <div id="tag-suggestions-area" style="margin-top:8px"></div>
      </div>

      <!-- Hazırlanış -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">👨‍🍳</span>
          <span class="form-section-title">Hazırlanış</span>
        </div>
        <div class="steps-mode-toggle">
          <button class="steps-mode-btn${_stepsMode==='list'?' active':''}" onclick="Form._setStepsMode('list')">📋 Adım Adım</button>
          <button class="steps-mode-btn${_stepsMode==='single'?' active':''}" onclick="Form._setStepsMode('single')">📝 Tek Metin</button>
        </div>
        <div id="steps-editor" style="margin-top:10px">
          ${_stepsMode==='list' ? `
            <div id="step-rows-container">${stepsListHtml}</div>
            <div class="step-actions-row">
              <button class="step-action-btn" onclick="Form._removeLastStep()">− Adım Kaldır</button>
              <button class="step-action-btn primary" onclick="Form._addStep()">+ Adım Ekle</button>
            </div>
          ` : `
            <textarea class="form-textarea" id="f-steps-single" rows="8"
              placeholder="Tarifi buraya yaz...&#10;&#10;Satır arası boşluk için Enter kullanabilirsin."
              style="white-space:pre-wrap">${_esc(_editingId ? (App.getRecipeById(_editingId)||{}).stepsText||'' : '')}</textarea>
          `}
        </div>
      </div>

      <!-- Notlar -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📝</span>
          <span class="form-section-title">Notlarım</span>
        </div>
        <textarea class="form-textarea" id="f-notes" rows="3"
          placeholder="Püf noktaları, tavsiyeler, değişiklikler...">${_esc(notes)}</textarea>
      </div>

      <!-- Meta bilgiler -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">ℹ️</span>
          <span class="form-section-title">Detaylar</span>
        </div>
        <div class="row2">
          <div>
            <label class="form-label">Süre</label>
            <input class="form-input" id="f-duration" placeholder="30 dk" value="${_esc(dur)}">
          </div>
          <div>
            <label class="form-label">Kaç Kişilik</label>
            <input class="form-input" id="f-servings" type="number" min="1" value="${serv}">
          </div>
        </div>
        <div class="row2" style="margin-top:10px">
          <div>
            <label class="form-label">Zorluk</label>
            <select class="form-select" id="f-difficulty">
              ${DIFFICULTY.map(d=>`<option${d===diff?' selected':''}>${d}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Kalori (opsiyonel)</label>
            <input class="form-input" id="f-calories" placeholder="kcal" value="${_esc(cals)}">
          </div>
        </div>
        <label class="form-label" style="margin-top:10px">Kaynak Linki</label>
        <input class="form-input" id="f-source-link" type="url" placeholder="https://..." value="${_esc(link)}">
      </div>
    `;
  }

  // Sayfa 1: Fotoğraf
  function _renderPage1() {
    const imgLib = Storage.getImgLib();
    return `
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📷</span>
          <span class="form-section-title">Fotoğraf Yükle</span>
        </div>
        <div class="img-picker-area" id="img-picker-area" onclick="document.getElementById('img-file-input').click()">
          <div id="img-preview-wrap">
            <div style="font-size:48px;margin-bottom:8px">📷</div>
            <div class="img-picker-text">Fotoğraf seç veya çek</div>
          </div>
        </div>
        <input type="file" id="img-file-input" accept="image/*" style="display:none" onchange="Form._onImageSelect(this)">
      </div>

      ${imgLib.length ? `
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🖼️</span>
          <span class="form-section-title">Görsel Kütüphanesi</span>
        </div>
        <div class="img-library-grid" id="img-lib-grid">Yükleniyor...</div>
      </div>` : ''}

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">😀</span>
          <span class="form-section-title">Emoji Seç</span>
        </div>
        <div class="emoji-section-tabs">
          <button class="etab active" id="etab-food" onclick="Form._showEmojiTab('food',this)">🍲 Yemekler</button>
          <button class="etab" id="etab-flags" onclick="Form._showEmojiTab('flags',this)">🌍 Bayraklar</button>
          <button class="etab" id="etab-custom" onclick="Form._showEmojiTab('custom',this)">✏️ Özel</button>
        </div>
        <div class="emoji-row" id="emoji-row">
          ${FOOD_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('')}
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🎨</span>
          <span class="form-section-title">Kart Rengi</span>
        </div>
        <div class="color-row">
          ${COLORS.map(c=>`<button class="color-dot${c===_selectedColor?' selected':''}" style="background:${c}" onclick="Form._selectColor('${c}')"></button>`).join('')}
        </div>
      </div>
    `;
  }

  // Sayfa 2: Kategori & Detaylar
  function _renderPage2() {
    const allCats = [...DEFAULT_RECIPE_CATS, ...Storage.getCustomCats()];
    return `
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📂</span>
          <span class="form-section-title">Kategoriler <span style="font-size:12px;color:#888">(birden fazla seçebilirsin)</span></span>
        </div>
        <div class="cat-multi" id="cat-multi">
          ${allCats.map(c=>`
            <button class="cat-opt${_selectedCats.includes(c)?' selected':''}" onclick="Form._toggleCat('${c}')">${c}</button>
          `).join('')}
        </div>
        <div class="add-cat-row">
          <input class="add-cat-input" id="new-cat-input" placeholder="+ Yeni kategori" onkeydown="if(event.key==='Enter')Form._addCustomCat()">
          <button class="add-cat-btn" onclick="Form._addCustomCat()">Ekle</button>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🏷️</span>
          <span class="form-section-title">Malzeme Etiketleri</span>
        </div>
        <div id="confirmed-tags-area">
          ${_confirmedTags.map((t,i)=>`
            <span class="tag-chip confirmed">
              ${t} <button class="tag-del" onclick="Form._removeConfirmedTag(${i})">×</button>
            </span>`).join('')}
          <button class="tag-chip tag-chip-add" onclick="Form._manualAddTag()">+</button>
        </div>
      </div>
    `;
  }

  // ---------- Sayfa olayları ----------
  function _attachPageEvents() {
    if (_formPage === 0) {
      // Step textarea binding
      document.querySelectorAll('[data-step]').forEach(ta => {
        ta.addEventListener('input', e => {
          _stepRows[+e.target.dataset.step] = e.target.value;
        });
      });
      // Malzeme değişince etiket öner
      const ingEl = document.getElementById('f-ingredients');
      if (ingEl) _onIngredientsChange(ingEl.value);
    }
    if (_formPage === 1) {
      // Görsel kütüphanesini async yükle
      _loadImgLibrary();
      // Mevcut görsel varsa göster
      if (_selectedImage) {
        const url = URL.createObjectURL(_selectedImage);
        document.getElementById('img-preview-wrap').innerHTML = `<img src="${url}" style="width:100%;height:160px;object-fit:cover;border-radius:12px">`;
      } else if (_selectedImgId) {
        Storage.getImage(_selectedImgId).then(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          document.getElementById('img-preview-wrap').innerHTML = `<img src="${url}" style="width:100%;height:160px;object-fit:cover;border-radius:12px">`;
        });
      }
    }
  }

  async function _loadImgLibrary() {
    const grid = document.getElementById('img-lib-grid');
    if (!grid) return;
    const lib = Storage.getImgLib();
    if (!lib.length) { grid.innerHTML = '<div style="color:#aaa;font-size:13px">Henüz görsel yok</div>'; return; }
    grid.innerHTML = '';
    for (const meta of lib) {
      const blob = await Storage.getImage(meta.id);
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      const btn = document.createElement('button');
      btn.className = 'img-lib-thumb' + (meta.id === _selectedImgId ? ' selected' : '');
      btn.style.backgroundImage = `url(${url})`;
      btn.title = meta.name || '';
      btn.onclick = () => _selectLibImage(meta.id);
      grid.appendChild(btn);
    }
  }

  // ---------- Event handlers ----------
  function _onNameChange(val) { /* şu an pasif */ }

  function _onIngredientsChange(val) {
    const allIngredients = Settings.getAllIngredients();
    const words = val.toLowerCase().replace(/[,\n]/g,' ').split(/\s+/).filter(w => w.length > 2);
    const found = new Set();
    words.forEach(w => {
      allIngredients.forEach(tag => {
        if (tag.includes(w) || w.includes(tag)) found.add(tag);
      });
    });
    _suggestedTags = [...found];
    _renderTagSuggestions();
  }

  function _renderTagSuggestions() {
    const el = document.getElementById('tag-suggestions-area');
    if (!el) return;
    if (!_suggestedTags.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Tespit Edilen Etiketler</div>
      <div class="tag-cloud">
        ${_suggestedTags.map((t,i) => {
          const confirmed = _confirmedTags.includes(t);
          return `<span class="tag-chip ${confirmed?'confirmed':'suggested'}" onclick="Form._toggleSuggestedTag('${t}')">
            ${confirmed?'✓ ':''} ${t}
            ${confirmed?`<button class="tag-del" onclick="event.stopPropagation();Form._removeSuggestedTag('${t}')">×</button>`:''}
          </span>`;
        }).join('')}
      </div>`;
  }

  function _toggleSuggestedTag(tag) {
    if (_confirmedTags.includes(tag)) _confirmedTags = _confirmedTags.filter(t => t !== tag);
    else _confirmedTags.push(tag);
    _renderTagSuggestions();
  }
  function _removeSuggestedTag(tag) {
    _confirmedTags  = _confirmedTags.filter(t => t !== tag);
    _suggestedTags  = _suggestedTags.filter(t => t !== tag);
    _renderTagSuggestions();
  }
  function _removeConfirmedTag(idx) {
    _confirmedTags.splice(idx, 1);
    const el = document.getElementById('confirmed-tags-area');
    if (el) el.innerHTML = _confirmedTags.map((t,i)=>`
      <span class="tag-chip confirmed">${t} <button class="tag-del" onclick="Form._removeConfirmedTag(${i})">×</button></span>`).join('')
      + `<button class="tag-chip tag-chip-add" onclick="Form._manualAddTag()">+</button>`;
  }
  function _manualAddTag() {
    const val = prompt('Eklenecek etiket:');
    if (!val || !val.trim()) return;
    const t = val.trim().toLowerCase();
    if (!_confirmedTags.includes(t)) _confirmedTags.push(t);
    _renderPage(); // sayfayı yenile
  }

  // Steps
  function _setStepsMode(mode) { _stepsMode = mode; _renderPage(); }
  function _addStep()          { _stepRows.push(''); _renderPage(); }
  function _removeLastStep()   { if (_stepRows.length > 1) { _stepRows.pop(); _renderPage(); } }
  function _removeStep(i)      { _stepRows.splice(i,1); _renderPage(); }

  // Emoji
  function _selectEmoji(e)     { _selectedEmoji = e; _selectedImage = null; _selectedImgId = null; _renderPage(); }
  function _showEmojiTab(tab, btn) {
    document.querySelectorAll('.etab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const row = document.getElementById('emoji-row');
    if (tab === 'food')   row.innerHTML = FOOD_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('');
    if (tab === 'flags')  row.innerHTML = FLAG_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('');
    if (tab === 'custom') row.innerHTML = `<input class="emoji-custom-input" placeholder="✏️ herhangi bir emoji yaz" maxlength="2" oninput="Form._setCustomEmoji(this.value)" style="width:100%;padding:12px;border:2px solid #eee;border-radius:10px;font-size:24px;text-align:center">`;
  }
  function _setCustomEmoji(v)  { if (v.trim()) { _selectedEmoji = v.trim(); _selectedImage = null; } }

  // Color
  function _selectColor(c)     { _selectedColor = c; _renderPage(); }

  // Image
  function _onImageSelect(input) {
    const file = input.files[0]; if (!file) return;
    _selectedImage = file; _selectedImgId = null;
    _renderPage();
  }
  function _selectLibImage(id) {
    _selectedImgId = id; _selectedImage = null;
    _renderPage();
  }

  // Categories
  function _toggleCat(c) {
    if (_selectedCats.includes(c)) _selectedCats = _selectedCats.filter(x => x !== c);
    else _selectedCats.push(c);
    const el = document.getElementById('cat-multi');
    if (el) el.querySelectorAll('.cat-opt').forEach(b => {
      b.classList.toggle('selected', _selectedCats.includes(b.textContent.trim()));
    });
  }
  function _addCustomCat() {
    const inp = document.getElementById('new-cat-input');
    const val = inp?.value.trim();
    if (!val) return;
    const custom = Storage.getCustomCats();
    if (!custom.includes(val) && !DEFAULT_RECIPE_CATS.includes(val)) {
      custom.push(val); Storage.saveCustomCats(custom);
    }
    if (!_selectedCats.includes(val)) _selectedCats.push(val);
    if (inp) inp.value = '';
    _renderPage();
  }

  // Navigation
  function nextPage() {
    _collectCurrentPage();
    if (_formPage < PAGES.length - 1) { _formPage++; _renderPage(); }
  }
  function prevPage() {
    _collectCurrentPage();
    if (_formPage > 0) { _formPage--; _renderPage(); }
  }

  function _collectCurrentPage() {
    if (_formPage === 0) {
      // Step textarea değerlerini topla
      document.querySelectorAll('[data-step]').forEach(ta => {
        _stepRows[+ta.dataset.step] = ta.value;
      });
    }
  }

  // Populate (edit mod)
  function _populateFields(r) {
    setTimeout(() => {
      const ingVal = (r.ingredients || []).map(i =>
        typeof i === 'object' ? `${i.amount||''} ${i.unit||''} ${i.name||i}`.trim() : i
      ).join(', ');
      if (document.getElementById('f-name'))         document.getElementById('f-name').value = r.name || '';
      if (document.getElementById('f-story'))        document.getElementById('f-story').value = r.story || '';
      if (document.getElementById('f-ingredients'))  document.getElementById('f-ingredients').value = ingVal;
      if (document.getElementById('f-notes'))        document.getElementById('f-notes').value = r.notes || '';
      if (document.getElementById('f-duration'))     document.getElementById('f-duration').value = r.duration || '';
      if (document.getElementById('f-servings'))     document.getElementById('f-servings').value = r.servings || 2;
      if (document.getElementById('f-calories'))     document.getElementById('f-calories').value = r.calories || '';
      if (document.getElementById('f-source-link'))  document.getElementById('f-source-link').value = r.sourceLink || '';
    }, 50);
  }

  async function _loadExistingImage(r) {
    // handled in page 1 render
  }

  // ---------- Kaydet ----------
  async function save(isDraft = false) {
    _collectCurrentPage();
    const name = document.getElementById('f-name')?.value.trim();
    if (!name && !isDraft) { alert('Tarif adı gerekli!'); return; }

    const id = _editingId || Date.now();

    // Görseli kaydet
    let hasImage = false;
    if (_selectedImage) {
      await Storage.saveImage(id, _selectedImage);
      // Kütüphaneye ekle
      const lib = Storage.getImgLib();
      if (!lib.find(x => x.id === id)) {
        lib.unshift({ id: String(id), name: name || 'Görsel', addedAt: Date.now() });
        Storage.saveImgLib(lib);
      }
      hasImage = true;
    } else if (_selectedImgId) {
      // Kütüphane görselini bu tarife kopyala
      const blob = await Storage.getImage(_selectedImgId);
      if (blob) { await Storage.saveImage(id, blob); hasImage = true; }
    } else if (_editingId) {
      const old = App.getRecipeById(_editingId);
      hasImage = old?.hasImage || false;
    }

    // Malzemeleri parse et
    const ingRaw = document.getElementById('f-ingredients')?.value || '';
    const ingredients = ingRaw.split(',').map(s => s.trim()).filter(Boolean);

    const recipe = {
      id,
      name: name || 'İsimsiz Tarif',
      story:       document.getElementById('f-story')?.value.trim() || '',
      categories:  _selectedCats.length ? _selectedCats : ['Genel'],
      duration:    document.getElementById('f-duration')?.value.trim() || '',
      servings:    parseInt(document.getElementById('f-servings')?.value) || 2,
      difficulty:  document.getElementById('f-difficulty')?.value || 'Orta',
      calories:    document.getElementById('f-calories')?.value.trim() || '',
      sourceLink:  document.getElementById('f-source-link')?.value.trim() || '',
      ingredients,
      ingTags:     _confirmedTags,
      stepsMode:   _stepsMode,
      stepsText:   _stepsMode === 'single' ? (document.getElementById('f-steps-single')?.value || '') : '',
      stepsArray:  _stepsMode === 'list'   ? _stepRows.filter(s => s.trim()) : [],
      notes:       document.getElementById('f-notes')?.value.trim() || '',
      image:       _selectedEmoji || '🍽️',
      color:       _selectedColor,
      hasImage,
      imgLibId:    _selectedImgId || null,
      isDraft,
      addedAt:     _editingId ? (App.getRecipeById(_editingId)?.addedAt || Date.now()) : id,
    };

    let recipes = Storage.getRecipes();
    if (_editingId) recipes = recipes.map(r => r.id === _editingId ? recipe : r);
    else            recipes.unshift(recipe);
    Storage.saveRecipes(recipes);

    App.showToast(isDraft ? '📋 Taslak kaydedildi' : '✅ Tarif kaydedildi!');
    App.openDetail(id);
  }

  // ---------- Yardımcılar ----------
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return {
    openAdd, openEdit, cancel,
    nextPage, prevPage, save,
    _onNameChange, _onIngredientsChange,
    _toggleSuggestedTag, _removeSuggestedTag, _removeConfirmedTag, _manualAddTag,
    _setStepsMode, _addStep, _removeLastStep, _removeStep,
    _selectEmoji, _showEmojiTab, _setCustomEmoji,
    _selectColor,
    _onImageSelect, _selectLibImage,
    _toggleCat, _addCustomCat,
  };
})();
