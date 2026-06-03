// ============================================================
// render.js — Liste, detay, araç tıklama popup
// ============================================================

const Render = (() => {

  // ---- Liste ----
  async function recipeList(filtered) {
    const el = document.getElementById('recipe-list');
    if (!filtered.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🍽️</div>
        <div class="empty-text">Sonuç bulunamadı</div>
        <div class="empty-hint">+ ile yeni tarif ekleyebilirsin</div></div>`;
      return;
    }
    el.innerHTML = filtered.map(r => _cardHtml(r)).join('');
    // Görselleri async yükle
    for (const r of filtered) {
      if (r.hasImage) {
        const blob = await Storage.getImage(r.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const img = document.getElementById('cthumb-' + r.id);
          if (img) img.src = url;
        }
      }
    }
  }

  function _cardHtml(r) {
    const cats = (r.categories || [r.category || 'Genel']).join(' · ');
    const diffBadge = r.difficulty ? `<span class="card-diff diff-${(r.difficulty||'').toLowerCase()}">${r.difficulty}</span>` : '';
    const thumbHtml = r.hasImage
      ? `<img class="card-thumb" id="cthumb-${r.id}" src="">`
      : `<div class="card-emoji-display" style="background:${r.color}18">${r.image || '🍽️'}</div>`;
    const draftBadge = r.isDraft ? `<span class="draft-badge">Taslak</span>` : '';
    return `
      <div class="recipe-card" onclick="App.openDetail(${r.id})">
        <div class="card-accent" style="background:${r.color}"></div>
        ${thumbHtml}
        <div class="card-info">
          <div class="card-name">${r.name} ${draftBadge}</div>
          <div class="card-meta">
            <span class="card-cat" style="color:${r.color}">${cats}</span>
            ${r.duration ? `<span class="card-dur">⏱ ${r.duration}</span>` : ''}
            <span class="card-serv">👥 ${r.servings} kişi</span>
            ${diffBadge}
          </div>
        </div>
        <div class="card-arrow" style="color:${r.color}">›</div>
      </div>`;
  }

  // ---- Detay ----
  async function detail(r) {
    // Header
    document.getElementById('detail-header').style.background = r.color;
    const cats = (r.categories || [r.category || 'Genel']).join(' · ');
    document.getElementById('detail-category').textContent = cats;
    document.getElementById('detail-title').textContent = r.name;

    const metaItems = [
      r.duration   ? `<span class="meta-badge">⏱ ${r.duration}</span>` : '',
      `<span class="meta-badge">👥 ${r.servings} kişilik</span>`,
      r.difficulty ? `<span class="meta-badge diff-badge-${(r.difficulty||'').toLowerCase()}">${r.difficulty}</span>` : '',
      r.calories   ? `<span class="meta-badge">🔥 ${r.calories} kcal</span>` : '',
    ];
    document.getElementById('detail-meta').innerHTML = metaItems.join('');

    // Thumb
    const tw = document.getElementById('detail-thumb-wrap');
    if (r.hasImage) {
      const blob = await Storage.getImage(r.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        tw.innerHTML = `<img class="detail-hero-img" src="${url}">`;
      } else {
        tw.innerHTML = `<div class="detail-emoji-display">${r.image || '🍽️'}</div>`;
      }
    } else {
      tw.innerHTML = `<div class="detail-emoji-display">${r.image || '🍽️'}</div>`;
    }

    // Body
    const body = document.getElementById('detail-body');
    body.innerHTML = `
      ${r.story ? `<div class="detail-story">${_esc(r.story)}</div>` : ''}

      ${r.ingredients?.length ? `
      <div class="section">
        <div class="section-title" style="color:${r.color}">🛒 Malzemeler</div>
        <div class="ing-grid">
          ${r.ingredients.map(i => `<span class="ing-tag" style="border-color:${r.color}55;color:${r.color}">${_esc(String(i))}</span>`).join('')}
        </div>
      </div>` : ''}

      ${_stepsHtml(r)}

      ${r.ingTags?.length ? `
      <div class="section">
        <div class="section-title" style="color:${r.color}">🏷️ Malzeme Etiketleri</div>
        <div class="ing-grid">
          ${r.ingTags.map(t => `<span class="ing-tag" style="border-color:${r.color}33;color:${r.color};font-size:12px">${t}</span>`).join('')}
        </div>
      </div>` : ''}

      ${r.notes ? `
      <div class="note-box" style="border-left-color:${r.color}">
        <div class="note-label">📝 Notlarım</div>
        <p class="note-text">${_esc(r.notes)}</p>
      </div>` : ''}

      ${r.sourceLink ? `<div class="source-link"><a href="${r.sourceLink}" target="_blank" style="color:${r.color}">🔗 Kaynak</a></div>` : ''}

      <!-- Porsiyon hesaplayıcı -->
      <div class="portion-calc">
        <div class="section-title" style="color:${r.color}">🔢 Porsiyon Hesaplayıcı</div>
        <div class="portion-row">
          <button class="portion-btn" onclick="Render.changePortion(${r.id}, -1)">−</button>
          <span class="portion-val" id="portion-val-${r.id}">${r.servings} kişilik</span>
          <button class="portion-btn" onclick="Render.changePortion(${r.id}, 1)">+</button>
        </div>
        <div id="portion-ingredients-${r.id}"></div>
      </div>

      ${(r.stepsArray?.length || r.stepsText) ? `<button class="cook-start-btn" style="border-color:${r.color};color:${r.color}" onclick="Render.startCookMode(${r.id})">🍳 Pişirme Modunu Başlat</button>` : ''}

      <div class="action-row">
        <button class="edit-btn" style="background:${r.color}" onclick="Form.openEdit(${r.id})">✏️ Düzenle</button>
        <button class="copy-btn" onclick="App.copyRecipe(${r.id})">📋</button>
        <button class="add-shop-btn" onclick="App.addToShopping(${r.id})">🛒</button>
        <button class="print-btn" onclick="App.printRecipe(${r.id})">🖨️</button>
        <button class="export-btn" onclick="App.exportRecipe(${r.id})">📤</button>
        <button class="delete-btn" onclick="App.openDeleteModal(${r.id})">🗑️</button>
      </div>
    `;

    _setupToolHighlights(r.color);

    // Banner küçülme — titremeyi önlemek için histerezis (farklı eşikler)
    const hdr = document.getElementById('detail-header');
    const bdy = document.getElementById('detail-body');
    if (hdr && bdy) {
      hdr.classList.toggle('has-hero', !!r.hasImage);
      hdr.classList.remove('collapsed');
      let collapsed = false;
      bdy.onscroll = () => {
        const y = bdy.scrollTop;
        // Aşağı inerken 60px'de küçült, yukarı çıkarken 20px'de büyüt (histerezis)
        if (!collapsed && y > 60) { collapsed = true; hdr.classList.add('collapsed'); }
        else if (collapsed && y < 20) { collapsed = false; hdr.classList.remove('collapsed'); }
      };
    }
  }

  // ---- Adımlar HTML ----
  function _stepsHtml(r) {
    const sm = r.stepsMode || 'list';
    if (sm === 'list' && r.stepsArray?.length) {
      const items = r.stepsArray.map((s, i) => `
        <li class="step-item">
          <div class="step-num" style="background:${r.color}">${i+1}</div>
          <div class="step-text">${_highlightTools(s, r.color)}</div>
        </li>`).join('');
      return `<div class="section"><div class="section-title" style="color:${r.color}">👨‍🍳 Hazırlanış</div><ul class="steps-list">${items}</ul></div>`;
    } else if (r.stepsText) {
      return `<div class="section"><div class="section-title" style="color:${r.color}">👨‍🍳 Hazırlanış</div><p class="steps-single">${_highlightTools(r.stepsText, r.color)}</p></div>`;
    }
    return '';
  }

  // ---- Araç vurgulama ----
  function _highlightTools(text, color) {
    const escaped = _esc(text);
    const tools = Settings.getAllTools();
    let result = escaped;
    tools.forEach(tool => {
      const pattern = new RegExp(`\\b(${tool.name})\\b`, 'gi');
      result = result.replace(pattern,
        `<span class="tool-highlight" style="color:${color};border-bottom:2px solid ${color}" onclick="Render.showToolPopup('${tool.name.replace(/'/g,"\\'")}','${color}')" title="Alternatif araçlar için tıkla">$1</span>`
      );
    });
    return result;
  }

  function _setupToolHighlights(color) {
    // zaten onclick ile kuruldu, burada ekstra yapılacak bir şey yok
  }

  // ---- Araç popup (düzenlenebilir) ----
  let _popupTool=null, _popupColor='#e8521a';
  function showToolPopup(toolName, color) {
    const tool = Settings.getToolByName(toolName);
    if (!tool) return;
    _popupTool=tool; _popupColor=color;
    _renderToolPopup();
    document.getElementById('tool-popup').classList.add('open');
  }
  function _renderToolPopup(){
    const tool=_popupTool, color=_popupColor;
    const altHtml = tool.alt?.length
      ? tool.alt.map((a,i)=>`
          <div class="tool-alt-card"><div class="tool-alt-row">
            <div><div class="tool-alt-name">🔧 ${a.name}</div><div class="tool-alt-tip">${a.tip||''}</div></div>
            <button class="tool-alt-del" onclick="Render._deleteAlt('${tool.name}',${i})">🗑️</button>
          </div></div>`).join('')
      : '<div class="tool-no-alt">Henüz alternatif eklenmedi</div>';
    document.getElementById('tool-popup').innerHTML = `
      <div class="tool-popup-inner" onclick="event.stopPropagation()">
        <div class="tool-popup-title" style="color:${color}">🔧 ${tool.name} Alternatifleri</div>
        <div class="tool-alts">${altHtml}</div>
        <div class="tool-add-form">
          <input class="tool-add-input" id="tool-alt-name-input" placeholder="Alternatif (örn: airfryer)">
          <input class="tool-add-input" id="tool-alt-tip-input" placeholder="Not (örn: 180°C, 15 dk)">
          <button class="tool-add-btn" style="background:${color}" onclick="Render._addAlt('${tool.name}')">+ Ekle</button>
        </div>
        <button class="tool-popup-close" onclick="Render.closeToolPopup()">Kapat</button>
      </div>`;
  }
  function _saveToolAlt(toolName, altArr){
    const tt=Settings.getToolTags();
    for(const cat of Object.values(tt)){const t=cat.find(x=>x.name===toolName);if(t){t.alt=altArr;break;}}
    Storage.saveToolTags(tt); Settings.load();
    _popupTool=Settings.getToolByName(toolName); _renderToolPopup();
  }
  function _addAlt(toolName){
    const n=document.getElementById('tool-alt-name-input')?.value.trim();
    const tip=document.getElementById('tool-alt-tip-input')?.value.trim()||'';
    if(!n)return;
    const tool=Settings.getToolByName(toolName); if(!tool)return;
    const alt=tool.alt?[...tool.alt]:[]; alt.push({name:n,tip});
    _saveToolAlt(toolName,alt);
  }
  function _deleteAlt(toolName,idx){
    const tool=Settings.getToolByName(toolName); if(!tool)return;
    const alt=[...tool.alt]; alt.splice(idx,1);
    _saveToolAlt(toolName,alt);
  }

  function closeToolPopup() {
    document.getElementById('tool-popup').classList.remove('open');
  }

  // ---- Pişirme Modu (tam ekran adım adım) ----
  let _cookSteps=[], _cookIdx=0, _cookColor='#e8521a', _cookTitle='';
  function startCookMode(recipeId){
    const r=App.getRecipeById(recipeId); if(!r)return;
    if(r.stepsArray?.length) _cookSteps=[...r.stepsArray];
    else if(r.stepsText) _cookSteps=r.stepsText.split(/\n\n+/).map(s=>s.trim()).filter(Boolean);
    else return;
    _cookIdx=0; _cookColor=r.color; _cookTitle=r.name;
    document.getElementById('cook-overlay').classList.add('open');
    _renderCook();
  }
  function _renderCook(){
    const total=_cookSteps.length;
    const dots=_cookSteps.map((_,i)=>`<div class="cook-dot ${i<_cookIdx?'done':(i===_cookIdx?'active':'')}" style="${i===_cookIdx?'background:'+_cookColor:''}"></div>`).join('');
    document.getElementById('cook-overlay').innerHTML=`
      <div class="cook-header" style="background:${_cookColor}">
        <span class="cook-header-title">${_cookTitle}</span>
        <button class="cook-close" onclick="Render.closeCookMode()">✕</button>
      </div>
      <div class="cook-body">
        <div class="cook-step-num">Adım ${_cookIdx+1} / ${total}</div>
        <div class="cook-step-text">${_esc(_cookSteps[_cookIdx])}</div>
        <div class="cook-progress">${dots}</div>
      </div>
      <div class="cook-footer">
        ${_cookIdx>0?`<button class="cook-nav-btn cook-prev" onclick="Render.cookPrev()">← Önceki</button>`:''}
        ${_cookIdx<total-1?`<button class="cook-nav-btn cook-next" style="background:${_cookColor}" onclick="Render.cookNext()">Sonraki →</button>`:`<button class="cook-nav-btn cook-next" style="background:#00b894" onclick="Render.closeCookMode()">✓ Bitti</button>`}
      </div>`;
  }
  function cookNext(){ if(_cookIdx<_cookSteps.length-1){_cookIdx++;_renderCook();} }
  function cookPrev(){ if(_cookIdx>0){_cookIdx--;_renderCook();} }
  function closeCookMode(){ document.getElementById('cook-overlay').classList.remove('open'); }

  // ---- Porsiyon hesap ----
  let _portionMultipliers = {};

  function changePortion(recipeId, delta) {
    const r = App.getRecipeById(recipeId);
    if (!r) return;
    const current = _portionMultipliers[recipeId] || r.servings;
    const newVal = Math.max(1, current + delta);
    _portionMultipliers[recipeId] = newVal;
    const ratio = newVal / r.servings;

    document.getElementById(`portion-val-${recipeId}`).textContent = `${newVal} kişilik`;

    // Malzemeleri parse edip çarp
    const container = document.getElementById(`portion-ingredients-${recipeId}`);
    if (!container || !r.ingredients?.length) return;
    const html = r.ingredients.map(ing => {
      const str = String(ing);
      const match = str.match(/^([\d.,]+)\s*(\w+)?\s+(.+)$/);
      if (match) {
        const newAmt = (parseFloat(match[1].replace(',','.')) * ratio).toFixed(1).replace(/\.0$/,'');
        return `<span class="portion-ing">${newAmt} ${match[2]||''} ${match[3]}</span>`;
      }
      return `<span class="portion-ing">${str}</span>`;
    }).join('');
    container.innerHTML = `<div class="portion-ing-grid">${html}</div>`;
  }

  // ---- Isıt-Ye Listesi ----
  async function heatList(items) {
    const el = document.getElementById('heat-list');
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🌡️</div>
        <div class="empty-text">Henüz ürün yok</div>
        <div class="empty-hint">+ ile ekleyebilirsin</div></div>`;
      return;
    }
    el.innerHTML = items.map(item => _heatCardHtml(item)).join('');
    for (const item of items) {
      if (item.hasImage) {
        const blob = await Storage.getImage('heat_' + item.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const img = document.getElementById('hthumb-' + item.id);
          if (img) img.src = url;
        }
      }
    }
  }

  function _heatCardHtml(item) {
    const thumb = item.hasImage
      ? `<img class="card-thumb" id="hthumb-${item.id}" src="">`
      : `<div class="card-emoji-display" style="background:#f0edff">${item.image || '📦'}</div>`;
    const methods = (item.methods || []).slice(0,3).map(m => {
      const hm = HEAT_METHODS.find(x => x.id === m.methodId);
      return hm ? `<span class="heat-badge">${hm.icon} ${m.temp}${hm.unit} · ${m.duration}dk</span>` : '';
    }).join('');
    return `
      <div class="recipe-card" onclick="App.openHeatDetail(${item.id})">
        <div class="card-accent" style="background:#6c5ce7"></div>
        ${thumb}
        <div class="card-info">
          <div class="card-name">${item.name}</div>
          <div class="heat-methods-row">${methods}</div>
        </div>
        <div class="card-arrow" style="color:#6c5ce7">›</div>
      </div>`;
  }

  // ---- Isıt-Ye Detay ----
  async function heatDetail(item) {
    const el = document.getElementById('heat-detail-body');

    let thumbHtml = '';
    if (item.hasImage) {
      const blob = await Storage.getImage('heat_' + item.id);
      if (blob) thumbHtml = `<img src="${URL.createObjectURL(blob)}" style="width:100%;height:200px;object-fit:cover;border-radius:16px;margin-bottom:16px">`;
    }

    const methodsHtml = (item.methods || []).map(m => {
      const hm = HEAT_METHODS.find(x => x.id === m.methodId);
      if (!hm) return '';
      return `
        <div class="heat-method-card">
          <div class="heat-method-icon">${hm.icon}</div>
          <div class="heat-method-info">
            <div class="heat-method-name">${hm.label}</div>
            <div class="heat-method-val">${m.temp} ${hm.unit} · ${m.duration} dakika</div>
            ${m.note ? `<div class="heat-method-note">${m.note}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      ${thumbHtml}
      <h2 style="font-family:var(--header-font);font-size:22px;margin-bottom:8px">${item.name}</h2>
      ${item.brand ? `<div style="font-size:13px;color:#888;margin-bottom:16px">${item.brand}</div>` : ''}
      ${item.notes ? `<div class="note-box" style="border-left-color:#6c5ce7"><div class="note-label">📝 Notlar</div><p class="note-text">${item.notes}</p></div>` : ''}
      <div class="section-title" style="color:#6c5ce7;margin-bottom:10px">🌡️ Isıtma Yöntemleri</div>
      <div class="heat-methods-list">${methodsHtml}</div>
      <div class="action-row" style="margin-top:20px">
        <button class="edit-btn" style="background:#6c5ce7" onclick="HeatForm.openEdit(${item.id})">✏️ Düzenle</button>
        <button class="delete-btn" onclick="App.openHeatDeleteModal(${item.id})">🗑️</button>
      </div>
    `;
  }

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return {
    recipeList, detail,
    showToolPopup, closeToolPopup,
    _addAlt, _deleteAlt,
    startCookMode, cookNext, cookPrev, closeCookMode,
    changePortion,
    heatList, heatDetail,
  };
})();
