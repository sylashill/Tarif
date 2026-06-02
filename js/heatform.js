// ============================================================
// heatform.js — Isıt-Ye ekleme / düzenleme formu
// ============================================================

const HeatForm = (() => {

  let _editingId  = null;
  let _methods    = [];
  let _selImage   = null;

  function openAdd() {
    _editingId = null; _methods = []; _selImage = null;
    App.showView('heat-form');
    _render();
  }

  function openEdit(id) {
    const items = Storage.getHeatItems();
    const item = items.find(x => x.id === id);
    if (!item) return;
    _editingId = id;
    _methods = JSON.parse(JSON.stringify(item.methods || []));
    _selImage = null;
    App.showView('heat-form');
    _render();
    setTimeout(() => {
      if (document.getElementById('hf-name'))  document.getElementById('hf-name').value  = item.name  || '';
      if (document.getElementById('hf-brand')) document.getElementById('hf-brand').value = item.brand || '';
      if (document.getElementById('hf-notes')) document.getElementById('hf-notes').value = item.notes || '';
    }, 50);
  }

  function cancel() {
    App.showPage('heat');
  }

  function _render() {
    document.getElementById('heat-form-title').textContent = _editingId ? 'Ürünü Düzenle' : 'Yeni Ürün';
    document.getElementById('heat-form-body').innerHTML = `

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📦</span>
          <span class="form-section-title">Ürün Bilgisi</span>
        </div>
        <label class="form-label">Ürün Adı</label>
        <input class="form-input" id="hf-name" placeholder="örn: Trader Joe's Lazanya">
        <label class="form-label" style="margin-top:10px">Marka (opsiyonel)</label>
        <input class="form-input" id="hf-brand" placeholder="Marka adı">
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📷</span>
          <span class="form-section-title">Fotoğraf</span>
        </div>
        <div class="img-picker-area" onclick="document.getElementById('hf-img-input').click()">
          <div id="hf-img-preview">
            <div style="font-size:36px">📷</div>
            <div class="img-picker-text">Ürün fotoğrafı ekle</div>
          </div>
        </div>
        <input type="file" id="hf-img-input" accept="image/*" style="display:none" onchange="HeatForm._onImg(this)">
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">🌡️</span>
          <span class="form-section-title">Isıtma Yöntemleri</span>
        </div>
        <div id="hf-methods">
          ${_methods.map((m,i) => _methodRowHtml(m,i)).join('')}
        </div>
        <button class="add-step-btn" onclick="HeatForm._addMethod()">+ Isıtma Yöntemi Ekle</button>
      </div>

      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">📝</span>
          <span class="form-section-title">Notlar</span>
        </div>
        <textarea class="form-textarea" id="hf-notes" rows="3" placeholder="Saklama koşulları, dikkat edilecekler..."></textarea>
      </div>

      <button class="save-btn" style="background:#6c5ce7" onclick="HeatForm.save()">Kaydet ✓</button>
    `;
  }

  function _methodRowHtml(m, i) {
    const hm = HEAT_METHODS.find(x => x.id === m.methodId) || HEAT_METHODS[0];
    return `
      <div class="heat-method-row" id="hm-row-${i}">
        <div class="heat-method-row-top">
          <select class="form-select" style="flex:1" onchange="HeatForm._setMethodId(${i},this.value)">
            ${HEAT_METHODS.map(h => `<option value="${h.id}"${h.id===m.methodId?' selected':''}>${h.icon} ${h.label}</option>`).join('')}
          </select>
          <button class="step-del" onclick="HeatForm._delMethod(${i})">×</button>
        </div>
        <div class="row2" style="margin-top:8px">
          <div>
            <label class="form-label">${hm.unit === 'W' ? 'Güç (W)' : hm.unit === 'derece (1-5)' ? 'Ateş Seviyesi' : 'Sıcaklık (°C)'}</label>
            <input class="form-input" type="number" value="${m.temp||''}" placeholder="${hm.unit}"
              onchange="HeatForm._setMethodVal(${i},'temp',this.value)">
          </div>
          <div>
            <label class="form-label">Süre (dakika)</label>
            <input class="form-input" type="number" value="${m.duration||''}" placeholder="dk"
              onchange="HeatForm._setMethodVal(${i},'duration',this.value)">
          </div>
        </div>
        <input class="form-input" style="margin-top:8px" value="${m.note||''}" placeholder="Not (opsiyonel)"
          onchange="HeatForm._setMethodVal(${i},'note',this.value)">
      </div>`;
  }

  function _addMethod() {
    _methods.push({ methodId: HEAT_METHODS[0].id, temp:'', duration:'', note:'' });
    document.getElementById('hf-methods').innerHTML = _methods.map((m,i) => _methodRowHtml(m,i)).join('');
  }
  function _delMethod(i) {
    _methods.splice(i,1);
    document.getElementById('hf-methods').innerHTML = _methods.map((m,i) => _methodRowHtml(m,i)).join('');
  }
  function _setMethodId(i, val) {
    _methods[i].methodId = val;
    document.getElementById('hf-methods').innerHTML = _methods.map((m,i) => _methodRowHtml(m,i)).join('');
  }
  function _setMethodVal(i, key, val) { _methods[i][key] = val; }

  function _onImg(input) {
    const file = input.files[0]; if (!file) return;
    _selImage = file;
    const url = URL.createObjectURL(file);
    document.getElementById('hf-img-preview').innerHTML = `<img src="${url}" style="width:100%;height:140px;object-fit:cover;border-radius:10px">`;
  }

  async function save() {
    const name = document.getElementById('hf-name')?.value.trim();
    if (!name) { alert('Ürün adı gerekli!'); return; }
    const id = _editingId || Date.now();
    let hasImage = false;
    if (_selImage) {
      await Storage.saveImage('heat_' + id, _selImage);
      hasImage = true;
    } else if (_editingId) {
      const items = Storage.getHeatItems();
      hasImage = items.find(x => x.id === _editingId)?.hasImage || false;
    }
    const item = {
      id,
      name,
      brand:    document.getElementById('hf-brand')?.value.trim() || '',
      notes:    document.getElementById('hf-notes')?.value.trim() || '',
      methods:  _methods,
      hasImage,
      image:    '📦',
      addedAt:  _editingId ? (Storage.getHeatItems().find(x=>x.id===_editingId)?.addedAt||Date.now()) : id,
    };
    let items = Storage.getHeatItems();
    if (_editingId) items = items.map(x => x.id === _editingId ? item : x);
    else            items.unshift(item);
    Storage.saveHeatItems(items);
    App.showToast('✅ Kaydedildi!');
    App.showPage('heat');
  }

  return { openAdd, openEdit, cancel, save, _addMethod, _delMethod, _setMethodId, _setMethodVal, _onImg };
})();
