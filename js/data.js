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
    { name:'fırın ızgarası',     alt:[] },
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
