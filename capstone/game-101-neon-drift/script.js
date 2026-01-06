/* Game 101 — Neon Drift: Survival Sprint (DOM-only)
   Systems: state, loop, input, dash cooldown, enemy spawn + chase, collisions, scaling, persistence, UI flow
*/
const $ = (s) => document.querySelector(s);

const stage = document.querySelector(".stage");
const playerEl = $("#player");
const orbEl = $("#orb");
const enemiesEl = $("#enemies");
const toastEl = $("#toast");

const startBtn = $("#startBtn");
const resetBtn = $("#resetBtn");
const howBtn = $("#howBtn");
const settingsBtn = $("#settingsBtn");
const pauseBtn = $("#pauseBtn");

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");
const closeModal = $("#closeModal");

const scoreEl = $("#score");
const bestEl = $("#best");
const livesEl = $("#lives");

const KEY = {
  left: false, right: false, up: false, down: false,
  dash: false
};

const storeKey = "neonDrift.v1";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

function rect(el) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}
function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const state = {
  running: false,
  paused: false,
  tLast: 0,
  score: 0,
  best: 0,
  lives: 3,
  level: 1,
  speed: 220,     // px/sec
  dashSpeed: 520, // px/sec
  dashMs: 140,
  dashCooldownMs: 700,
  dashLeft: 0,
  dashCooldown: 0,
  enemyBaseSpeed: 80,
  enemySpawnEvery: 1150,
  enemySpawnTimer: 0,
  enemies: [],
  orb: { x: 0, y: 0 },
  player: { x: 0, y: 0, vx: 0, vy: 0 }
};

function announce(msg) {
  toastEl.textContent = msg;
}

function loadState() {
  try {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.best === "number") state.best = data.best;
    if (data.settings) {
      state.enemySpawnEvery = data.settings.enemySpawnEvery ?? state.enemySpawnEvery;
      state.enemyBaseSpeed = data.settings.enemyBaseSpeed ?? state.enemyBaseSpeed;
    }
  } catch {}
  bestEl.textContent = state.best;
}

function saveState() {
  const data = {
    best: state.best,
    settings: {
      enemySpawnEvery: state.enemySpawnEvery,
      enemyBaseSpeed: state.enemyBaseSpeed
    }
  };
  localStorage.setItem(storeKey, JSON.stringify(data));
}

function setHUD() {
  scoreEl.textContent = state.score;
  bestEl.textContent = state.best;
  livesEl.textContent = state.lives;
}

function placePlayer() {
  const w = stage.clientWidth, h = stage.clientHeight;
  state.player.x = w * 0.5;
  state.player.y = h * 0.78;
  renderPlayer();
}

function placeOrb() {
  const w = stage.clientWidth, h = stage.clientHeight;
  state.orb.x = rand(20, w - 38);
  state.orb.y = rand(20, h - 38);
  orbEl.style.left = state.orb.x + "px";
  orbEl.style.top = state.orb.y + "px";
}

function renderPlayer() {
  playerEl.style.left = state.player.x + "px";
  playerEl.style.top = state.player.y + "px";
}

function clearEnemies() {
  state.enemies.forEach(e => e.el.remove());
  state.enemies = [];
}

function spawnEnemy() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const edge = (Math.random() * 4) | 0;
  let x = 0, y = 0;
  if (edge === 0) { x = rand(0, w - 22); y = -24; }
  if (edge === 1) { x = w + 24; y = rand(0, h - 22); }
  if (edge === 2) { x = rand(0, w - 22); y = h + 24; }
  if (edge === 3) { x = -24; y = rand(0, h - 22); }

  const el = document.createElement("div");
  el.className = "enemy";
  el.style.left = x + "px";
  el.style.top = y + "px";
  enemiesEl.appendChild(el);

  const spd = state.enemyBaseSpeed + state.level * 10 + rand(-8, 18);
  state.enemies.push({ x, y, spd, el, iFrames: 0 });
}

function resetRun() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.enemySpawnTimer = 0;
  state.dashLeft = 0;
  state.dashCooldown = 0;
  clearEnemies();
  placePlayer();
  placeOrb();
  setHUD();
  announce("Ready. Press Start.");
}

function setPaused(p) {
  state.paused = p;
  pauseBtn.setAttribute("aria-pressed", String(p));
  pauseBtn.textContent = p ? "Resume (P)" : "Pause (P)";
  announce(p ? "Paused" : "Resumed");
}

function update(dt) {
  // difficulty scaling
  state.level = 1 + Math.floor(state.score / 10);

  // dash timers
  state.dashLeft = Math.max(0, state.dashLeft - dt);
  state.dashCooldown = Math.max(0, state.dashCooldown - dt);

  // movement
  let vx = 0, vy = 0;
  if (KEY.left) vx -= 1;
  if (KEY.right) vx += 1;
  if (KEY.up) vy -= 1;
  if (KEY.down) vy += 1;

  const mag = Math.hypot(vx, vy) || 1;
  vx /= mag; vy /= mag;

  const base = state.dashLeft > 0 ? state.dashSpeed : state.speed;
  state.player.x += vx * base * dt;
  state.player.y += vy * base * dt;

  state.player.x = clamp(state.player.x, 0, stage.clientWidth - 26);
  state.player.y = clamp(state.player.y, 0, stage.clientHeight - 26);

  // enemy spawn
  const spawnEvery = Math.max(450, state.enemySpawnEvery - state.level * 35);
  state.enemySpawnTimer += dt * 1000;
  if (state.enemySpawnTimer >= spawnEvery) {
    state.enemySpawnTimer = 0;
    spawnEnemy();
  }

  // enemies chase
  const px = state.player.x, py = state.player.y;
  state.enemies.forEach(e => {
    const dx = px - e.x, dy = py - e.y;
    const m = Math.hypot(dx, dy) || 1;
    e.x += (dx / m) * e.spd * dt;
    e.y += (dy / m) * e.spd * dt;
    e.el.style.left = e.x + "px";
    e.el.style.top = e.y + "px";
    e.iFrames = Math.max(0, e.iFrames - dt);
  });

  // orb collection
  const pr = rect(playerEl);
  const or = rect(orbEl);
  if (hit(pr, or)) {
    state.score += 1;
    if (state.score > state.best) {
      state.best = state.score;
      saveState();
    }
    setHUD();
    placeOrb();
    announce("Orb collected!");
  }

  // collisions
  for (const e of state.enemies) {
    if (e.iFrames > 0) continue;
    const er = rect(e.el);
    if (hit(pr, er)) {
      e.iFrames = 0.6; // small grace
      state.lives -= 1;
      setHUD();
      announce("Hit! Lost a life.");
      if (state.lives <= 0) {
        endGame();
        break;
      }
    }
  }
}

let raf = 0;
function loop(ts) {
  if (!state.running) return;
  if (!state.tLast) state.tLast = ts;
  const dt = Math.min(0.033, (ts - state.tLast) / 1000);
  state.tLast = ts;

  if (!state.paused) {
    update(dt);
    renderPlayer();
  }
  raf = requestAnimationFrame(loop);
}

function startGame() {
  if (state.running) return;
  state.running = true;
  state.paused = false;
  state.tLast = 0;
  announce("Go!");
  raf = requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(raf);
  announce(`Game Over. Score ${state.score}. Best ${state.best}.`);
  playModal("Game Over", `
    <p><strong>Score:</strong> ${state.score}</p>
    <p><strong>Best:</strong> ${state.best}</p>
    <p>Try again and beat your best score.</p>
  `);
}

function playModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
  closeModal.focus();
}

function closeTheModal() {
  modal.classList.add("hidden");
}

function openHow() {
  playModal("How to Play", `
    <ul>
      <li>Move: <kbd>WASD</kbd> or <kbd>Arrow Keys</kbd></li>
      <li>Dash: <kbd>Space</kbd> (short burst + cooldown)</li>
      <li>Pause: <kbd>P</kbd> or Pause button</li>
      <li>Collect orbs for points; avoid enemies.</li>
      <li>Difficulty increases as your score rises.</li>
    </ul>
  `);
}

function openSettings() {
  playModal("Settings", `
    <p>These affect challenge pacing and are saved.</p>
    <label>Enemy spawn base (ms)
      <input id="spawnEvery" type="number" min="450" max="2000" step="50" value="${state.enemySpawnEvery}">
    </label>
    <br/><br/>
    <label>Enemy base speed
      <input id="enemySpeed" type="number" min="40" max="220" step="5" value="${state.enemyBaseSpeed}">
    </label>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
      <button id="saveSet" class="btn">Save</button>
    </div>
  `);
  setTimeout(() => {
    $("#saveSet").addEventListener("click", () => {
      state.enemySpawnEvery = clamp(+$("#spawnEvery").value, 450, 2000);
      state.enemyBaseSpeed = clamp(+$("#enemySpeed").value, 40, 220);
      saveState();
      announce("Settings saved.");
      closeTheModal();
    });
  }, 0);
}

function tryDash() {
  if (!state.running || state.paused) return;
  if (state.dashCooldown > 0) return;
  state.dashLeft = state.dashMs / 1000;
  state.dashCooldown = state.dashCooldownMs / 1000;
  announce("Dash!");
}

// Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") KEY.left = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") KEY.right = true;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") KEY.up = true;
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") KEY.down = true;
  if (e.key === " "){ e.preventDefault(); tryDash(); }
  if (e.key === "p" || e.key === "P") {
    if (!state.running) return;
    setPaused(!state.paused);
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") KEY.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") KEY.right = false;
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") KEY.up = false;
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") KEY.down = false;
});

startBtn.addEventListener("click", () => startGame());
resetBtn.addEventListener("click", () => { state.running=false; cancelAnimationFrame(raf); resetRun(); });
howBtn.addEventListener("click", openHow);
settingsBtn.addEventListener("click", openSettings);
pauseBtn.addEventListener("click", () => {
  if (!state.running) return;
  setPaused(!state.paused);
});
closeModal.addEventListener("click", closeTheModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeTheModal(); });

window.addEventListener("resize", () => {
  // keep inside bounds
  state.player.x = clamp(state.player.x, 0, stage.clientWidth - 26);
  state.player.y = clamp(state.player.y, 0, stage.clientHeight - 26);
  renderPlayer();
  placeOrb();
});

// init
loadState();
resetRun();
