(() => {
  'use strict';

  const TOTAL_SECONDS = 90;
  const milestones = [
    { at: 20, germ: 1, stage: 'clean-1', text: 'すこしキレイ！' },
    { at: 50, germ: 2, stage: 'clean-2', text: 'キレイになってるよ！' },
    { at: 70, germ: 3, stage: 'clean-3', text: 'バイキンいなくなった！' },
    { at: 90, germ: null, stage: 'reward', text: 'ピカピカできた！' }
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
    timer.textContent = String(TOTAL_SECONDS);
    progressBar.style.width = '0%';
    message.textContent = 'リンゴをおしてね';
    message.classList.remove('hidden');
    startButton.classList.remove('hidden');
  }

  function startGame() {
    resetGame();
    startAt = performance.now();
    stage.classList.add('running');
    startButton.classList.add('hidden');
    message.textContent = 'シャカシャカみがこう！';
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
    stage.classList.add(item.stage);
    message.textContent = item.text;
    setTimeout(() => {
      if (!completed && item.at < 90) message.textContent = 'シャカシャカみがこう！';
    }, 2200);

    if (item.germ) {
      const germ = document.querySelector(`[data-germ="${item.germ}"]`);
      sparkleBurstAround(germ, item.germ === 3 ? 14 : 9);
      germ.classList.add('gone');
    } else {
      rewardSparkles(34);
    }
  }

  function finishGame() {
    completed = true;
    clearInterval(bubbleTimer);
    clearInterval(sparkleTimer);
    stage.classList.remove('running');
    stage.classList.add('reward');
    message.textContent = 'ピカピカできた！';
    timer.textContent = '0';
    progressBar.style.width = '100%';
    rewardSparkles(42);
    setTimeout(() => {
      startButton.classList.remove('hidden');
      startButton.setAttribute('aria-label', 'もう一回');
      message.textContent = 'もういっかい？';
    }, 1200);
  }

  function beginParticles() {
    bubbleTimer = setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const count = elapsed > 70 ? 3 : elapsed > 50 ? 2 : 1;
      for (let i = 0; i < count; i += 1) createBubbleNearBrush();
    }, 420);

    sparkleTimer = setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const chance = elapsed > 70 ? 0.7 : elapsed > 50 ? 0.45 : 0.22;
      if (Math.random() < chance) createSparkle(elapsed > 70);
    }, 760);
  }

  function createBubbleNearBrush() {
    const stageBox = stage.getBoundingClientRect();
    const brushBox = brush.getBoundingClientRect();
    const x = brushBox.left - stageBox.left + brushBox.width * (0.72 + Math.random() * 0.22);
    const y = brushBox.top - stageBox.top + brushBox.height * (0.28 + Math.random() * 0.45);
    const bubble = document.createElement('span');
    bubble.className = 'bubble';
    const size = 8 + Math.random() * 12;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.setProperty('--dx', `${-18 + Math.random() * 36}px`);
    bubble.style.setProperty('--dy', `${-30 - Math.random() * 32}px`);
    bubbleLayer.appendChild(bubble);
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  }

  function createSparkle(isReward = false) {
    const sparkle = document.createElement('span');
    sparkle.className = `sparkle${isReward ? ' reward-spark' : ''}`;
    const x = 18 + Math.random() * 64;
    const y = 20 + Math.random() * 58;
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
        sparkle.style.left = `${centerX - 14 + Math.random() * 28}px`;
        sparkle.style.top = `${centerY - 14 + Math.random() * 28}px`;
        sparkleLayer.appendChild(sparkle);
        sparkle.addEventListener('animationend', () => sparkle.remove(), { once: true });
      }, i * 55);
    }
  }

  function rewardSparkles(count) {
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => createSparkle(true), i * 42);
    }
  }

  buildTeeth();
  resetGame();
  startButton.addEventListener('click', startGame);
})();
