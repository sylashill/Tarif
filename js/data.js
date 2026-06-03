// ============================================================
// data.js — Sabitler, varsayılan etiketler, emoji listeleri
// ============================================================

const COLORS = [
  '#e8521a','#d4a017','#4a7c59','#6c5ce7','#e84393',
  '#0984e3','#00b894','#c0392b','#8e44ad','#2c3e50',
  '#16a085','#d35400','#27ae60','#2980b9','#f39c12'
];

const FONTS = [
  { id:'dm',      name:'DM Sans',           sample:'Modern & temiz',      css:"'DM Sans',sans-serif" },
  { id:'playfair',name:'Playfair Display',  sample:'Klasik & zarif',      css:"'Playfair Display',serif" },
  { id:'lora',    name:'Lora',              sample:'Sıcak & okunabilir',  css:"'Lora',serif" },
  { id:'nunito',  name:'Nunito',            sample:'Yuvarlak & arkadaşça',css:"'Nunito',sans-serif" },
  { id:'merri',   name:'Merriweather',      sample:'Gazete stili',        css:"'Merriweather',serif" },
  { id:'raleway', name:'Raleway',           sample:'Şık & geometrik',     css:"'Raleway',sans-serif" },
  { id:'poppins', name:'Poppins',           sample:'Modern & dengeli',    css:"'Poppins',sans-serif" },
  { id:'montserrat',name:'Montserrat',      sample:'Güçlü & net',         css:"'Montserrat',sans-serif" },
  { id:'cormorant',name:'Cormorant',        sample:'Zarif & ince',        css:"'Cormorant Garamond',serif" },
  { id:'crimson', name:'Crimson Pro',       sample:'Kitap dili',          css:"'Crimson Pro',serif" },
  { id:'spacemono',name:'Space Mono',       sample:'Daktilo / teknik',    css:"'Space Mono',monospace" },
  { id:'caveat',  name:'Caveat',            sample:'El yazısı',           css:"'Caveat',cursive" },
];

const DIFFICULTY = ['Kolay','Orta','Zor'];

const DEFAULT_RECIPE_CATS = [
  'Çorba','Ana Yemek','Zeytinyağlı','Tatlı','Kahvaltı',
  'Salata','Atıştırmalık','Makarna','Pilav','Börek & Hamur',
  'İçecek','Sos & Dip'
];

// Yemek emojileri (kapsamlı)
const FOOD_EMOJIS = [
  '🍲','🍗','🫘','🥗','🍰','🥘','🍝','🥞','🍜','🫕',
  '🥙','🍱','🥧','🍕','🥩','🥦','🍳','☕','🧁','🥐',
  '🫙','🥣','🍛','🫔','🍖','🌮','🌯','🥪','🍔','🌭',
  '🍟','🧆','🥚','🧀','🥓','🥞','🧇','🥯','🍞','🥖',
  '🫓','🥨','🧈','🍯','🥜','🌰','🍫','🍬','🍭','🍮',
  '🍩','🍪','🎂','🍦','🍧','🍨','🍡','🧁','🥟','🦪',
  '🍣','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🦑','🦐',
  '🦞','🦀','🐟','🐠','🐡','🥬','🥒','🌶️','🫑','🧄',
  '🧅','🥔','🍠','🫚','🍶','🍵','🧃','🥤','🧋','🍺',
  '🍷','🥂','🍸','🍹','🧉','🫖','🍾',
];

// Bayrak emojileri (yemekleriyle meşhur ülkeler)
const FLAG_EMOJIS = [
  '🇹🇷','🇮🇹','🇫🇷','🇯🇵','🇨🇳','🇲🇽','🇮🇳','🇬🇷',
  '🇪🇸','🇹🇭','🇻🇳','🇰🇷','🇱🇧','🇲🇦','🇪🇬','🇮🇷',
  '🇵🇹','🇩🇪','🇬🇧','🇺🇸','🇧🇷','🇦🇷','🇵🇪','🇪🇹',
  '🇳🇬','🇨🇩','🇸🇦','🇮🇶','🇵🇰','🇧🇩','🇮🇩','🇲🇾',
  '🇸🇬','🇹🇼','🇺🇦','🇷🇺','🇵🇱','🇭🇺','🇷🇴','🇸🇪',
];

// Varsayılan malzeme etiketleri (kategorilere göre)
const DEFAULT_INGREDIENT_TAGS = {
  'Sebzeler': [
    'soğan','sarımsak','domates','biber','salatalık','havuç','patates',
    'patlıcan','kabak','ıspanak','maydanoz','dereotu','nane','kekik',
    'roka','marul','lahana','brokoli','karnabahar','kereviz','enginar',
    'kuşkonmaz','bezelye','taze fasulye','bakla','mantar','taze soğan',
    'pırasa','turp','şalgam','pancar','tatlı patates','avokado','mısır'
  ],
  'Etler': [
    'tavuk göğsü','tavuk but','kıyma','kuzu eti','dana eti','hindi',
    'sığır eti','kuzu kol','dana kıyma','tavuk kıyma','sucuk','salam',
    'pastırma','jambon','sosis','bacon','kuzu pirzola','dana bonfile',
    'tavuk kanat','ciğer','böbrek','işkembe','balık','somon','ton balığı',
    'levrek','çipura','hamsi','midye','karides','ahtapot','kalamar'
  ],
  'Tahıllar & Bakliyat': [
    'un','pirinç','makarna','bulgur','mercimek','nohut','kuru fasulye',
    'barbunya','börülce','soya','kinoa','yulaf','irmik','mısır unu',
    'tam buğday unu','galeta unu','ekmek','pide','yufka','erişte'
  ],
  'Süt Ürünleri': [
    'yoğurt','süt','peynir','beyaz peynir','kaşar','tereyağı','krema',
    'ayran','kefir','labne','lor peyniri','parmesan','mozzarella',
    'cheddar','ricotta','mascarpone','yumurta'
  ],
  'Yağlar & Soslar': [
    'zeytinyağı','ayçiçek yağı','tereyağı','margarin','susam yağı',
    'hindistan cevizi yağı','salça','ketçap','mayonez','hardal',
    'sirke','nar ekşisi','limon suyu','soya sosu','worcestershire',
    'tabasco','bal','pekmez','tahin'
  ],
  'Baharatlar': [
    'tuz','karabiber','kırmızı biber','kimyon','zerdeçal','tarçın',
    'karanfil','kakule','kişniş','zencefil','muskat','sumak','za\'atar',
    'kekik','biberiye','fesleğen','defne yaprağı','safran','vanilya',
    'toz şeker','pudra şekeri','kabartma tozu','karbonat','maya'
  ],
  'Kuruyemiş & Meyve': [
    'ceviz','fındık','badem','fıstık','çam fıstığı','antep fıstığı',
    'susam','ay çekirdeği','kuru üzüm','kuru kayısı','kuru incir',
    'hurma','elma','armut','portakal','limon','çilek','muz','üzüm',
    'kiraz','şeftali','kayısı','nar','kivi','mango','ananas'
  ],
};

// Varsayılan araç etiketleri + alternatifleri
const DEFAULT_TOOL_TAGS = {
  'Pişirme Araçları': [
    { name:'fırın',              alt:[] },
    { name:'airfryer',           alt:[] },
    { name:'fritöz',             alt:[] },
    { name:'buharlı tencere',    alt:[] },
    { name:'mikrodalga',         alt:[] },
    { name:'tava',               alt:[] },
    { name:'wok',                alt:[] },
    { name:'ızgara',             alt:[] },
    { name:'tencere',            alt:[] },
    { name:'düdüklü tencere',    alt:[] },
    { name:'yavaş pişirici',     alt:[] },
  ],
  'Mutfak Aletleri': [
    { name:'blender',            alt:[] },
    { name:'daldırma blender',   alt:[] },
    { name:'mikser',             alt:[] },
    { name:'rondo',              alt:[] },
    { name:'merdane',            alt:[] },
    { name:'elek',               alt:[] },
    { name:'rende',              alt:[] },
  ],
};

// Araç kelime eşleştirme (adım metninde geçince tanınsın)
const TOOL_KEYWORDS = (() => {
  const map = {};
  [...DEFAULT_TOOL_TAGS['Pişirme Araçları'], ...DEFAULT_TOOL_TAGS['Mutfak Aletleri']].forEach(t => {
    map[t.name.toLowerCase()] = t;
  });
  return map;
})();

// Isıt-ye ısıtma yöntemleri
const HEAT_METHODS = [
  { id:'firin',    label:'Fırın',        icon:'🔥', unit:'°C' },
  { id:'airfryer', label:'Airfryer',     icon:'💨', unit:'°C' },
  { id:'frítöz',  label:'Fritöz',       icon:'🛁', unit:'°C' },
  { id:'mikro',    label:'Mikrodalga',   icon:'📡', unit:'W'  },
  { id:'tava',     label:'Tava',         icon:'🍳', unit:'derece (1-5)' },
  { id:'tencere',  label:'Tencere',      icon:'🫕', unit:'°C' },
  { id:'buhur',    label:'Buharlı',      icon:'♨️', unit:'dk' },
  { id:'izgara',   label:'Izgara',       icon:'🔲', unit:'°C' },
];

// ============================================================
// Ölçü birimleri — toplu malzeme yapıştırmada akıllı ayrıştırma
// ============================================================
const MEASURE_UNITS = [
  // hacim/kaşık
  'yemek kaşığı','tatlı kaşığı','çay kaşığı','kaşık',
  'su bardağı','çay bardağı','bardak','fincan',
  'litre','lt','mililitre','ml','cl','dl',
  // ağırlık
  'kilogram','kilo','kg','gram','gr','g','mg',
  // adet/grup
  'adet','tane','paket','kutu','konserve','demet','dal','diş','baş',
  'avuç','tutam','dilim','parça','yaprak','salkım','fileto','but',
  // tarif dili
  'çimdik','damla','şişe','poşet','top','küp','bardağı',
];

// Sayı + birim yakalama için (Türkçe ondalık virgül de destekli)
// Örn: "1.5 yemek kaşığı zeytinyağı" → amount:"1.5 yemek kaşığı", name:"zeytinyağı"
//      "2 su bardağı un"            → amount:"2 su bardağı", name:"un"
//      "3 diş sarımsak"             → amount:"3 diş", name:"sarımsak"
//      "yarım limon"                → amount:"yarım", name:"limon"
//      "tuz"                        → amount:"", name:"tuz"
const QUANTITY_WORDS = ['yarım','çeyrek','birkaç','bir','iki','üç','dört','beş','az','bol','biraz'];

// ============================================================
// Detaylı entry — kutu tipleri ve blok tipleri
// ============================================================
const BOX_TYPES = [
  { id:'tip',  label:'İpucu',  icon:'💡', cls:'box-tip'  },
  { id:'warn', label:'Uyarı',  icon:'⚠️', cls:'box-warn' },
  { id:'ok',   label:'Not',    icon:'✅', cls:'box-ok'   },
];

// Detaylı entry blok tipleri (her sekme içine eklenebilir)
const BLOCK_TYPES = [
  { id:'ingredients', label:'Malzeme Grubu', icon:'🛒' },
  { id:'steps',       label:'Adımlar',        icon:'👨‍🍳' },
  { id:'box',         label:'Kutu (İpucu/Uyarı/Not)', icon:'💬' },
  { id:'text',        label:'Serbest Metin',  icon:'📝' },
  { id:'layers',      label:'Katman Sırası',  icon:'🍔' },
  { id:'mini',        label:'Mini Tarif',     icon:'🥄' },
];

// Detaylı entry için entry-özel tema paletleri
const ENTRY_THEMES = [
  { id:'gold',   label:'Altın Gece',  bg:'#0f0e0c', card:'#1a1814', accent:'#c9a84c', cream:'#f0e6d0' },
  { id:'crimson',label:'Bordo',       bg:'#160a0a', card:'#1f1010', accent:'#c0392b', cream:'#f5e0dc' },
  { id:'forest', label:'Orman',       bg:'#0a140d', card:'#111f15', accent:'#4a9c6d', cream:'#dff0e4' },
  { id:'ocean',  label:'Okyanus',     bg:'#0a1320', card:'#0f1e30', accent:'#4fc3f7', cream:'#d0e8f5' },
  { id:'plum',   label:'Mor',         bg:'#130a1a', card:'#1d1028', accent:'#a06cd5', cream:'#ece0f5' },
  { id:'paper',  label:'Açık Kağıt',  bg:'#faf6ef', card:'#ffffff', accent:'#c0622a', cream:'#2d1a0e' },
  { id:'charcoal',label:'Kömür',      bg:'#121212', card:'#1e1e1e', accent:'#ff7043', cream:'#eceff1' },
  { id:'rose',   label:'Gül',         bg:'#1a0f14', card:'#261720', accent:'#ec407a', cream:'#fce4ec' },
  { id:'emerald',label:'Zümrüt',      bg:'#08140f', card:'#0f2018', accent:'#26d0a0', cream:'#d4f5e9' },
  { id:'royal',  label:'Kraliyet',    bg:'#0a0e1f', card:'#12172e', accent:'#7c8cf8', cream:'#dde2ff' },
  { id:'amber',  label:'Kehribar',    bg:'#1a1206', card:'#26190a', accent:'#ffb300', cream:'#fff3d6' },
  { id:'mint',   label:'Açık Nane',   bg:'#f0faf8', card:'#ffffff', accent:'#00897b', cream:'#0d2b28' },
  { id:'cream',  label:'Krem',        bg:'#faf6f0', card:'#fffdfa', accent:'#8d6e63', cream:'#3e2723' },
  { id:'slate',  label:'Arduvaz',     bg:'#0f1419', card:'#1a2128', accent:'#56c8d8', cream:'#e0e8ec' },
];
