// ============================================================
// storage.js — Veri saklama katmanı
//   • localStorage  → tarifler, ayarlar, kategoriler, etiketler
//   • IndexedDB     → görseller (blob)
// ============================================================

const Storage = (() => {

  // ---------- IndexedDB ----------
  let _db = null;

  async function openDB() {
    if (_db) return _db;
    return new Promise((res, rej) => {
      const req = indexedDB.open('tarif-img-db', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
      };
      req.onsuccess  = e => { _db = e.target.result; res(_db); };
      req.onerror    = ()  => rej(new Error('IndexedDB açılamadı'));
    });
  }

  async function saveImage(id, blob) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx  = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(blob, String(id));
      tx.oncomplete = () => res(true);
      tx.onerror    = ()  => rej(false);
    });
  }

  async function getImage(id) {
    const db = await openDB();
    return new Promise(res => {
      const tx  = db.transaction('images', 'readonly');
      const req = tx.objectStore('images').get(String(id));
      req.onsuccess = () => res(req.result || null);
      req.onerror   = ()  => res(null);
    });
  }

  async function deleteImage(id) {
    const db = await openDB();
    return new Promise(res => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').delete(String(id));
      tx.oncomplete = () => res();
      tx.onerror    = ()  => res();
    });
  }

  // Tüm görsel ID'lerini listele
  async function getAllImageIds() {
    const db = await openDB();
    return new Promise(res => {
      const tx  = db.transaction('images', 'readonly');
      const req = tx.objectStore('images').getAllKeys();
      req.onsuccess = () => res(req.result || []);
      req.onerror   = ()  => res([]);
    });
  }

  // ---------- localStorage ----------
  const KEYS = {
    recipes:    'td_recipes_v3',
    settings:   'td_settings_v3',
    recCats:    'td_rec_cats_v3',
    heatItems:  'td_heat_items_v3',
    ingTags:    'td_ing_tags_v3',
    toolTags:   'td_tool_tags_v3',
    imgLib:     'td_img_lib_v3',   // { id, name, addedAt }[]
  };

  function _get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('localStorage hatası', e); }
  }

  // Tarifler
  function getRecipes()        { return _get(KEYS.recipes, []); }
  function saveRecipes(arr)    { _set(KEYS.recipes, arr); }

  // Isıt-Ye öğeleri
  function getHeatItems()      { return _get(KEYS.heatItems, []); }
  function saveHeatItems(arr)  { _set(KEYS.heatItems, arr); }

  // Ayarlar
  function getSettings()       { return _get(KEYS.settings, { font:'dm', accentColor:'#e8521a', headerFont:'playfair', darkMode:false }); }
  function saveSettings(s)     { _set(KEYS.settings, s); }

  // Özel kategoriler
  function getCustomCats()     { return _get(KEYS.recCats, []); }
  function saveCustomCats(arr) { _set(KEYS.recCats, arr); }

  // Etiketler (malzeme)
  function getIngTags()        { return _get(KEYS.ingTags, null); /* null = varsayılan kullan */ }
  function saveIngTags(obj)    { _set(KEYS.ingTags, obj); }

  // Etiketler (araç)
  function getToolTags()       { return _get(KEYS.toolTags, null); }
  function saveToolTags(obj)   { _set(KEYS.toolTags, obj); }

  // Görsel kütüphanesi meta
  function getImgLib()         { return _get(KEYS.imgLib, []); }
  function saveImgLib(arr)     { _set(KEYS.imgLib, arr); }

  // ---------- Export / Import ----------

  /** Tüm verileri JSON string olarak döner (görseller hariç, base64 dahil opsiyonel) */
  async function exportAll(includeImages = false) {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      recipes:    getRecipes(),
      heatItems:  getHeatItems(),
      settings:   getSettings(),
      customCats: getCustomCats(),
      ingTags:    getIngTags(),
      toolTags:   getToolTags(),
      imgLib:     getImgLib(),
      images:     {},
    };
    if (includeImages) {
      const lib = getImgLib();
      for (const meta of lib) {
        const blob = await getImage(meta.id);
        if (blob) {
          data.images[meta.id] = await _blobToBase64(blob);
        }
      }
    }
    return JSON.stringify(data, null, 2);
  }

  /** JSON string'i içe aktar */
  async function importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.recipes)    saveRecipes(data.recipes);
    if (data.heatItems)  saveHeatItems(data.heatItems);
    if (data.settings)   saveSettings(data.settings);
    if (data.customCats) saveCustomCats(data.customCats);
    if (data.ingTags)    saveIngTags(data.ingTags);
    if (data.toolTags)   saveToolTags(data.toolTags);
    if (data.imgLib)     saveImgLib(data.imgLib);
    // Görselleri geri yükle
    if (data.images) {
      for (const [id, b64] of Object.entries(data.images)) {
        const blob = await _base64ToBlob(b64);
        await saveImage(id, blob);
      }
    }
    return true;
  }

  /** Tek tarifi JSON olarak döner */
  async function exportRecipe(recipe) {
    const data = { version: 3, single: true, recipe };
    if (recipe.hasImage) {
      const blob = await getImage(recipe.id);
      if (blob) data.image = await _blobToBase64(blob);
    }
    return JSON.stringify(data, null, 2);
  }

  /** Tek tarif JSON'ını içe aktar */
  async function importRecipe(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (!data.recipe) throw new Error('Geçersiz tarif dosyası');
    const recipe = { ...data.recipe, id: Date.now(), addedAt: Date.now() };
    if (data.image) {
      const blob = await _base64ToBlob(data.image);
      await saveImage(recipe.id, blob);
      recipe.hasImage = true;
    }
    const recipes = getRecipes();
    recipes.unshift(recipe);
    saveRecipes(recipes);
    return recipe;
  }

  // ---------- Yardımcılar ----------
  function _blobToBase64(blob) {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });
  }
  async function _base64ToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
  }

  // ---------- Dosyaya indir ----------
  function downloadJSON(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Public API ----------
  return {
    openDB,
    saveImage, getImage, deleteImage, getAllImageIds,
    getRecipes, saveRecipes,
    getHeatItems, saveHeatItems,
    getSettings, saveSettings,
    getCustomCats, saveCustomCats,
    getIngTags, saveIngTags,
    getToolTags, saveToolTags,
    getImgLib, saveImgLib,
    exportAll, importAll,
    exportRecipe, importRecipe,
    downloadJSON,
  };
})();
