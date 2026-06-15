/* =========================================================
   Dönen kalp animasyonu  💗
   - URL parametreleriyle kişiselleştirilir (arkadaşına gönder)
     ?word=love%20you&msg=Seni%20Seviyorum&color=ea80b0
   ========================================================= */

const $ = (s) => document.querySelector(s);

/* ---------- 1) Ayarları URL'den oku ---------- */
const params = new URLSearchParams(location.search);
const config = {
  to:    params.get('to')    || '',
  color: '#' + (params.get('color') || 'ea80b0').replace('#', ''),
};

/* ---------- 2) Kayan yıldızlar (galaksi) ---------- */
(function makeStars(){
  const W = Math.max(window.innerWidth, 360);
  // n adet yıldız için box-shadow listesi üretir
  const field = (n, colors, spread) => {
    const out = [];
    for (let i = 0; i < n; i++){
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * 2000);
      const c = colors[Math.floor(Math.random() * colors.length)];
      out.push(spread ? `${x}px ${y}px 0 ${spread}px ${c}` : `${x}px ${y}px ${c}`);
    }
    return out.join(',');
  };
  // 3 katman: uzak (soluk) → yakın (parlak), farklı hızlarda kayar
  $('#sl1').style.boxShadow = field(70, ['#cfd8ff','#ffffff','#f2c9ff'], 0);
  $('#sl2').style.boxShadow = field(45, ['#ffffff','#bcd2ff','#ffd0ec'], 0.4);
  $('#sl3').style.boxShadow = field(22, ['#ffffff','#ffe9a8'], 0.8);
})();

/* ---------- 3) Kalbi kelimelerle oluştur ---------- */
function heartPoint(t){
  // klasik kalp parametrik denklemi
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

function buildHeart(){
  const heart = $('#heart');
  heart.innerHTML = '';

  const SCALE_X = 11;     // yatay büyüklük
  const SCALE_Y = 9;      // dikey büyüklük
  const DOTS    = 170;    // çizgi yumuşaklığı (nokta sayısı)

  // 3 iç içe kalp çizgisi (ölçek, derinlik)
  const RINGS = [
    { sc: 1.00, z:  10 },
    { sc: 0.80, z:   0 },
    { sc: 0.60, z: -10 },
  ];

  RINGS.forEach(ring => {
    for (let i = 0; i < DOTS; i++){
      const t  = (i / DOTS) * Math.PI * 2;
      const p  = heartPoint(t);
      const px = p.x * SCALE_X * ring.sc;
      const py = -p.y * SCALE_Y * ring.sc;   // ekran y'si ters

      const d = document.createElement('span');
      d.className = 'dot';
      d.style.transform =
        `translate(-50%,-50%) translate3d(${px}px, ${py}px, ${ring.z}px)`;
      heart.appendChild(d);
    }
  });
}

/* ---------- 4) Renk + mesajı uygula ---------- */
function applyConfig(){
  document.documentElement.style.setProperty('--love', config.color);
  document.documentElement.style.setProperty('--glow', lighten(config.color, 30));
  const tag = $('#nameTag');
  tag.textContent = config.to ? config.to + ' için 💗' : '';
  tag.classList.toggle('show', !!config.to);
  document.title = config.to ? (config.to + ' 💗') : '💗';
  buildHeart();
}

function lighten(hex, amt){
  let c = hex.replace('#','');
  if (c.length === 3) c = c.split('').map(x=>x+x).join('');
  let r = Math.min(255, parseInt(c.slice(0,2),16)+amt);
  let g = Math.min(255, parseInt(c.slice(2,4),16)+amt);
  let b = Math.min(255, parseInt(c.slice(4,6),16)+amt);
  return `rgb(${r},${g},${b})`;
}

applyConfig();

/* ---------- 5) Panel (kendi kartını oluştur) ---------- */
const COLORS = ['ea80b0','ff4d6d','ff9eb5','b388ff','7afcff','ffd166'];
(function buildColors(){
  const box = $('#colors');
  COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.style.background = '#' + c;
    s.dataset.color = c;
    if ('#'+c === config.color.toLowerCase()) s.classList.add('active');
    s.onclick = () => {
      document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));
      s.classList.add('active');
    };
    box.appendChild(s);
  });
})();

// panel alanlarını mevcut değerlerle doldur
$('#inTo').value   = config.to;

$('#openPanel').onclick  = () => $('#panel').classList.add('open');
$('#closePanel').onclick = () => $('#panel').classList.remove('open');
$('#panel').onclick = (e) => { if (e.target.id === 'panel') $('#panel').classList.remove('open'); };

function readPanel(){
  config.to    = $('#inTo').value.trim();
  const active = document.querySelector('.swatch.active');
  config.color = '#' + (active ? active.dataset.color : 'ea80b0');
}

$('#applyBtn').onclick = () => {
  readPanel();
  applyConfig();
  $('#panel').classList.remove('open');
};

/* ---------- 6) Paylaş linki ---------- */
function buildLink(){
  const u = new URL(location.href.split('?')[0]);
  if (config.to) u.searchParams.set('to', config.to);
  u.searchParams.set('color', config.color.replace('#',''));
  return u.toString();
}

$('#shareBtn').onclick = async () => {
  readPanel();
  applyConfig();
  const link = buildLink();
  const hint = $('#hint');
  try {
    if (navigator.share){
      await navigator.share({ title: config.to ? (config.to + ' 💗') : '💗', url: link });
      return;
    }
    await navigator.clipboard.writeText(link);
    hint.textContent = '✅ Link kopyalandı! Şimdi arkadaşına yapıştırıp gönder 💌';
  } catch {
    hint.textContent = link;  // kopyalanamadıysa elle seçsin
  }
};

/* ---------- 7) Müzik (Super Mario - 8-bit) ---------- */
let audioOn = false, audioCtx = null, loopTimer = null, master = null;

const HZ = {
  'E4':329.63,'G4':392.0,'A4':440.0,'As4':466.16,'B4':493.88,
  'C5':523.25,'D5':587.33,'Ds5':622.25,'E5':659.25,'F5':698.46,
  'Fs5':739.99,'G5':783.99,'Gs5':830.61,'A5':880.0,'B5':987.77,'C6':1046.50,
  'R':0
};

// Super Mario Bros - ana tema (sekizlik nota ızgarası, R = es)
const MARIO = [
  // giriş motifi
  ['E5',1],['E5',1],['R',1],['E5',1],['R',1],['C5',1],['E5',1],['R',1],
  ['G5',1],['R',1],['R',1],['R',1],['G4',1],['R',1],['R',1],['R',1],
  // ikinci bölüm
  ['C5',1],['R',1],['R',1],['G4',1],['R',1],['R',1],['E4',1],['R',1],
  ['R',1],['A4',1],['R',1],['B4',1],['R',1],['As4',1],['A4',1],['R',1],
  ['G4',2],['E5',2],['G5',1],['A5',1],['R',1],['F5',1],['G5',1],['R',1],
  ['E5',1],['R',1],['C5',1],['D5',1],['B4',2],['R',2]
];

// tek bir 8-bit nota (kare dalga = chiptune)
function playBleep(freq, t0, dur){
  if (!freq) return;                       // es
  const g = audioCtx.createGain();
  g.connect(master);
  const o = audioCtx.createOscillator();
  o.type = 'square';
  o.frequency.value = freq;
  o.connect(g);
  const peak = 0.14;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  g.gain.setValueAtTime(peak, t0 + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function scheduleMelody(){
  const beat = 0.15;                        // hızlı, neşeli tempo
  let t = audioCtx.currentTime + 0.1;
  let total = 0;
  MARIO.forEach(([n, b]) => {
    const d = b * beat;
    playBleep(HZ[n], t, d * 0.9);
    t += d; total += d;
  });
  loopTimer = setTimeout(() => { if (audioOn) scheduleMelody(); }, total * 1000);
}

function startMusic(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain(); master.gain.value = 0.85; master.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  scheduleMelody();
}

$('#muteBtn').onclick = () => {
  audioOn = !audioOn;
  $('#muteBtn').textContent = audioOn ? '🔈' : '🔊';
  if (audioOn) startMusic();
  else clearTimeout(loopTimer);
};

/* ---------- 8) Düşen kalpçikler ---------- */
let fallTimer = null;
function spawnHeart(){
  const f = $('#falling');
  const h = document.createElement('div');
  h.className = 'fall';
  h.textContent = ['💗','💕','💖','🩷','❤️'][Math.floor(Math.random()*5)];
  h.style.left = Math.random() * 100 + 'vw';
  h.style.fontSize = (14 + Math.random() * 20) + 'px';
  const dur = 6 + Math.random() * 6;
  h.style.animationDuration = dur + 's';
  f.appendChild(h);
  setTimeout(() => h.remove(), dur * 1000);
}
function startFalling(){
  if (fallTimer) return;
  fallTimer = setInterval(spawnHeart, 450);
}
startFalling();   // kalpçikler açılışta başlasın
