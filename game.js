/* ╔══════════════════════════════════════════════╗
   ║  GALAXY GUESS — game.js                     ║
   ║  電資一甲 412043 林元薇                      ║
   ╚══════════════════════════════════════════════╝ */

'use strict';

/* ════════════════════════════════════════════════
   ① STARFIELD
════════════════════════════════════════════════ */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx    = canvas.getContext('2d');

  const STAR_LAYERS = [
    { count: 220, speed: .15, size: .6, alpha: .35, color: '#e8e0ff' },
    { count: 120, speed: .35, size: 1.2, alpha: .55, color: '#a855f7' },
    { count:  60, speed: .65, size: 2.0, alpha: .8,  color: '#06b6d4' },
    { count:  18, speed: 1.2, size: 3.2, alpha: .9,  color: '#fbbf24' },
  ];

  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    STAR_LAYERS.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: layer.size * (.5 + Math.random() * .9),
          speed: layer.speed * (.7 + Math.random() * .6),
          alpha: layer.alpha * (.6 + Math.random() * .5),
          color: layer.color,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: .02 + Math.random() * .04,
        });
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Deep space gradient
    const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.75);
    bg.addColorStop(0,   '#0d0a2e');
    bg.addColorStop(.5,  '#070520');
    bg.addColorStop(1,   '#02010a');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    stars.forEach(s => {
      s.twinkle += s.twinkleSpeed;
      const alpha = s.alpha * (.7 + .3 * Math.sin(s.twinkle));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur  = s.size * 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      s.y += s.speed;
      if (s.y > H + 4) {
        s.y = -4;
        s.x = Math.random() * W;
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

/* ════════════════════════════════════════════════
   ② GLITTER PARTICLES
════════════════════════════════════════════════ */
(function initGlitter() {
  const layer = document.getElementById('glitter-layer');
  const COLORS = ['#a855f7','#06b6d4','#ec4899','#fbbf24','#e8e0ff','#7b2fff','#34d399'];
  const COUNT = 35;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'glitter-particle';
    const size = 2 + Math.random() * 5;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dur   = 6 + Math.random() * 12;
    const delay = Math.random() * 14;
    const left  = Math.random() * 100;

    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      background:${color};
      box-shadow: 0 0 ${size*2}px ${color};
      animation-duration:${dur}s;
      animation-delay:${delay}s;
    `;
    layer.appendChild(p);
  }
})();

/* ════════════════════════════════════════════════
   ③ GAME STATE
════════════════════════════════════════════════ */
const STATE = {
  min: 1, max: 100,
  maxTries: 10,
  secret: 0,
  guesses: 0,
  triesLeft: 0,
  history: [],
  active: false,
  wins: 0, losses: 0, streak: 0, bestScore: null,
};

/* ════════════════════════════════════════════════
   ④ DOM REFS
════════════════════════════════════════════════ */
const $  = id => document.getElementById(id);
const el = {
  diffBtns:     document.querySelectorAll('.diff-btn'),
  rangeDisplay: $('range-display'),
  triesDots:    $('tries-dots'),
  guessCount:   $('guess-count'),
  progressFill: $('progress-fill'),
  progressShip: $('progress-ship'),
  compass:      $('compass'),
  compassLabel: $('compass-label'),
  guessInput:   $('guess-input'),
  launchBtn:    $('launch-btn'),
  aimSlider:    $('aim-slider'),
  sliderVal:    $('slider-val'),
  historyList:  $('history-list'),
  newGameBtn:   $('new-game-btn'),
  hintBtn:      $('hint-btn'),
  resultOverlay: $('result-overlay'),
  resultIcon:   $('result-icon'),
  resultTitle:  $('result-title'),
  resultMsg:    $('result-msg'),
  resultStars:  $('result-stars'),
  playAgainBtn: $('play-again-btn'),
  winsCount:    $('wins-count'),
  lossCount:    $('loss-count'),
  streakCount:  $('streak-count'),
  bestScore:    $('best-score'),
};

/* ════════════════════════════════════════════════
   ⑤ DIFFICULTY SELECTION
════════════════════════════════════════════════ */
el.diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    el.diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    STATE.min      = +btn.dataset.min;
    STATE.max      = +btn.dataset.max;
    STATE.maxTries = +btn.dataset.tries;
    newGame();
  });
});

/* ════════════════════════════════════════════════
   ⑥ CORE GAME FUNCTIONS
════════════════════════════════════════════════ */
function newGame() {
  STATE.secret   = Math.floor(Math.random() * (STATE.max - STATE.min + 1)) + STATE.min;
  STATE.guesses  = 0;
  STATE.triesLeft = STATE.maxTries;
  STATE.history  = [];
  STATE.active   = true;

  // Update slider range
  el.aimSlider.min   = STATE.min;
  el.aimSlider.max   = STATE.max;
  el.aimSlider.value = Math.floor((STATE.min + STATE.max) / 2);
  el.sliderVal.textContent = el.aimSlider.value;

  el.rangeDisplay.textContent = `${STATE.min} – ${STATE.max}`;
  el.guessCount.textContent   = '0';
  el.guessInput.value         = '';
  el.guessInput.disabled      = false;
  el.launchBtn.disabled       = false;

  renderDots();
  setProgress(0);
  setCompass('🛸 探測訊號等待中…', '');
  renderHistory();
  el.resultOverlay.classList.add('hidden');
  el.guessInput.focus();
}

function renderDots() {
  el.triesDots.innerHTML = '';
  for (let i = 0; i < STATE.maxTries; i++) {
    const d = document.createElement('div');
    d.className = 'try-dot' + (i >= STATE.triesLeft ? ' used' : '');
    el.triesDots.appendChild(d);
  }
}

function setProgress(pct) {
  el.progressFill.style.width = pct + '%';
  el.progressShip.style.left  = Math.min(pct, 96) + '%';
}

function setCompass(label, type) {
  el.compassLabel.textContent = label;
  el.compass.className = 'compass' + (type ? ' ' + type : '');
}

function tempEmoji(dist) {
  if (dist <= 3)  return { emoji: '🔥', cls: 'temp-hot',  word: '極度接近！' };
  if (dist <= 10) return { emoji: '♨️', cls: 'temp-warm', word: '很接近！' };
  if (dist <= 25) return { emoji: '🌊', cls: 'temp-cool', word: '有點涼…' };
  return              { emoji: '❄️', cls: 'temp-cold', word: '冰冷，很遠！' };
}

function makeGuess() {
  if (!STATE.active) return;

  const raw = el.guessInput.value.trim();
  const num = parseInt(raw, 10);

  if (isNaN(num) || num < STATE.min || num > STATE.max) {
    el.guessInput.classList.add('shake');
    el.guessInput.addEventListener('animationend', () => el.guessInput.classList.remove('shake'), { once: true });
    showToast(`⚠️ 請輸入 ${STATE.min} ~ ${STATE.max} 之間的數字！`);
    return;
  }

  // Already guessed?
  if (STATE.history.some(h => h.num === num)) {
    showToast('🔁 你已經猜過這個數字了！');
    return;
  }

  STATE.guesses++;
  STATE.triesLeft--;
  el.guessCount.textContent = STATE.guesses;
  el.guessInput.value = '';

  const dist = Math.abs(num - STATE.secret);
  const pct  = (STATE.guesses / STATE.maxTries) * 100;
  setProgress(pct);
  renderDots();

  if (num === STATE.secret) {
    // WIN
    STATE.history.push({ num, dir: '正確！', win: true });
    renderHistory();
    setCompass('🎉 正確！任務成功！', 'win');
    endGame(true);
    return;
  }

  const direction = num < STATE.secret ? 'higher' : 'lower';
  const dirText   = num < STATE.secret ? '📈 太小了！往更大的數字搜尋' : '📉 太大了！往更小的數字搜尋';
  const temp      = tempEmoji(dist);

  STATE.history.push({ num, dir: dirText, direction, temp, idx: STATE.guesses });
  renderHistory();

  setCompass(
    `${temp.emoji} ${num < STATE.secret ? '↑ 更大' : '↓ 更小'} · ${temp.word} (差 ${dist})`,
    num < STATE.secret ? 'higher' : 'lower'
  );

  if (dist <= 5) {
    // pulse glow
    el.compass.style.animation = '';
    void el.compass.offsetWidth;
  }

  if (STATE.triesLeft <= 0) {
    endGame(false);
  }
}

function endGame(won) {
  STATE.active = false;
  el.guessInput.disabled = true;
  el.launchBtn.disabled  = true;

  if (won) {
    STATE.wins++;
    STATE.streak++;
    if (STATE.bestScore === null || STATE.guesses < STATE.bestScore) STATE.bestScore = STATE.guesses;
    showResult(true);
  } else {
    STATE.losses++;
    STATE.streak = 0;
    showResult(false);
  }
  updateStats();
}

function showResult(won) {
  const efficiency = Math.round(((STATE.maxTries - STATE.guesses) / STATE.maxTries) * 100);
  const stars      = won ? getStars(STATE.guesses, STATE.maxTries) : '💀';

  el.resultIcon.textContent  = won ? '🎉' : '💥';
  el.resultTitle.textContent = won ? '任務成功！MISSION CLEAR!' : '任務失敗！GAME OVER';
  el.resultStars.textContent = stars;

  if (won) {
    el.resultMsg.innerHTML = `
      🎯 答案是 <strong>${STATE.secret}</strong><br>
      你用了 <strong>${STATE.guesses}</strong> 次猜到！<br>
      效率評分：<strong>${efficiency}%</strong> ✨
    `;
    burstParticles();
  } else {
    el.resultMsg.innerHTML = `
      😢 答案是 <strong>${STATE.secret}</strong><br>
      你用盡了所有 ${STATE.maxTries} 次機會。<br>
      再接再厲！加油 💪
    `;
  }

  el.resultOverlay.classList.remove('hidden');
}

function getStars(guesses, max) {
  const ratio = guesses / max;
  if (ratio <= .2) return '⭐⭐⭐⭐⭐ LEGENDARY';
  if (ratio <= .35) return '⭐⭐⭐⭐ EXCELLENT';
  if (ratio <= .55) return '⭐⭐⭐ GREAT';
  if (ratio <= .75) return '⭐⭐ GOOD';
  return '⭐ CLOSE CALL';
}

function burstParticles() {
  const symbols = ['✦','🌟','💫','✨','🎆','🪐','⭐','🌌','💜'];
  for (let i = 0; i < 20; i++) {
    const b   = document.createElement('div');
    b.className = 'burst';
    b.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const angle = Math.random() * 360;
    const dist  = 120 + Math.random() * 200;
    const rad   = angle * Math.PI / 180;
    const tx    = `translateX(${Math.cos(rad)*dist}px)`;
    const ty    = `translateY(${Math.sin(rad)*dist}px)`;
    b.style.cssText = `
      left: ${30+Math.random()*40}%;
      top:  ${20+Math.random()*40}%;
      --tx: ${tx}; --ty: ${ty};
      animation-delay: ${Math.random()*.4}s;
      animation-duration: ${.9+Math.random()*.5}s;
    `;
    document.body.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
}

function updateStats() {
  el.winsCount.textContent  = STATE.wins;
  el.lossCount.textContent  = STATE.losses;
  el.streakCount.textContent = STATE.streak;
  el.bestScore.textContent  = STATE.bestScore !== null ? STATE.bestScore + ' 次' : '—';
}

/* ════════════════════════════════════════════════
   ⑦ HISTORY RENDER
════════════════════════════════════════════════ */
function renderHistory() {
  if (STATE.history.length === 0) {
    el.historyList.innerHTML = '<p class="history-empty">還沒有紀錄。開始你的星際任務！</p>';
    return;
  }
  el.historyList.innerHTML = '';
  const reversed = [...STATE.history].reverse();
  reversed.forEach((h, i) => {
    const item = document.createElement('div');
    item.className = 'history-item ' + (h.win ? 'win' : (h.direction || 'lose'));
    if (h.win) {
      item.innerHTML = `
        <span class="h-num">${h.num}</span>
        <span class="h-dir" style="color:#22c55e;">🎉 答對了！</span>
        <span class="h-temp">✅</span>
        <span class="h-idx">#${STATE.history.length - i}</span>
      `;
    } else {
      item.innerHTML = `
        <span class="h-num">${h.num}</span>
        <span class="h-dir">${h.dir}</span>
        <span class="h-temp ${h.temp.cls}">${h.temp.emoji}</span>
        <span class="h-idx">#${STATE.history.length - i}</span>
      `;
    }
    el.historyList.appendChild(item);
  });
}

/* ════════════════════════════════════════════════
   ⑧ HINT SYSTEM (binary range hint)
════════════════════════════════════════════════ */
function giveHint() {
  if (!STATE.active) { showToast('請先開始遊戲！'); return; }
  if (STATE.history.length === 0) {
    showToast(`💡 提示：嘗試中間值 ${Math.floor((STATE.min+STATE.max)/2)}`);
    return;
  }
  // Derive current search range
  let lo = STATE.min, hi = STATE.max;
  STATE.history.forEach(h => {
    if (!h.win) {
      if (h.direction === 'higher') lo = Math.max(lo, h.num + 1);
      else                          hi = Math.min(hi, h.num - 1);
    }
  });
  const mid = Math.floor((lo + hi) / 2);
  showToast(`💡 搜尋範圍：${lo} ~ ${hi} · 試試 ${mid}！`);
  el.guessInput.value   = mid;
  el.aimSlider.value    = mid;
  el.sliderVal.textContent = mid;
}

/* ════════════════════════════════════════════════
   ⑨ TOAST
════════════════════════════════════════════════ */
function showToast(msg) {
  document.querySelectorAll('.hint-toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className   = 'hint-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

/* ════════════════════════════════════════════════
   ⑩ EVENT LISTENERS
════════════════════════════════════════════════ */
el.launchBtn.addEventListener('click', makeGuess);
el.newGameBtn.addEventListener('click', newGame);
el.hintBtn.addEventListener('click', giveHint);
el.playAgainBtn.addEventListener('click', newGame);

el.guessInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') makeGuess();
});

el.aimSlider.addEventListener('input', () => {
  el.sliderVal.textContent = el.aimSlider.value;
  el.guessInput.value      = el.aimSlider.value;
});

/* ════════════════════════════════════════════════
   ⑪ PARALLAX MOUSE
════════════════════════════════════════════════ */
document.addEventListener('mousemove', e => {
  const mx = (e.clientX / window.innerWidth  - .5) * 20;
  const my = (e.clientY / window.innerHeight - .5) * 20;
  document.querySelectorAll('.nebula-ring').forEach((r, i) => {
    const factor = (i + 1) * .4;
    r.style.transform = (i === 2)
      ? `translate(calc(-50% + ${mx*factor}px), calc(-50% + ${my*factor}px)) rotate(0deg)`
      : `translate(${mx*factor}px, ${my*factor}px) rotate(0deg)`;
  });
});

/* ════════════════════════════════════════════════
   ⑫ BOOT
════════════════════════════════════════════════ */
newGame();
