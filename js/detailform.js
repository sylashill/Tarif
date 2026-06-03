// ============================================================
// detailform.js — Detaylı tarif editörü (sekmeli, banner, bloklar)
//
// Veri modeli:
// recipe = {
//   type:'detailed',
//   name, image, color, hasImage, imgLibId,
//   entryTheme:'gold',
//   subtitle, servings, duration, difficulty, calories, sourceLink,
//   categories:[], ingTags:[],
//   tabs:[ { id, title, icon, blocks:[ Block ] } ],
//   alternatives:[ {emoji,text} ],
//   addedAt, isDraft
// }
// Block tipleri:
//  {type:'ingredients', title, items:[{amount,name,note}]}
//  {type:'steps', items:[{title,text,box:{type,text}}]}
//  {type:'box', boxType:'tip'|'warn'|'ok', text}
//  {type:'text', text}
//  {type:'layers', items:[{name,note}]}
//  {type:'mini', title, sub, items:[{amount,name}]}
// ============================================================

const DetailForm = (() => {

  let _editingId = null;
  let _d = {};            // tüm detaylı veri
  let _activeTab = 0;     // editörde aktif sekme
  let _selectedImage = null;
  let _selectedImgId = null;

  function _blank() {
    return {
      type:'detailed',
      name:'', subtitle:'',
      image:'🍽️', color:COLORS[0], hasImage:false, imgLibId:null,
      entryTheme:'gold',
      servings:2, duration:'', difficulty:'Orta', calories:'', sourceLink:'',
      categories:[], ingTags:[],
      tabs:[ { id:_uid(), title:'Ana Tarif', icon:'🍽️', blocks:[] } ],
      alternatives:[],
    };
  }
  function _uid(){ return 'x'+Math.random().toString(36).slice(2,9); }

  // ---------- Aç ----------
  function openAdd() {
    _editingId = null;
    _d = _blank();
    _activeTab = 0;
    _selectedImage = null; _selectedImgId = null;
    App.showView('detail-form');
    _render();
  }

  function openEdit(id) {
    const r = App.getRecipeById(id);
    if (!r || r.type !== 'detailed') return;
    _editingId = id;
    _d = JSON.parse(JSON.stringify(r));
    if (!_d.tabs || !_d.tabs.length) _d.tabs = [{ id:_uid(), title:'Ana Tarif', icon:'🍽️', blocks:[] }];
    if (!_d.alternatives) _d.alternatives = [];
    _activeTab = 0;
    _selectedImage = null; _selectedImgId = r.imgLibId || null;
    App.showView('detail-form');
    _render();
  }

  function cancel() {
    if (_editingId) App.openDetail(_editingId);
    else App.showPage('recipes');
  }

  // ============ RENDER ============
  function _render() {
    const el = document.getElementById('detail-form-body');
    if (!el) return;
    el.innerHTML = `
      ${_renderHeaderSection()}
      ${_renderTabsBar()}
      <div id="dtab-content">${_renderActiveTab()}</div>
      ${_renderAlternatives()}
      ${_renderMetaSection()}
      <button class="save-btn" style="background:var(--accent);margin-top:20px" onclick="DetailForm.save(false)">Detaylı Tarifi Kaydet ✓</button>
      <button class="add-step-btn" style="margin-top:10px" onclick="DetailForm.save(true)">📋 Taslak Olarak Kaydet</button>
    `;
    _afterRender();
  }

  function _renderHeaderSection() {
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🍽️</span><span class="form-section-title">Başlık & Banner</span></div>
        <label class="form-label">Tarif Adı</label>
        <input class="form-input" value="${_esc(_d.name)}" oninput="DetailForm._set('name',this.value)" placeholder="örn: Tiftik Dana Burger">
        <label class="form-label" style="margin-top:10px">Alt Başlık</label>
        <input class="form-input" value="${_esc(_d.subtitle)}" oninput="DetailForm._set('subtitle',this.value)" placeholder="örn: Evde restoran kalitesinde">

        <label class="form-label" style="margin-top:12px">Banner Fotoğraf</label>
        <div class="img-picker-area" onclick="document.getElementById('df-img-input').click()">
          <div id="df-img-preview">
            <div style="font-size:42px">🖼️</div>
            <div class="img-picker-text">Banner fotoğrafı seç</div>
          </div>
        </div>
        <input type="file" id="df-img-input" accept="image/*" style="display:none" onchange="DetailForm._onImage(this)">
        ${(_selectedImage||_selectedImgId)?`<button class="img-clear-btn" onclick="DetailForm._clearImage()">🗑️ Banner'ı Kaldır</button>`:''}

        <label class="form-label" style="margin-top:12px">Köşe Emoji (banner yoksa)</label>
        <div class="emoji-row">${FOOD_EMOJIS.slice(0,18).map(e=>`<button class="emoji-btn${e===_d.image?' selected':''}" onclick="DetailForm._set('image','${e}')">${e}</button>`).join('')}</div>

        <label class="form-label" style="margin-top:12px">Entry Teması</label>
        <div class="entry-theme-row">
          ${ENTRY_THEMES.map(t=>`
            <button class="entry-theme-swatch${_d.entryTheme===t.id?' selected':''}" onclick="DetailForm._set('entryTheme','${t.id}')">
              <span class="ets-circle" style="background:linear-gradient(135deg,${t.bg} 0 50%,${t.accent} 50% 100%)"></span>
              <span class="ets-label">${t.label}</span>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function _renderTabsBar() {
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📑</span><span class="form-section-title">Sekmeler</span></div>
        <div class="dtab-bar" id="dtab-bar">
          ${_d.tabs.map((t,i)=>`
            <button class="dtab-chip${i===_activeTab?' active':''}" onclick="DetailForm._switchTab(${i})">${t.icon||'📄'} ${_esc(t.title)}</button>`).join('')}
          <button class="dtab-add" onclick="DetailForm._addTab()">+ Sekme</button>
        </div>
      </div>`;
  }

  function _renderActiveTab() {
    const tab = _d.tabs[_activeTab];
    if (!tab) return '';
    return `
      <div class="form-section">
        <div class="dtab-edit-head">
          <input class="dtab-title-input" value="${_esc(tab.title)}" oninput="DetailForm._setTabTitle(this.value)" placeholder="Sekme adı">
          <input class="dtab-icon-input" value="${_esc(tab.icon)}" oninput="DetailForm._setTabIcon(this.value)" maxlength="2" placeholder="🍽️">
          ${_d.tabs.length>1?`<button class="step-del" onclick="DetailForm._delTab()">−</button>`:''}
        </div>
        <div class="dblocks" id="dblocks">${tab.blocks.map((b,bi)=>_renderBlock(b,bi)).join('')}</div>
        <div class="block-add-menu">
          ${BLOCK_TYPES.map(bt=>`<button class="block-add-btn" onclick="DetailForm._addBlock('${bt.id}')">${bt.icon} ${bt.label}</button>`).join('')}
        </div>
      </div>`;
  }

  function _renderBlock(b, bi) {
    if (b.type==='ingredients') {
      return `<div class="dblock">
        <div class="dblock-head"><span>🛒 Malzeme Grubu</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <input class="form-input" value="${_esc(b.title||'')}" oninput="DetailForm._setBlock(${bi},'title',this.value)" placeholder="Grup başlığı (örn: Sos için)">
        <div class="dblock-items">
          ${(b.items||[]).map((it,ii)=>`
            <div class="ing-row3">
              <input class="ing-amount" value="${_esc(it.amount||'')}" oninput="DetailForm._setItem(${bi},${ii},'amount',this.value)" placeholder="Miktar">
              <input class="ing-name" value="${_esc(it.name||'')}" oninput="DetailForm._setItem(${bi},${ii},'name',this.value)" placeholder="Malzeme">
              <button class="step-del" onclick="DetailForm._delItem(${bi},${ii})">−</button>
            </div>
            <input class="ing-note-input" value="${_esc(it.note||'')}" oninput="DetailForm._setItem(${bi},${ii},'note',this.value)" placeholder="Not (opsiyonel, örn: ince kıyılmış)">
          `).join('')}
        </div>
        <button class="add-step-btn" onclick="DetailForm._addItem(${bi})">+ Malzeme</button>
        <button class="bulk-paste-btn" style="margin-top:6px;width:100%" onclick="DetailForm._bulkToBlock(${bi})">📋 Toplu Yapıştır</button>
      </div>`;
    }
    if (b.type==='steps') {
      return `<div class="dblock">
        <div class="dblock-head"><span>👨‍🍳 Adımlar</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <div class="dblock-items">
          ${(b.items||[]).map((it,ii)=>`
            <div class="dstep-edit">
              <div class="dstep-edit-top">
                <span class="step-num-badge" style="background:var(--accent)">${ii+1}</span>
                <input class="form-input" value="${_esc(it.title||'')}" oninput="DetailForm._setItem(${bi},${ii},'title',this.value)" placeholder="Adım başlığı (opsiyonel)">
                <button class="step-del" onclick="DetailForm._delItem(${bi},${ii})">−</button>
              </div>
              <textarea class="form-textarea" rows="2" oninput="DetailForm._setItem(${bi},${ii},'text',this.value)" placeholder="Adım açıklaması">${_esc(it.text||'')}</textarea>
              ${it.box ? `
                <div class="dstep-box-edit">
                  <div class="box-type-row">
                    ${BOX_TYPES.map(bt=>`<button class="box-type-btn${(it.box.type||'tip')===bt.id?' active':''}" onclick="DetailForm._setStepBox(${bi},${ii},'type','${bt.id}')">${bt.icon} ${bt.label}</button>`).join('')}
                    <button class="step-del" onclick="DetailForm._removeStepBox(${bi},${ii})">−</button>
                  </div>
                  <textarea class="form-textarea" rows="2" oninput="DetailForm._setStepBox(${bi},${ii},'text',this.value)" placeholder="Kutu metni (ipucu/uyarı/not)">${_esc(it.box.text||'')}</textarea>
                </div>`
              : `<button class="add-stepbox-btn" onclick="DetailForm._addStepBox(${bi},${ii})">+ Bu adıma kutu ekle</button>`}
            </div>`).join('')}
        </div>
        <button class="add-step-btn" onclick="DetailForm._addItem(${bi})">+ Adım Ekle</button>
      </div>`;
    }
    if (b.type==='box') {
      return `<div class="dblock">
        <div class="dblock-head"><span>💬 Kutu</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <div class="box-type-row">
          ${BOX_TYPES.map(bt=>`<button class="box-type-btn${(b.boxType||'tip')===bt.id?' active':''}" onclick="DetailForm._setBlock(${bi},'boxType','${bt.id}')">${bt.icon} ${bt.label}</button>`).join('')}
        </div>
        <textarea class="form-textarea" rows="3" oninput="DetailForm._setBlock(${bi},'text',this.value)" placeholder="Kutu metni...">${_esc(b.text||'')}</textarea>
      </div>`;
    }
    if (b.type==='text') {
      return `<div class="dblock">
        <div class="dblock-head"><span>📝 Serbest Metin</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <textarea class="form-textarea" rows="4" oninput="DetailForm._setBlock(${bi},'text',this.value)" placeholder="Metin...">${_esc(b.text||'')}</textarea>
      </div>`;
    }
    if (b.type==='layers') {
      return `<div class="dblock">
        <div class="dblock-head"><span>🍔 Katman Sırası</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <input class="form-input" value="${_esc(b.title||'')}" oninput="DetailForm._setBlock(${bi},'title',this.value)" placeholder="Başlık (örn: Katman Sıralaması)">
        <div class="dblock-items">
          ${(b.items||[]).map((it,ii)=>`
            <div class="ing-row3">
              <input class="ing-name" value="${_esc(it.name||'')}" oninput="DetailForm._setItem(${bi},${ii},'name',this.value)" placeholder="Katman">
              <input class="ing-note-input" style="flex:1" value="${_esc(it.note||'')}" oninput="DetailForm._setItem(${bi},${ii},'note',this.value)" placeholder="Not">
              <button class="step-del" onclick="DetailForm._delItem(${bi},${ii})">−</button>
            </div>`).join('')}
        </div>
        <button class="add-step-btn" onclick="DetailForm._addItem(${bi})">+ Katman</button>
      </div>`;
    }
    if (b.type==='mini') {
      return `<div class="dblock">
        <div class="dblock-head"><span>🥄 Mini Tarif</span><button class="step-del" onclick="DetailForm._delBlock(${bi})">−</button></div>
        <input class="form-input" value="${_esc(b.title||'')}" oninput="DetailForm._setBlock(${bi},'title',this.value)" placeholder="Mini tarif adı (örn: Hızlı Burger Sosu)">
        <input class="form-input" style="margin-top:6px" value="${_esc(b.sub||'')}" oninput="DetailForm._setBlock(${bi},'sub',this.value)" placeholder="Alt açıklama (örn: 3 dakikada hazır)">
        <div class="dblock-items">
          ${(b.items||[]).map((it,ii)=>`
            <div class="ing-row3">
              <input class="ing-amount" value="${_esc(it.amount||'')}" oninput="DetailForm._setItem(${bi},${ii},'amount',this.value)" placeholder="Miktar">
              <input class="ing-name" value="${_esc(it.name||'')}" oninput="DetailForm._setItem(${bi},${ii},'name',this.value)" placeholder="Malzeme">
              <button class="step-del" onclick="DetailForm._delItem(${bi},${ii})">−</button>
            </div>`).join('')}
        </div>
        <button class="add-step-btn" onclick="DetailForm._addItem(${bi})">+ Malzeme</button>
      </div>`;
    }
    return '';
  }

  function _renderAlternatives() {
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🔄</span><span class="form-section-title">Alternatifler</span></div>
        <div class="form-hint-text" style="margin-bottom:8px">"Aynı malzemeyle başka ne yapılır?" gibi alternatifler.</div>
        <div id="alt-list">
          ${_d.alternatives.map((a,i)=>`
            <div class="ing-row3">
              <input class="dtab-icon-input" value="${_esc(a.emoji||'')}" oninput="DetailForm._setAlt(${i},'emoji',this.value)" maxlength="2" placeholder="🍔">
              <input class="ing-name" value="${_esc(a.text||'')}" oninput="DetailForm._setAlt(${i},'text',this.value)" placeholder="Alternatif (örn: Pilav üstü et)">
              <button class="step-del" onclick="DetailForm._delAlt(${i})">−</button>
            </div>`).join('')}
        </div>
        <button class="add-step-btn" onclick="DetailForm._addAlt()">+ Alternatif</button>
      </div>`;
  }

  function _renderMetaSection() {
    const allCats=[...DEFAULT_RECIPE_CATS,...Storage.getCustomCats()];
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">ℹ️</span><span class="form-section-title">Detaylar</span></div>
        <div class="row2">
          <div><label class="form-label">Süre</label><input class="form-input" value="${_esc(_d.duration)}" oninput="DetailForm._set('duration',this.value)" placeholder="45 dk"></div>
          <div><label class="form-label">Kaç Kişilik</label><input class="form-input" type="number" min="1" value="${_d.servings}" oninput="DetailForm._set('servings',this.value)"></div>
        </div>
        <div class="row2" style="margin-top:10px">
          <div><label class="form-label">Zorluk</label><select class="form-select" onchange="DetailForm._set('difficulty',this.value)">${DIFFICULTY.map(x=>`<option${x===_d.difficulty?' selected':''}>${x}</option>`).join('')}</select></div>
          <div><label class="form-label">Kalori</label><input class="form-input" value="${_esc(_d.calories)}" oninput="DetailForm._set('calories',this.value)" placeholder="kcal"></div>
        </div>
        <label class="form-label" style="margin-top:10px">Kaynak Linki</label>
        <input class="form-input" type="url" value="${_esc(_d.sourceLink)}" oninput="DetailForm._set('sourceLink',this.value)" placeholder="https://...">
      </div>

      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📂</span><span class="form-section-title">Kategoriler</span></div>
        <div class="cat-multi" id="df-cat-multi">
          ${allCats.map(c=>`<button class="cat-opt${_d.categories.includes(c)?' selected':''}" onclick="DetailForm._toggleCat('${_esc(c)}')">${c}</button>`).join('')}
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🏷️</span><span class="form-section-title">Malzeme Etiketleri</span></div>
        <div id="df-tag-suggest">${_renderTagSuggest()}</div>
        <div id="df-tags" style="margin-top:8px">${_renderTags()}</div>
        <div class="tag-browse-toggle" onclick="DetailForm._toggleTagBrowser()">＋ Listeden etiket seç</div>
        <div id="df-tag-browser" class="tag-browser" style="display:none"></div>
      </div>`;
  }

  // Tüm malzeme bloklarındaki adlardan akıllı etiket önerisi
  function _collectIngredientNames() {
    const names=[];
    (_d.tabs||[]).forEach(tab=>(tab.blocks||[]).forEach(b=>{
      if(b.type==='ingredients'||b.type==='mini'){
        (b.items||[]).forEach(it=>{ if(it.name) names.push(it.name.toLowerCase().trim()); });
      }
    }));
    return names;
  }
  function _computeSuggestions() {
    const all=Settings.getAllIngredients();
    const names=_collectIngredientNames();
    const found=new Set();
    names.forEach(name=>{
      const nameWords=_tok(name);
      all.forEach(tag=>{
        const tl=tag.toLowerCase();
        if(_d.ingTags.includes(tag))return;
        if(name===tl){found.add(tag);return;}
        const tw=_tok(tl);
        const allPresent=tw.every(x=>nameWords.includes(x));
        if(allPresent){ if(tw.length===1||tw.some(x=>x.length>=3))found.add(tag); }
      });
    });
    return [...found].slice(0,12);
  }
  function _tok(str){return str.toLowerCase().replace(/[.,;:()]/g,' ').split(/\s+/).map(w=>w.trim()).filter(Boolean);}
  function _renderTagSuggest() {
    const sugg=_computeSuggestions();
    if(!sugg.length)return '';
    return `<div class="tag-suggest-label">Malzemelerden önerilenler (eklemek için dokun)</div>
      <div class="tag-cloud">${sugg.map(t=>`<span class="tag-chip suggested" onclick="DetailForm._addTag('${_esc(t)}')">+ ${t}</span>`).join('')}</div>`;
  }
  function _addTag(t){ if(!_d.ingTags.includes(t))_d.ingTags.push(t); _patchTags(); _patchTagSuggest(); }
  function _patchTagSuggest(){ const e=document.getElementById('df-tag-suggest'); if(e)e.innerHTML=_renderTagSuggest(); }

  function _renderTags() {
    return `<div class="tag-cloud">
      ${_d.ingTags.map((t,i)=>`<span class="tag-chip confirmed">${t}<button class="tag-del" onclick="DetailForm._removeTag(${i})">×</button></span>`).join('')}
      ${!_d.ingTags.length?'<span class="tag-empty">Henüz etiket yok</span>':''}
    </div>`;
  }
  function _renderTagBrowser() {
    const groups=Settings.getIngTags();
    return Object.entries(groups).map(([cat,tags])=>`
      <div class="tag-browse-cat"><div class="tag-browse-cat-label">${cat}</div>
        <div class="tag-cloud">${tags.map(t=>`<span class="tag-chip ${_d.ingTags.includes(t)?'confirmed':'browse'}" onclick="DetailForm._toggleTag('${_esc(t)}')">${_d.ingTags.includes(t)?'✓ ':''}${t}</span>`).join('')}</div>
      </div>`).join('');
  }

  // ============ STATE ============
  function _set(k,v){ _d[k]=v; if(k==='entryTheme'||k==='image'){_render();} }
  function _switchTab(i){ _activeTab=i; _patchTabContent(); _patchTabBar(); }
  function _addTab(){ _d.tabs.push({id:_uid(),title:'Yeni Sekme',icon:'📄',blocks:[]}); _activeTab=_d.tabs.length-1; _render(); }
  function _delTab(){ if(_d.tabs.length>1){_d.tabs.splice(_activeTab,1); _activeTab=Math.max(0,_activeTab-1); _render();} }
  function _setTabTitle(v){ _d.tabs[_activeTab].title=v; _patchTabBar(); }
  function _setTabIcon(v){ _d.tabs[_activeTab].icon=v; _patchTabBar(); }
  function _patchTabBar(){ const e=document.getElementById('dtab-bar'); if(e){ const tmp=document.createElement('div'); tmp.innerHTML=_renderTabsBar(); e.outerHTML=tmp.querySelector('#dtab-bar').outerHTML; } }
  function _patchTabContent(){ const e=document.getElementById('dtab-content'); if(e)e.innerHTML=_renderActiveTab(); }

  function _addBlock(type){
    const tab=_d.tabs[_activeTab];
    const block={type};
    if(type==='ingredients'){block.title='';block.items=[{amount:'',name:'',note:''}];}
    if(type==='steps'){block.items=[{title:'',text:''}];}
    if(type==='box'){block.boxType='tip';block.text='';}
    if(type==='text'){block.text='';}
    if(type==='layers'){block.title='';block.items=[{name:'',note:''}];}
    if(type==='mini'){block.title='';block.sub='';block.items=[{amount:'',name:''}];}
    tab.blocks.push(block);
    _patchTabContent();
  }
  function _delBlock(bi){ _d.tabs[_activeTab].blocks.splice(bi,1); _patchTabContent(); }
  function _setBlock(bi,k,v){ _d.tabs[_activeTab].blocks[bi][k]=v; if(k==='boxType')_patchTabContent(); }
  function _addItem(bi){
    const b=_d.tabs[_activeTab].blocks[bi];
    if(!b.items)b.items=[];
    if(b.type==='steps')b.items.push({title:'',text:''});
    else if(b.type==='layers')b.items.push({name:'',note:''});
    else b.items.push({amount:'',name:'',note:''});
    _patchTabContent();
  }
  function _setItem(bi,ii,k,v){ _d.tabs[_activeTab].blocks[bi].items[ii][k]=v; }
  function _delItem(bi,ii){ _d.tabs[_activeTab].blocks[bi].items.splice(ii,1); _patchTabContent(); }

  // Adım içi kutu (ipucu/uyarı/not)
  function _addStepBox(bi,ii){ _d.tabs[_activeTab].blocks[bi].items[ii].box={type:'tip',text:''}; _patchTabContent(); }
  function _removeStepBox(bi,ii){ delete _d.tabs[_activeTab].blocks[bi].items[ii].box; _patchTabContent(); }
  function _setStepBox(bi,ii,k,v){
    const it=_d.tabs[_activeTab].blocks[bi].items[ii];
    if(!it.box)it.box={type:'tip',text:''};
    it.box[k]=v;
    if(k==='type')_patchTabContent();
  }

  function _bulkToBlock(bi){
    const text=prompt('Her satıra bir malzeme yapıştır:');
    if(!text)return;
    const b=_d.tabs[_activeTab].blocks[bi];
    const lines=text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    lines.forEach(l=>{
      const p=_smartParseLine(l);
      b.items.push({amount:p.amount,name:p.name,note:''});
    });
    b.items=b.items.filter(it=>it.name);
    _patchTabContent();
  }
  // Basit parse (form.js'deki ile aynı mantık)
  function _smartParseLine(str){
    str=str.replace(/^[-•*–·\s]+/,'').trim();
    const lower=str.toLowerCase();
    const units=(typeof MEASURE_UNITS!=='undefined'?MEASURE_UNITS:[]).slice().sort((a,b)=>b.length-a.length);
    const qty=(typeof QUANTITY_WORDS!=='undefined'?QUANTITY_WORDS:[]);
    const nm=str.match(/^([\d]+[.,]?[\d]*|½|¼|¾|⅓|⅔)\s*/);
    if(nm){let rest=str.slice(nm[0].length);const rl=rest.toLowerCase();
      for(const u of units){if(rl.startsWith(u+' ')||rl===u)return{amount:(nm[1]+' '+u).trim(),name:rest.slice(u.length).trim()||u};}
      return{amount:nm[1].trim(),name:rest.trim()};}
    for(const q of qty){if(lower.startsWith(q+' ')){let rest=str.slice(q.length).trim();const rl=rest.toLowerCase();
      for(const u of units){if(rl.startsWith(u+' ')||rl===u)return{amount:(q+' '+u).trim(),name:rest.slice(u.length).trim()||u};}
      return{amount:q,name:rest};}}
    return{amount:'',name:str};
  }

  function _addAlt(){ _d.alternatives.push({emoji:'🍽️',text:''}); _patchAlt(); }
  function _delAlt(i){ _d.alternatives.splice(i,1); _patchAlt(); }
  function _setAlt(i,k,v){ _d.alternatives[i][k]=v; }
  function _patchAlt(){ const e=document.getElementById('alt-list'); if(e)e.innerHTML=_d.alternatives.map((a,i)=>`
    <div class="ing-row3">
      <input class="dtab-icon-input" value="${_esc(a.emoji||'')}" oninput="DetailForm._setAlt(${i},'emoji',this.value)" maxlength="2" placeholder="🍔">
      <input class="ing-name" value="${_esc(a.text||'')}" oninput="DetailForm._setAlt(${i},'text',this.value)" placeholder="Alternatif">
      <button class="step-del" onclick="DetailForm._delAlt(${i})">−</button>
    </div>`).join(''); }

  function _toggleCat(c){
    const i=_d.categories.indexOf(c);
    if(i>=0)_d.categories.splice(i,1); else _d.categories.push(c);
    document.querySelectorAll('#df-cat-multi .cat-opt').forEach(b=>b.classList.toggle('selected',_d.categories.includes(b.textContent.trim())));
  }
  function _toggleTag(t){ const i=_d.ingTags.indexOf(t); if(i>=0)_d.ingTags.splice(i,1); else _d.ingTags.push(t); _patchTags(); _patchTagBrowser(); _patchTagSuggest(); }
  function _removeTag(i){ _d.ingTags.splice(i,1); _patchTags(); _patchTagBrowser(); _patchTagSuggest(); }
  function _patchTags(){ const e=document.getElementById('df-tags'); if(e)e.innerHTML=_renderTags(); }
  function _patchTagBrowser(){ const e=document.getElementById('df-tag-browser'); if(e&&e.style.display!=='none')e.innerHTML=_renderTagBrowser(); }
  function _toggleTagBrowser(){ const e=document.getElementById('df-tag-browser'); if(!e)return; if(e.style.display==='none'){e.innerHTML=_renderTagBrowser();e.style.display='block';}else e.style.display='none'; }

  // ---- Görsel ----
  function _onImage(input){
    const f=input.files[0]; if(!f)return;
    _selectedImage=f; _selectedImgId=null;
    const w=document.getElementById('df-img-preview');
    if(w)w.innerHTML=`<img src="${URL.createObjectURL(f)}" style="width:100%;height:150px;object-fit:cover;border-radius:10px">`;
    _render();
  }
  function _clearImage(){ _selectedImage=null; _selectedImgId=null; _render(); }

  function _afterRender(){
    if(_selectedImage){
      const w=document.getElementById('df-img-preview');
      if(w)w.innerHTML=`<img src="${URL.createObjectURL(_selectedImage)}" style="width:100%;height:150px;object-fit:cover;border-radius:10px">`;
    }else if(_selectedImgId){
      Storage.getImage(_selectedImgId).then(blob=>{ if(!blob)return; const w=document.getElementById('df-img-preview'); if(w)w.innerHTML=`<img src="${URL.createObjectURL(blob)}" style="width:100%;height:150px;object-fit:cover;border-radius:10px">`; });
    }
  }

  // ============ KAYDET ============
  async function save(isDraft){
    const name=(_d.name||'').trim();
    if(!name && !isDraft){ App.showToast('⚠️ Tarif adı gerekli'); return; }
    const id=_editingId||Date.now();
    let hasImage=false;
    if(_selectedImage){
      await Storage.saveImage(id,_selectedImage);
      const lib=Storage.getImgLib();
      if(!lib.find(x=>x.id===String(id))){lib.unshift({id:String(id),name:name||'Görsel',addedAt:Date.now()});Storage.saveImgLib(lib);}
      hasImage=true;
    }else if(_selectedImgId){
      const blob=await Storage.getImage(_selectedImgId);
      if(blob){await Storage.saveImage(id,blob);hasImage=true;}
    }else if(_editingId){
      hasImage=App.getRecipeById(_editingId)?.hasImage||false;
    }

    const recipe={
      ..._d,
      id, type:'detailed',
      name:name||'İsimsiz Tarif',
      servings:parseInt(_d.servings)||2,
      categories:_d.categories.length?_d.categories:['Genel'],
      hasImage, imgLibId:_selectedImgId||null, isDraft:!!isDraft,
      addedAt:_editingId?(App.getRecipeById(_editingId)?.addedAt||Date.now()):id,
    };
    let recipes=Storage.getRecipes();
    if(_editingId)recipes=recipes.map(r=>r.id===_editingId?recipe:r);
    else recipes.unshift(recipe);
    Storage.saveRecipes(recipes);
    App.showToast(isDraft?'📋 Taslak kaydedildi':'✅ Detaylı tarif kaydedildi!');
    App.openDetail(id);
  }

  function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  return {
    openAdd, openEdit, cancel, save,
    _set, _switchTab, _addTab, _delTab, _setTabTitle, _setTabIcon,
    _addBlock, _delBlock, _setBlock, _addItem, _setItem, _delItem, _bulkToBlock,
    _addStepBox, _removeStepBox, _setStepBox,
    _addAlt, _delAlt, _setAlt,
    _toggleCat, _toggleTag, _addTag, _removeTag, _toggleTagBrowser,
    _onImage, _clearImage,
  };
})();
