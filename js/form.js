// ============================================================
// form.js — Tarif ekleme / düzenleme formu (yeniden yazıldı)
//
// Mimari:
//  • Tüm alan değerleri DAİMA _fd'de tutulur (tek doğruluk kaynağı)
//  • Her input oninput → _fd'ye canlı yazar (veri kaybı imkansız)
//  • Sayfa geçişinde tüm sayfa render, _fd'den beslenir
//  • Adım/etiket/kategori değişiminde SADECE ilgili bölüm patch'lenir
// ============================================================

const Form = (() => {

  let _editingId   = null;
  let _formPage    = 0;
  const PAGES = ['Tarif Bilgisi','Fotoğraf','Kategori & Etiketler'];

  let _selectedEmoji = '🍽️';
  let _selectedColor = COLORS[0];
  let _selectedImage = null;
  let _selectedImgId = null;

  let _fd = {};

  function _blankData() {
    return {
      name:'', story:'', notes:'',
      duration:'', servings:2, difficulty:'Orta', calories:'', sourceLink:'',
      ingredients:[{amount:'',name:''}],
      stepsMode:'list', stepsText:'', steps:['',''],
      categories:[], tags:[],
    };
  }

  function openAdd() {
    _editingId = null;
    _fd = _blankData();
    _selectedEmoji='🍽️'; _selectedColor=COLORS[0];
    _selectedImage=null; _selectedImgId=null;
    _formPage=0; _show();
  }

  function openEdit(id) {
    const r = App.getRecipeById(id);
    if (!r) return;
    _editingId=id; _fd=_blankData();
    _fd.name=r.name||''; _fd.story=r.story||''; _fd.notes=r.notes||'';
    _fd.duration=r.duration||''; _fd.servings=r.servings||2;
    _fd.difficulty=r.difficulty||'Orta'; _fd.calories=r.calories||''; _fd.sourceLink=r.sourceLink||'';
    _fd.ingredients=(r.ingredients||[]).map(_parseIngredient);
    if(!_fd.ingredients.length) _fd.ingredients=[{amount:'',name:''}];
    _fd.stepsMode=r.stepsMode||'list'; _fd.stepsText=r.stepsText||'';
    _fd.steps=(r.stepsArray&&r.stepsArray.length)?[...r.stepsArray]:[''];
    _fd.categories=[...(r.categories||[])]; _fd.tags=[...(r.ingTags||[])];
    _selectedEmoji=r.image||'🍽️'; _selectedColor=r.color||COLORS[0];
    _selectedImgId=r.imgLibId||null; _selectedImage=null;
    _formPage=0; _show();
  }

  function cancel() {
    if (_editingId) App.openDetail(_editingId);
    else App.showPage('recipes');
  }

  function _show() {
    App.showView('form');
    const t = document.getElementById('form-title-text');
    if (t) t.textContent = _editingId ? 'Tarifi Düzenle' : 'Yeni Tarif';
    _renderPage();
  }

  // Akıllı malzeme ayrıştırma: miktar+birim ↔ malzeme adı
  function _parseIngredient(i) {
    if (typeof i === 'object' && i !== null) return { amount:i.amount||'', name:i.name||'' };
    return _smartParse(String(i).trim());
  }

  // Tek satırı miktar/birim ve isim olarak akıllı ayır
  // "1.5 yemek kaşığı zeytinyağı" → {amount:"1.5 yemek kaşığı", name:"zeytinyağı"}
  // "2 su bardağı un"             → {amount:"2 su bardağı", name:"un"}
  // "yarım limon"                 → {amount:"yarım", name:"limon"}
  // "3 diş sarımsak"              → {amount:"3 diş", name:"sarımsak"}
  // "tuz"                         → {amount:"", name:"tuz"}
  function _smartParse(str) {
    str = str.replace(/^[-•*–·\s]+/, '').trim(); // baştaki madde işaretlerini temizle
    if (!str) return { amount:'', name:'' };

    const lower = str.toLowerCase();
    const units = (typeof MEASURE_UNITS !== 'undefined' ? MEASURE_UNITS : [])
      .slice().sort((a,b)=>b.length-a.length); // uzun birimler önce ("su bardağı" > "bardağı")
    const qtyWords = (typeof QUANTITY_WORDS !== 'undefined' ? QUANTITY_WORDS : []);

    // 1) Sayı (1, 1.5, 1,5, ½ vb.) ile başlıyor mu?
    const numMatch = str.match(/^([\d]+[.,]?[\d]*|½|¼|¾|⅓|⅔)\s*/);
    if (numMatch) {
      let rest = str.slice(numMatch[0].length);
      const restLow = rest.toLowerCase();
      // Sayıdan sonra birim geliyor mu?
      for (const u of units) {
        if (restLow.startsWith(u + ' ') || restLow === u) {
          const name = rest.slice(u.length).trim();
          return { amount: (numMatch[1] + ' ' + u).trim(), name: name || u };
        }
      }
      // Birim yok ama sayı var: "2 yumurta" → amount:"2", name:"yumurta"
      return { amount: numMatch[1].trim(), name: rest.trim() };
    }

    // 2) "yarım / birkaç / bir" gibi miktar kelimesiyle başlıyor mu?
    for (const q of qtyWords) {
      if (lower.startsWith(q + ' ')) {
        let rest = str.slice(q.length).trim();
        const restLow = rest.toLowerCase();
        for (const u of units) {
          if (restLow.startsWith(u + ' ') || restLow === u) {
            const name = rest.slice(u.length).trim();
            return { amount: (q + ' ' + u).trim(), name: name || u };
          }
        }
        return { amount: q, name: rest };
      }
    }

    // 3) Hiç miktar yok — tamamı malzeme adı
    return { amount:'', name: str };
  }

  // Toplu metni satır satır ayrıştır
  function _bulkParse(text) {
    return text.split(/\n+/).map(l => l.trim()).filter(Boolean).map(_smartParse).filter(i => i.name);
  }

  function _ingStr(ing){ return ing.amount ? `${ing.amount} ${ing.name}` : ing.name; }

  // ============ RENDER ============
  function _renderPage() {
    _renderProgress();
    const el = document.getElementById('form-page-body');
    if (!el) return;
    if (_formPage===0) el.innerHTML=_page0();
    if (_formPage===1) el.innerHTML=_page1();
    if (_formPage===2) el.innerHTML=_page2();
    _afterRender();
    _renderFooter();
  }

  function _renderProgress() {
    const wrap = document.getElementById('form-progress');
    if (!wrap) return;
    wrap.innerHTML = `<div class="form-progress-bar">
      ${PAGES.map((p,i)=>{
        const cls = i<_formPage?'done':(i===_formPage?'active':'');
        return `<div class="fpb-step ${cls}" onclick="Form._goPage(${i})">
          <div class="fpb-dot">${i<_formPage?'✓':i+1}</div>
          <div class="fpb-label">${p}</div>
        </div>${i<PAGES.length-1?`<div class="fpb-line ${i<_formPage?'done':''}"></div>`:''}`;
      }).join('')}
    </div>`;
  }

  function _renderFooter() {
    const set=(id,s)=>{const e=document.getElementById(id);if(e)e.style.display=s?'flex':'none';};
    set('form-prev-btn', _formPage>0);
    set('form-next-btn', _formPage<PAGES.length-1);
    set('form-save-btn', _formPage===PAGES.length-1);
    set('form-draft-btn', true);
  }

  // ---- Sayfa 0 ----
  function _page0() {
    const d=_fd;
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🍽️</span><span class="form-section-title">Tarif Adı</span></div>
        <input class="form-input" id="f-name" placeholder="Tarif adı gir..." value="${_esc(d.name)}" oninput="Form._set('name',this.value)">
        <div class="form-hint-text">Dikkat çekici bir isim daha çok ilgi görür</div>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📖</span><span class="form-section-title">Tarif Hikayesi</span></div>
        <div class="story-hint">Malzeme ve hazırlanış dışında eklemek istediklerin.</div>
        <textarea class="form-textarea" id="f-story" rows="3" placeholder="İsteğe bağlı..." oninput="Form._set('story',this.value)">${_esc(d.story)}</textarea>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🛒</span><span class="form-section-title">Malzemeler</span></div>
        <div class="ing-editor" id="ing-editor">${_renderIngRows()}</div>
        <div class="ing-btn-row">
          <button class="add-step-btn" onclick="Form._addIngRow()">+ Malzeme Ekle</button>
          <button class="bulk-paste-btn" onclick="Form._openBulkPaste()">📋 Toplu Yapıştır</button>
        </div>
        <div class="form-hint-text" style="margin-top:6px">Miktar opsiyonel. Yazdıkça uygun etiketler önerilir.</div>
        <div id="tag-suggest-area" style="margin-top:10px">${_renderTagSuggest()}</div>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">👨‍🍳</span><span class="form-section-title">Hazırlanış</span></div>
        <div class="steps-mode-toggle">
          <button class="steps-mode-btn${d.stepsMode==='list'?' active':''}" onclick="Form._setStepsMode('list')">📋 Adım Adım</button>
          <button class="steps-mode-btn${d.stepsMode==='single'?' active':''}" onclick="Form._setStepsMode('single')">📝 Tek Metin</button>
        </div>
        <div id="steps-editor" style="margin-top:10px">${_renderStepsEditor()}</div>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📝</span><span class="form-section-title">Notlarım</span></div>
        <textarea class="form-textarea" id="f-notes" rows="3" placeholder="Püf noktaları, tavsiyeler..." oninput="Form._set('notes',this.value)">${_esc(d.notes)}</textarea>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">ℹ️</span><span class="form-section-title">Detaylar</span></div>
        <div class="row2">
          <div><label class="form-label">Süre</label><input class="form-input" id="f-duration" placeholder="30 dk" value="${_esc(d.duration)}" oninput="Form._set('duration',this.value)"></div>
          <div><label class="form-label">Kaç Kişilik</label><input class="form-input" type="number" min="1" value="${d.servings}" oninput="Form._set('servings',this.value)"></div>
        </div>
        <div class="row2" style="margin-top:10px">
          <div><label class="form-label">Zorluk</label><select class="form-select" onchange="Form._set('difficulty',this.value)">${DIFFICULTY.map(x=>`<option${x===d.difficulty?' selected':''}>${x}</option>`).join('')}</select></div>
          <div><label class="form-label">Kalori</label><input class="form-input" placeholder="kcal" value="${_esc(d.calories)}" oninput="Form._set('calories',this.value)"></div>
        </div>
        <label class="form-label" style="margin-top:10px">Kaynak Linki</label>
        <input class="form-input" type="url" placeholder="https://..." value="${_esc(d.sourceLink)}" oninput="Form._set('sourceLink',this.value)">
      </div>`;
  }

  function _renderIngRows() {
    if (!_fd.ingredients.length) _fd.ingredients=[{amount:'',name:''}];
    return _fd.ingredients.map((ing,i)=>`
      <div class="ing-row">
        <input class="ing-amount" placeholder="Miktar" value="${_esc(ing.amount)}" oninput="Form._setIng(${i},'amount',this.value)">
        <input class="ing-name" placeholder="Malzeme" value="${_esc(ing.name)}" oninput="Form._setIng(${i},'name',this.value)" onblur="Form._refreshTagSuggest()">
        <button class="step-del" onclick="Form._delIngRow(${i})">−</button>
      </div>`).join('');
  }

  function _renderTagSuggest() {
    const sugg = _computeSuggestions();
    if (!sugg.length) return '';
    return `<div class="tag-suggest-label">Önerilen etiketler (eklemek için dokun)</div>
      <div class="tag-cloud">${sugg.map(t=>`<span class="tag-chip suggested" onclick="Form._addTag('${_esc(t)}')">+ ${t}</span>`).join('')}</div>`;
  }

  function _renderStepsEditor() {
    if (_fd.stepsMode==='single') {
      return `<textarea class="form-textarea" id="f-steps-single" rows="8" placeholder="Tarifi yaz... Enter ile satır arası boşluk bırakabilirsin." oninput="Form._set('stepsText',this.value)">${_esc(_fd.stepsText)}</textarea>`;
    }
    if (!_fd.steps.length) _fd.steps=[''];
    const rows=_fd.steps.map((s,i)=>`
      <div class="step-row">
        <div class="step-num-badge" style="background:var(--accent)">${i+1}</div>
        <textarea class="step-input" rows="2" placeholder="${i+1}. adım" oninput="Form._setStep(${i},this.value)">${_esc(s)}</textarea>
        <button class="step-del" onclick="Form._delStep(${i})">−</button>
      </div>`).join('');
    return `<div id="step-rows">${rows}</div>
      <div class="step-actions-row"><button class="step-action-btn primary" onclick="Form._addStep()">+ Adım Ekle</button></div>`;
  }

  // ---- Sayfa 1 ----
  function _page1() {
    const lib=Storage.getImgLib();
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📷</span><span class="form-section-title">Fotoğraf</span></div>
        <div class="img-picker-area" onclick="document.getElementById('img-file-input').click()">
          <div id="img-preview-wrap"><div style="font-size:48px;margin-bottom:8px">📷</div><div class="img-picker-text">Fotoğraf seç veya çek</div></div>
        </div>
        <input type="file" id="img-file-input" accept="image/*" style="display:none" onchange="Form._onImageSelect(this)">
        ${(_selectedImage||_selectedImgId)?`<button class="img-clear-btn" onclick="Form._clearImage()">🗑️ Görseli Kaldır</button>`:''}
      </div>
      ${lib.length?`<div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🖼️</span><span class="form-section-title">Görsel Kütüphanesi</span></div>
        <div class="img-library-grid" id="img-lib-grid">Yükleniyor...</div>
      </div>`:''}
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">😀</span><span class="form-section-title">Emoji Seç</span></div>
        <div class="emoji-section-tabs">
          <button class="etab active" onclick="Form._showEmojiTab('food',this)">🍲 Yemekler</button>
          <button class="etab" onclick="Form._showEmojiTab('flags',this)">🌍 Bayraklar</button>
          <button class="etab" onclick="Form._showEmojiTab('custom',this)">✏️ Özel</button>
        </div>
        <div class="emoji-row" id="emoji-row">${FOOD_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('')}</div>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🎨</span><span class="form-section-title">Kart Rengi</span></div>
        <div class="color-row" id="color-row">${COLORS.map(c=>`<button class="color-dot${c===_selectedColor?' selected':''}" style="background:${c}" onclick="Form._selectColor('${c}')"></button>`).join('')}</div>
      </div>`;
  }

  // ---- Sayfa 2 ----
  function _page2() {
    const allCats=[...DEFAULT_RECIPE_CATS,...Storage.getCustomCats()];
    return `
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">📂</span><span class="form-section-title">Kategoriler</span></div>
        <div class="cat-multi" id="cat-multi">${allCats.map(c=>`<button class="cat-opt${_fd.categories.includes(c)?' selected':''}" onclick="Form._toggleCat('${_esc(c)}')">${c}</button>`).join('')}</div>
        <div class="add-cat-row">
          <input class="add-cat-input" id="new-cat-input" placeholder="+ Yeni kategori" onkeydown="if(event.key==='Enter'){event.preventDefault();Form._addCustomCat();}">
          <button class="add-cat-btn" onclick="Form._addCustomCat()">Ekle</button>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-header"><span class="form-section-icon">🏷️</span><span class="form-section-title">Malzeme Etiketleri</span></div>
        <div class="form-hint-text" style="margin-bottom:8px">Seçili etiketler aramada bu tarifi öne çıkarır.</div>
        <div id="confirmed-tags-area">${_renderConfirmedTags()}</div>
        <div class="tag-browse-toggle" onclick="Form._toggleTagBrowser()">＋ Listeden etiket seç</div>
        <div id="tag-browser" class="tag-browser" style="display:none"></div>
      </div>`;
  }

  function _renderConfirmedTags() {
    return `<div class="tag-cloud">
      ${_fd.tags.map((t,i)=>`<span class="tag-chip confirmed">${t}<button class="tag-del" onclick="Form._removeTag(${i})">×</button></span>`).join('')}
      ${!_fd.tags.length?'<span class="tag-empty">Henüz etiket yok</span>':''}
    </div>`;
  }
  function _renderTagBrowser() {
    const groups=Settings.getIngTags();
    return Object.entries(groups).map(([cat,tags])=>`
      <div class="tag-browse-cat">
        <div class="tag-browse-cat-label">${cat}</div>
        <div class="tag-cloud">${tags.map(t=>`<span class="tag-chip ${_fd.tags.includes(t)?'confirmed':'browse'}" onclick="Form._toggleTag('${_esc(t)}')">${_fd.tags.includes(t)?'✓ ':''}${t}</span>`).join('')}</div>
      </div>`).join('');
  }

  // ============ AKILLI ETİKET EŞLEŞTİRME ============
  function _computeSuggestions() {
    const all=Settings.getAllIngredients();
    const names=_fd.ingredients.map(i=>(i.name||'').toLowerCase().trim()).filter(Boolean);
    const found=new Set();
    names.forEach(name=>{
      const nameWords=_tok(name);
      all.forEach(tag=>{
        const tagLow=tag.toLowerCase();
        if(_fd.tags.includes(tag))return;
        if(name===tagLow){found.add(tag);return;}
        const tagWords=_tok(tagLow);
        // Etiketin TÜM kelimeleri malzeme kelimeleri içinde tam (birebir) geçmeli
        const allPresent=tagWords.every(tw=>nameWords.includes(tw));
        // Tek kelimeli etiket + birebir kelime eşleşmesi → kısa da olsa kabul ("un", "bal")
        // Çok kelimeli etiketlerde en az bir kelime 3+ harf olmalı (gürültüyü önler)
        if(allPresent){
          if(tagWords.length===1 || tagWords.some(tw=>tw.length>=3)) found.add(tag);
        }
      });
    });
    return [...found].slice(0,12);
  }
  function _tok(str){return str.toLowerCase().replace(/[.,;:()]/g,' ').split(/\s+/).map(w=>w.trim()).filter(Boolean);}

  // ============ CANLI STATE ============
  function _set(k,v){ _fd[k]=v; }
  function _setIng(i,k,v){ if(!_fd.ingredients[i])_fd.ingredients[i]={amount:'',name:''}; _fd.ingredients[i][k]=v; }
  function _setStep(i,v){ _fd.steps[i]=v; }

  function _addIngRow(){ _fd.ingredients.push({amount:'',name:''}); _patchIng(); }
  function _delIngRow(i){ _fd.ingredients.splice(i,1); if(!_fd.ingredients.length)_fd.ingredients=[{amount:'',name:''}]; _patchIng(); }
  function _patchIng(){ const e=document.getElementById('ing-editor'); if(e)e.innerHTML=_renderIngRows(); _refreshTagSuggest(); }

  // Toplu yapıştırma popup
  function _openBulkPaste(){
    const ov = document.getElementById('bulk-paste-overlay');
    if (!ov) return;
    ov.classList.add('open');
    const ta = document.getElementById('bulk-paste-input');
    if (ta){ ta.value=''; setTimeout(()=>ta.focus(),50); }
  }
  function _closeBulkPaste(){ document.getElementById('bulk-paste-overlay')?.classList.remove('open'); }
  function _applyBulkPaste(){
    const ta = document.getElementById('bulk-paste-input');
    const text = ta?.value || '';
    const parsed = _bulkParse(text);
    if (!parsed.length){ App.showToast('Ayrıştırılacak malzeme bulunamadı'); return; }
    // Mevcut boş satırları temizle, yenileri ekle
    _fd.ingredients = _fd.ingredients.filter(i => (i.name||'').trim());
    parsed.forEach(p => _fd.ingredients.push(p));
    if (!_fd.ingredients.length) _fd.ingredients=[{amount:'',name:''}];
    _closeBulkPaste();
    _patchIng();
    App.showToast(`✓ ${parsed.length} malzeme eklendi`);
  }
  function _refreshTagSuggest(){ const e=document.getElementById('tag-suggest-area'); if(e)e.innerHTML=_renderTagSuggest(); }

  function _addStep(){ _fd.steps.push(''); _patchSteps(); }
  function _delStep(i){ _fd.steps.splice(i,1); if(!_fd.steps.length)_fd.steps=['']; _patchSteps(); }
  function _setStepsMode(m){
    _fd.stepsMode=m;
    document.querySelectorAll('.steps-mode-btn').forEach((b,idx)=>b.classList.toggle('active',(idx===0&&m==='list')||(idx===1&&m==='single')));
    _patchSteps();
  }
  function _patchSteps(){ const e=document.getElementById('steps-editor'); if(e)e.innerHTML=_renderStepsEditor(); }

  function _addTag(t){ if(!_fd.tags.includes(t))_fd.tags.push(t); _refreshTagSuggest(); _patchConfirmed(); }
  function _removeTag(i){ _fd.tags.splice(i,1); _patchConfirmed(); _refreshTagSuggest(); _patchBrowser(); }
  function _toggleTag(t){ const i=_fd.tags.indexOf(t); if(i>=0)_fd.tags.splice(i,1); else _fd.tags.push(t); _patchConfirmed(); _patchBrowser(); }
  function _patchConfirmed(){ const e=document.getElementById('confirmed-tags-area'); if(e)e.innerHTML=_renderConfirmedTags(); }
  function _patchBrowser(){ const e=document.getElementById('tag-browser'); if(e&&e.style.display!=='none')e.innerHTML=_renderTagBrowser(); }
  function _toggleTagBrowser(){ const e=document.getElementById('tag-browser'); if(!e)return; if(e.style.display==='none'){e.innerHTML=_renderTagBrowser();e.style.display='block';}else e.style.display='none'; }

  function _toggleCat(c){
    const i=_fd.categories.indexOf(c);
    if(i>=0)_fd.categories.splice(i,1); else _fd.categories.push(c);
    document.querySelectorAll('#cat-multi .cat-opt').forEach(b=>b.classList.toggle('selected',_fd.categories.includes(b.textContent.trim())));
  }
  function _addCustomCat(){
    const inp=document.getElementById('new-cat-input');
    const val=inp?.value.trim(); if(!val)return;
    const custom=Storage.getCustomCats();
    if(!custom.includes(val)&&!DEFAULT_RECIPE_CATS.includes(val)){custom.push(val);Storage.saveCustomCats(custom);}
    if(!_fd.categories.includes(val))_fd.categories.push(val);
    if(inp)inp.value='';
    const allCats=[...DEFAULT_RECIPE_CATS,...Storage.getCustomCats()];
    const cm=document.getElementById('cat-multi');
    if(cm)cm.innerHTML=allCats.map(c=>`<button class="cat-opt${_fd.categories.includes(c)?' selected':''}" onclick="Form._toggleCat('${_esc(c)}')">${c}</button>`).join('');
  }

  function _selectEmoji(e){
    _selectedEmoji=e; _selectedImage=null; _selectedImgId=null;
    document.querySelectorAll('#emoji-row .emoji-btn').forEach(b=>b.classList.toggle('selected',b.textContent===e));
    _resetImgPreview();
  }
  function _showEmojiTab(tab,btn){
    document.querySelectorAll('.etab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const row=document.getElementById('emoji-row');
    if(tab==='food')row.innerHTML=FOOD_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('');
    if(tab==='flags')row.innerHTML=FLAG_EMOJIS.map(e=>`<button class="emoji-btn${e===_selectedEmoji?' selected':''}" onclick="Form._selectEmoji('${e}')">${e}</button>`).join('');
    if(tab==='custom')row.innerHTML=`<input class="emoji-custom-input" placeholder="✏️ emoji yapıştır" maxlength="4" oninput="Form._setCustomEmoji(this.value)">`;
  }
  function _setCustomEmoji(v){ if(v.trim()){_selectedEmoji=v.trim();_selectedImage=null;_selectedImgId=null;} }
  function _selectColor(c){
    _selectedColor=c;
    document.querySelectorAll('#color-row .color-dot').forEach(b=>{
      const bg=b.style.background||'';
      b.classList.toggle('selected', _hexEq(bg,c));
    });
  }
  function _hexEq(a,b){
    // style.background hex'i rgb'ye çevirebilir; basitçe set edilen butonu yeniden çiz
    return false;
  }

  function _onImageSelect(input){
    const file=input.files[0]; if(!file)return;
    _selectedImage=file; _selectedImgId=null;
    _renderPage();
  }
  function _selectLibImage(id){ _selectedImgId=id; _selectedImage=null; _renderPage(); }
  function _clearImage(){ _selectedImage=null; _selectedImgId=null; _renderPage(); }
  function _resetImgPreview(){
    const w=document.getElementById('img-preview-wrap');
    if(w)w.innerHTML=`<div style="font-size:48px;margin-bottom:8px">📷</div><div class="img-picker-text">Fotoğraf seç veya çek</div>`;
  }

  function _afterRender(){
    if(_formPage===1){
      _loadImgLibrary();
      if(_selectedImage){
        const w=document.getElementById('img-preview-wrap');
        if(w)w.innerHTML=`<img src="${URL.createObjectURL(_selectedImage)}" style="width:100%;height:170px;object-fit:cover;border-radius:12px">`;
      }else if(_selectedImgId){
        Storage.getImage(_selectedImgId).then(blob=>{
          if(!blob)return; const w=document.getElementById('img-preview-wrap');
          if(w)w.innerHTML=`<img src="${URL.createObjectURL(blob)}" style="width:100%;height:170px;object-fit:cover;border-radius:12px">`;
        });
      }
      // doğru renk butonu seçili görünsün
      const dots=document.querySelectorAll('#color-row .color-dot');
      dots.forEach((b,idx)=>b.classList.toggle('selected',COLORS[idx]===_selectedColor));
    }
  }

  async function _loadImgLibrary(){
    const grid=document.getElementById('img-lib-grid'); if(!grid)return;
    const lib=Storage.getImgLib();
    if(!lib.length){grid.innerHTML='<div style="color:var(--muted);font-size:13px">Henüz görsel yok</div>';return;}
    grid.innerHTML='';
    for(const meta of lib){
      const blob=await Storage.getImage(meta.id); if(!blob)continue;
      const btn=document.createElement('button');
      btn.className='img-lib-thumb'+(meta.id===_selectedImgId?' selected':'');
      btn.style.backgroundImage=`url(${URL.createObjectURL(blob)})`;
      btn.onclick=()=>_selectLibImage(meta.id);
      grid.appendChild(btn);
    }
  }

  function nextPage(){ if(_formPage<PAGES.length-1){_formPage++;_renderPage();} }
  function prevPage(){ if(_formPage>0){_formPage--;_renderPage();} }
  function _goPage(i){ if(i>=0&&i<PAGES.length){_formPage=i;_renderPage();} }

  async function save(isDraft=false){
    const name=_fd.name.trim();
    if(!name&&!isDraft){App.showToast('⚠️ Tarif adı gerekli');_goPage(0);return;}
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
    const ingredients=_fd.ingredients.filter(i=>(i.name||'').trim()).map(i=>_ingStr({amount:(i.amount||'').trim(),name:i.name.trim()}));
    const recipe={
      id, name:name||'İsimsiz Tarif',
      story:_fd.story.trim(),
      categories:_fd.categories.length?_fd.categories:['Genel'],
      duration:_fd.duration.trim(),
      servings:parseInt(_fd.servings)||2,
      difficulty:_fd.difficulty||'Orta',
      calories:String(_fd.calories||'').trim(),
      sourceLink:String(_fd.sourceLink||'').trim(),
      ingredients,
      ingTags:_fd.tags,
      stepsMode:_fd.stepsMode,
      stepsText:_fd.stepsMode==='single'?_fd.stepsText:'',
      stepsArray:_fd.stepsMode==='list'?_fd.steps.filter(s=>s.trim()):[],
      notes:_fd.notes.trim(),
      image:_selectedEmoji||'🍽️',
      color:_selectedColor,
      hasImage, imgLibId:_selectedImgId||null, isDraft,
      addedAt:_editingId?(App.getRecipeById(_editingId)?.addedAt||Date.now()):id,
    };
    let recipes=Storage.getRecipes();
    if(_editingId)recipes=recipes.map(r=>r.id===_editingId?recipe:r);
    else recipes.unshift(recipe);
    Storage.saveRecipes(recipes);
    App.showToast(isDraft?'📋 Taslak kaydedildi':'✅ Tarif kaydedildi!');
    App.openDetail(id);
  }

  function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  return {
    openAdd, openEdit, cancel,
    nextPage, prevPage, save,
    _goPage, _set, _setIng, _setStep,
    _addIngRow, _delIngRow, _refreshTagSuggest,
    _openBulkPaste, _closeBulkPaste, _applyBulkPaste,
    _setStepsMode, _addStep, _delStep,
    _addTag, _removeTag, _toggleTag, _toggleTagBrowser,
    _toggleCat, _addCustomCat,
    _selectEmoji, _showEmojiTab, _setCustomEmoji, _selectColor,
    _onImageSelect, _selectLibImage, _clearImage,
  };
})();
