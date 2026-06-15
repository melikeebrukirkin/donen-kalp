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
  word:  params.get('word')  || 'love you',
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

  const SCALE_X   = 14;   // yatay büyüklük (daha geniş = daha tombul)
  const SCALE_Y   = 11;   // dikey büyüklük
  const WORDS     = 64;   // her katmandaki kelime sayısı
  const LAYERS    = 11;   // derinlik katmanı (kalbe hacim verir)
  const LAYER_GAP = 14;   // katmanlar arası z mesafesi (px)

  for (let l = 0; l < LAYERS; l++){
    const z = (l - (LAYERS - 1) / 2) * LAYER_GAP;

    for (let i = 0; i < WORDS; i++){
      const t  = (i / WORDS) * Math.PI * 2;
      const p  = heartPoint(t);

      const px = p.x * SCALE_X;
      const py = -p.y * SCALE_Y;           // ekran y'si ters

      const w = document.createElement('span');
      w.className = 'word';
      w.textContent = config.word;
      // YATAY yazı: artık eğriye göre döndürmüyoruz
      w.style.transform =
        `translate(-50%,-50%) translate3d(${px}px, ${py}px, ${z}px)`;
      // dıştaki katmanlar daha soluk → derinlik hissi
      w.style.opacity = (0.45 + 0.55 * (1 - Math.abs(z) / (LAYER_GAP * LAYERS / 2))).toFixed(2);
      w.style.animationDelay = (i * 60 + l * 120) + 'ms';
      heart.appendChild(w);
    }
  }
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
$('#inWord').value = config.word;

$('#openPanel').onclick  = () => $('#panel').classList.add('open');
$('#closePanel').onclick = () => $('#panel').classList.remove('open');
$('#panel').onclick = (e) => { if (e.target.id === 'panel') $('#panel').classList.remove('open'); };

function readPanel(){
  config.to    = $('#inTo').value.trim();
  config.word  = $('#inWord').value.trim() || 'love you';
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
  u.searchParams.set('word',  config.word);
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

/* ---------- 7) Müzik (keman tonlu, duygusal melodi) ---------- */
let audioOn = false, audioCtx = null, loopTimer = null, master = null, reverb = null;

// duygusal, yavaş melodi  (nota Hz, süre = vuruş)
const MELODY = [
  ['A4',1],['C5',1],['E5',2],['D5',1],['C5',1],['B4',2],
  ['A4',1],['G4',1],['A4',2],['E4',2],['G4',2],
  ['F4',1],['A4',1],['C5',2],['B4',1],['A4',1],['G4',2],
  ['E4',1],['F4',1],['A4',2],['G4',1],['E4',1],['A4',3],['A4',1]
];
const HZ = { 'E4':329.63,'F4':349.23,'G4':392.0,'A4':440.0,'B4':493.88,
            'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99 };

// tek bir keman benzeri nota (testere dalgası + alçak geçiren süzgeç + vibrato)
function playViolin(freq, t0, dur){
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2600;
  filter.Q.value = 0.6;

  const g = audioCtx.createGain();
  filter.connect(g);
  g.connect(master);
  if (reverb) g.connect(reverb);

  // vibrato (yayın titreşimi)
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 5.5;
  lfoGain.gain.value = freq * 0.011;
  lfo.connect(lfoGain);

  // iki hafif detune testere = daha dolgun, kemansı ton
  const o1 = audioCtx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq;
  const o2 = audioCtx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 7;
  lfoGain.connect(o1.frequency); lfoGain.connect(o2.frequency);
  o1.connect(filter); o2.connect(filter);

  // yumuşak yay envelope'u (yavaş giriş)
  const A = 0.14, R = 0.30, peak = 0.13;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + A);
  g.gain.setValueAtTime(peak, t0 + Math.max(A, dur - R));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  [lfo, o1, o2].forEach(o => { o.start(t0); o.stop(t0 + dur + 0.05); });
}

function buildReverb(){
  // basit yankı (oda hissi) için convolver
  const len = audioCtx.sampleRate * 2.2;
  const buf = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++){
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.5);
  }
  const conv = audioCtx.createConvolver(); conv.buffer = buf;
  const wet = audioCtx.createGain(); wet.gain.value = 0.35;
  conv.connect(wet); wet.connect(audioCtx.destination);
  return conv;
}

function scheduleMelody(){
  const beat = 0.62;                 // yavaş tempo
  let t = audioCtx.currentTime + 0.15;
  let total = 0;
  MELODY.forEach(([n, b]) => {
    const d = b * beat;
    playViolin(HZ[n], t, d * 0.92);
    t += d; total += d;
  });
  loopTimer = setTimeout(() => { if (audioOn) scheduleMelody(); }, total * 1000);
}

function startMusic(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain(); master.gain.value = 0.9; master.connect(audioCtx.destination);
    reverb = buildReverb();
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
