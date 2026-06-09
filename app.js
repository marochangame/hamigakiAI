(() => {
  'use strict';

  const TOTAL_SECONDS = 90;
  const milestones = [
    { at: 20, germ: 1, stage: 'clean-1', text: 'すこしキレイ！', sparkleCount: 10, sound: 'small' },
    { at: 50, germ: 2, stage: 'clean-2', text: 'キレイになってるよ！', sparkleCount: 13, sound: 'middle' },
    { at: 70, germ: 3, stage: 'clean-3', text: 'バイキンいなくなった！', sparkleCount: 18, sound: 'clear' },
    { at: 90, germ: null, stage: 'reward', text: 'ピカピカできた！', sparkleCount: 42, sound: 'reward' }
  ];

  const stage = document.getElementById('stage');
  const startButton = document.getElementById('startButton');
  const message = document.getElementById('message');
  const timer = document.getElementById('timer');
  const progressBar = document.getElementById('progressBar');
  const upperTeeth = document.getElementById('upperTeeth');
  const lowerTeeth = document.getElementById('lowerTeeth');
  const bubbleLayer = document.getElementById('bubbleLayer');
  const sparkleLayer = document.getElementById('sparkleLayer');
  const brush = document.getElementById('brush');

  let rafId = null;
  let bubbleTimer = null;
  let sparkleTimer = null;
  let startAt = 0;
  let completed = false;
  let audioCtx = null;
  const reached = new Set();

  function buildTeeth() {
    upperTeeth.innerHTML = '';
    lowerTeeth.innerHTML = '';
    for (let i = 0; i < 8; i += 1) {
      const upper = document.createElement('div');
      upper.className = 'tooth';
      upperTeeth.appendChild(upper);
      const lower = document.createElement('div');
      lower.className = 'tooth';
      lowerTeeth.appendChild(lower);
    }
  }

  function resetGame() {
    cancelAnimationFrame(rafId);
    clearInterval(bubbleTimer);
    clearInterval(sparkleTimer);
    rafId = null;
    bubbleTimer = null;
    sparkleTimer = null;
    completed = false;
    reached.clear();
    stage.className = 'stage';
    bubbleLayer.innerHTML = '';
    sparkleLayer.innerHTML = '';
    document.querySelectorAll('.germ').forEach((germ) => germ.classList.remove('gone'));
    document.querySelectorAll('.tooth').forEach((tooth) => tooth.classList.remove('polished'));
    timer.textContent = String(TOTAL_SECONDS);
    progressBar.style.width = '0%';
    message.textContent = 'リンゴをおしてね';
    message.classList.remove('hidden', 'pop');
    startButton.classList.remove('hidden');
    startButton.classList.add('ready');
    startButton.setAttribute('aria-label', 'スタート');
  }

  function startGame() {
    initAudio();
    resetGame();
    startAt = performance.now();
    stage.classList.add('running');
    startButton.classList.add('hidden');
    startButton.classList.remove('ready');
    showMessage('シャカシャカみがこう！');
    playTone('start');
    beginParticles();
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    const elapsed = Math.min(TOTAL_SECONDS, (now - startAt) / 1000);
    const remaining = Math.max(0, Math.ceil(TOTAL_SECONDS - elapsed));
    timer.textContent = String(remaining);
    progressBar.style.width = `${(elapsed / TOTAL_SECONDS) * 100}%`;

    for (const item of milestones) {
      if (elapsed >= item.at && !reached.has(item.at)) {
        reached.add(item.at);
        applyMilestone(item);
      }
    }

    if (elapsed < TOTAL_SECONDS) {
      rafId = requestAnimationFrame(tick);
    } else if (!completed) {
      finishGame();
    }
  }

  function applyMilestone(item) {
    stage.classList.add(item.stage, 'pause-brush');
    setTimeout(() => stage.classList.remove('pause-brush'), 720);
    showMessage(item.text);
    playTone(item.sound);
    addCleanRipple(item.sound === 'reward');
    polishSomeTeeth(item.at);

    setTimeout(() => {
      if (!completed && item.at < 90) showMessage('シャカシャカみがこう！');
    }, 2200);

    if (item.germ) {
      const germ = document.querySelector(`[data-germ="${item.germ}"]`);
      sparkleBurstAround(germ, item.sparkleCount);
      if (germ) germ.classList.add('gone');
    } else {
      rewardSparkles(item.sparkleCount);
    }
  }

  function finishGame() {
    completed = true;
    clearInterval(bubbleTimer);
    clearInterval(sparkleTimer);
    stage.classList.remove('running');
    stage.classList.add('reward');
    showMessage('ピカピカできた！');
    timer.textContent = '0';
    progressBar.style.width = '100%';
    addCleanRipple(true);
    rewardSparkles(48);
    setTimeout(() => {
      startButton.classList.remove('hidden');
      startButton.classList.add('ready');
      startButton.setAttribute('aria-label', 'もう一回');
      showMessage('もういっかい？');
    }, 1200);
  }

  function showMessage(text) {
    message.textContent = text;
    message.classList.remove('pop');
    // restart CSS animation safely
    void message.offsetWidth;
    message.classList.add('pop');
  }

  function beginParticles() {
    bubbleTimer = setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const count = elapsed > 70 ? 3 : elapsed > 50 ? 2 : 1;
      for (let i = 0; i < count; i += 1) createBubbleNearBrush(elapsed);
    }, 420);

    sparkleTimer = setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const chance = elapsed > 70 ? 0.66 : elapsed > 50 ? 0.42 : 0.17;
      if (Math.random() < chance) createSparkle(elapsed > 70);
    }, 820);
  }

  function createBubbleNearBrush(elapsed) {
    const stageBox = stage.getBoundingClientRect();
    const brushBox = brush.getBoundingClientRect();
    const x = brushBox.left - stageBox.left + brushBox.width * (0.72 + Math.random() * 0.22);
    const y = brushBox.top - stageBox.top + brushBox.height * (0.28 + Math.random() * 0.45);
    const bubble = document.createElement('span');
    bubble.className = 'bubble';
    const maxSize = elapsed > 70 ? 13 : 11;
    const size = 7 + Math.random() * maxSize;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.setProperty('--dx', `${-14 + Math.random() * 28}px`);
    bubble.style.setProperty('--dy', `${-24 - Math.random() * 24}px`);
    bubbleLayer.appendChild(bubble);
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  }

  function createSparkle(isReward = false) {
    const sparkle = document.createElement('span');
    sparkle.className = `sparkle${isReward ? ' reward-spark' : ''}`;
    const x = isReward ? 16 + Math.random() * 68 : 24 + Math.random() * 52;
    const y = isReward ? 18 + Math.random() * 62 : 24 + Math.random() * 48;
    sparkle.style.left = `${x}%`;
    sparkle.style.top = `${y}%`;
    sparkleLayer.appendChild(sparkle);
    sparkle.addEventListener('animationend', () => sparkle.remove(), { once: true });
  }

  function sparkleBurstAround(element, count) {
    if (!element) return;
    const stageBox = stage.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const centerX = box.left - stageBox.left + box.width / 2;
    const centerY = box.top - stageBox.top + box.height / 2;
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${centerX - 18 + Math.random() * 36}px`;
        sparkle.style.top = `${centerY - 18 + Math.random() * 36}px`;
        sparkleLayer.appendChild(sparkle);
        sparkle.addEventListener('animationend', () => sparkle.remove(), { once: true });
      }, i * 45);
    }
  }

  function rewardSparkles(count) {
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => createSparkle(true), i * 36);
    }
  }

  function addCleanRipple(isReward) {
    const ripple = document.createElement('span');
    ripple.className = `clean-ripple${isReward ? ' reward-ring' : ''}`;
    sparkleLayer.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  function polishSomeTeeth(at) {
    const teeth = Array.from(document.querySelectorAll('.tooth'));
    let indexes;
    if (at === 20) indexes = [2, 3, 10, 11];
    else if (at === 50) indexes = [1, 4, 5, 9, 12, 13];
    else indexes = teeth.map((_, i) => i);
    indexes.forEach((index, order) => {
      const tooth = teeth[index];
      if (!tooth) return;
      setTimeout(() => {
        tooth.classList.remove('polished');
        void tooth.offsetWidth;
        tooth.classList.add('polished');
      }, order * 45);
    });
  }

  function initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {
      audioCtx = null;
    }
  }

  function playTone(type) {
    if (!audioCtx) return;
    const presets = {
      start: [523, 660],
      small: [660, 880],
      middle: [660, 784, 988],
      clear: [784, 988, 1175],
      reward: [660, 880, 1047, 1319]
    };
    const notes = presets[type] || presets.small;
    const now = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const t = now + i * 0.075;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(type === 'reward' ? 0.11 : 0.075, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  buildTeeth();
  resetGame();
  startButton.addEventListener('click', startGame);
})();
