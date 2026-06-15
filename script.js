/* =========================================================
   Dönen kalp animasyonu  💗
   - URL parametreleriyle kişiselleştirilir (arkadaşına gönder)
     ?word=love%20you&msg=Seni%20Seviyorum&color=ea80b0
   ========================================================= */

const $ = (s) => document.querySelector(s);

/* ---------- 1) Ayarları URL'den oku ---------- */
const params = new URLSearchParams(location.search);
const config = {
  word:  params.get('word')  || 'love you',
  msg:   params.get('msg')   || 'Seni Seviyorum 💗',
  color: '#' + (params.get('color') || 'ea80b0').replace('#', ''),
};

/* ---------- 2) Yıldızlar ---------- */
(function makeStars(){
  const box = $('#stars');
  for (let i = 0; i < 90; i++){
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.top  = Math.random() * 100 + 'vh';
    s.style.setProperty('--d', (1.5 + Math.random() * 3) + 's');
    s.style.animationDelay = (Math.random() * 3) + 's';
    box.appendChild(s);
  }
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

  const SCALE     = 11;   // büyüklük (px çarpanı)
  const WORDS     = 60;   // her katmandaki kelime sayısı
  const LAYERS    = 9;    // derinlik katmanı (kalbe hacim verir)
  const LAYER_GAP = 14;   // katmanlar arası z mesafesi (px)

  for (let l = 0; l < LAYERS; l++){
    const z = (l - (LAYERS - 1) / 2) * LAYER_GAP;

    for (let i = 0; i < WORDS; i++){
      const t  = (i / WORDS) * Math.PI * 2;
      const p  = heartPoint(t);

      // teğet açısı (kelimeyi eğriye yatırmak için)
      const dt = 0.001;
      const p2 = heartPoint(t + dt);
      const dx = (p2.x - p.x);
      const dy = -(p2.y - p.y);            // ekran y'si ters
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const px = p.x * SCALE;
      const py = -p.y * SCALE;             // ekran y'si ters

      const w = document.createElement('span');
      w.className = 'word';
      w.textContent = config.word;
      w.style.transform =
        `translate(-50%,-50%) translate3d(${px}px, ${py}px, ${z}px) rotate(${angle}deg)`;
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
  $('#caption').textContent = config.msg;
  document.title = config.msg;
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
$('#inWord').value = config.word;
$('#inMsg').value  = config.msg;

$('#openPanel').onclick  = () => $('#panel').classList.add('open');
$('#closePanel').onclick = () => $('#panel').classList.remove('open');
$('#panel').onclick = (e) => { if (e.target.id === 'panel') $('#panel').classList.remove('open'); };

function readPanel(){
  config.word  = $('#inWord').value.trim() || 'love you';
  config.msg   = $('#inMsg').value.trim()  || '💗';
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
  u.searchParams.set('word',  config.word);
  u.searchParams.set('msg',   config.msg);
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
      await navigator.share({ title: config.msg, url: link });
      return;
    }
    await navigator.clipboard.writeText(link);
    hint.textContent = '✅ Link kopyalandı! Şimdi arkadaşına yapıştırıp gönder 💌';
  } catch {
    hint.textContent = link;  // kopyalanamadıysa elle seçsin
  }
};

/* ---------- 7) Müzik (WebAudio ile yumuşak melodi) ---------- */
let audioOn = false, audioCtx = null, loopTimer = null;
const NOTES = [523.25, 587.33, 659.25, 784.0, 659.25, 587.33]; // basit tatlı dizi

function playNote(freq, time, dur){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(0.18, time + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(time); o.stop(time + dur);
}

function startMusic(){
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  let i = 0;
  const step = () => {
    if (!audioOn) return;
    playNote(NOTES[i % NOTES.length], audioCtx.currentTime, 0.8);
    i++;
    loopTimer = setTimeout(step, 600);
  };
  step();
}

$('#muteBtn').onclick = () => {
  audioOn = !audioOn;
  $('#muteBtn').textContent = audioOn ? '🔈' : '🔊';
  if (audioOn) startMusic();
  else clearTimeout(loopTimer);
};
