const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

const healthValue = document.getElementById('healthValue');
const scoreValue = document.getElementById('scoreValue');
const timeValue = document.getElementById('timeValue');
const levelValue = document.getElementById('levelValue');
const weaponValue = document.getElementById('weaponValue');
const woodActionButton = document.getElementById('woodActionButton');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');
const toadToggle = document.getElementById('toadToggle');
const roomCodeInput = document.getElementById('roomCodeInput');
const joinRoomButton = document.getElementById('joinRoomButton');
const hostRoomButton = document.getElementById('hostRoomButton');
const playerNameInput = document.getElementById('playerNameInput');

const roomStoragePrefix = 'frog-wars-room:';
const roomChannel = 'frog-wars-room-sync';
const fullWeaponNames = new Set([
  'kyle jones',
  'johnathan cardon',
  'fredrick sosa',
  'giovanni avila',
  'henry nguyen',
  'liam kitchen',
]);
const restrictedWeaponIndices = [0, 47];
const roomState = {
  code: '',
  toadEnabled: true,
};

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);

  world.width = width;
  world.height = height;
  world.islandRadius = Math.max(width, height);
  world.groundTop = height * 0.2;
  world.centerX = width / 2;
  world.centerY = height * 0.57;
  world.trees = [];

  for (let y = world.groundTop + 36; y < height - 24; y += 74) {
    for (let x = 34; x < width - 24; x += 78) {
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const jitter = seed - Math.floor(seed);
      world.trees.push({
        x: x + (jitter - 0.5) * 34,
        y: y + (jitter - 0.5) * 32,
        size: 23 + jitter * 13,
        shade: Math.floor(jitter * 3),
      });
    }
  }
}

const world = {
  width: canvas.width,
  height: canvas.height,
  islandRadius: 150,
  groundTop: canvas.height * 0.2,
  centerX: canvas.width / 2,
  centerY: canvas.height / 2 + 10,
  trees: [],
};

const keys = {};
const projectiles = [];
const berries = [];
const squids = [];
const woodPiles = [];
const fortWalls = [];
const pointer = { x: world.centerX, y: world.centerY };

const weapons = [
  { name: 'Poison Farts', fireRate: 0.28, damage: 1000000, pellets: 1, speed: 360, spread: 0.08, color: '#dff6ff' },
  { name: 'Triple Shot', fireRate: 0.38, damage: 7, pellets: 3, speed: 330, spread: 0.28, color: '#d6ffe9' },
  { name: 'Plasma Burst', fireRate: 0.18, damage: 14, pellets: 5, speed: 420, spread: 0.45, color: '#ffd97a' },
  { name: 'Thorn Launcher', fireRate: 0.32, damage: 13, pellets: 1, speed: 390, spread: 0.06, color: '#b8ff6a' },
  { name: 'Berry Blaster', fireRate: 0.42, damage: 8, pellets: 3, speed: 310, spread: 0.3, color: '#ff6685' },
  { name: 'Toxic Sprayer', fireRate: 0.12, damage: 4, pellets: 2, speed: 290, spread: 0.16, color: '#86ff4b' },
  { name: 'Reed Rifle', fireRate: 0.48, damage: 22, pellets: 1, speed: 520, spread: 0.02, color: '#e6ffc2' },
  { name: 'Spore Cannon', fireRate: 0.62, damage: 18, pellets: 4, speed: 250, spread: 0.5, color: '#d69cff' },
  { name: 'Bubble Popper', fireRate: 0.2, damage: 6, pellets: 5, speed: 350, spread: 0.55, color: '#82f5ff' },
  { name: 'Vine Whip', fireRate: 0.22, damage: 16, pellets: 2, speed: 430, spread: 0.12, color: '#49e07c' },
  { name: 'Coconut Mortar', fireRate: 0.8, damage: 32, pellets: 1, speed: 200, spread: 0, color: '#d7a66e' },
  { name: 'Firefly Flare', fireRate: 0.36, damage: 12, pellets: 2, speed: 370, spread: 0.18, color: '#fff06b' },
  { name: 'Coral Crossbow', fireRate: 0.5, damage: 24, pellets: 1, speed: 460, spread: 0.03, color: '#ff9878' },
  { name: 'Frost Fern', fireRate: 0.3, damage: 11, pellets: 4, speed: 340, spread: 0.38, color: '#a7eaff' },
  { name: 'Echo Blaster', fireRate: 0.16, damage: 7, pellets: 1, speed: 480, spread: 400.05, color: '#b6a1ff' },
  { name: 'Sunseed Shooter', fireRate: 0.26, damage: 9, pellets: 6, speed: 300, spread: 0.62, color: '#ffc94d' },
  { name: 'Moonbeam Wand', fireRate: 0.56, damage: 28, pellets: 1, speed: 400, spread: 0, color: '#d3ceff' },
  { name: 'Shell Shaker', fireRate: 0.4, damage: 10, pellets: 5, speed: 320, spread: 0.46, color: '#f6d5aa' },
  { name: 'Kelp Needle', fireRate: 0.1, damage: 5, pellets: 1, speed: 550, spread: 0.1, color: '#57d8b0' },
  { name: 'Lightning Lily', fireRate: 0.34, damage: 15, pellets: 3, speed: 440, spread: 0.2, color: '#fff47a' },
  { name: 'Pollen Blunderbuss', fireRate: 0.7, damage: 20, pellets: 8, speed: 280, spread: 0.7, color: '#ffdd91' },
  { name: 'Magma Seed', fireRate: 0.46, damage: 19, pellets: 2, speed: 350, spread: 0.1, color: '#ff7047' },
  { name: 'Very Stinky Fart', fireRate: 0.000000000000000000000000000000000024, damage: 0.04, pellets: 600, speed: 410, spread:100.000000000000001, color: '#0b1e04' },
  { name: 'Jungle Drummer', fireRate: 0.08, damage: 3, pellets: 3, speed: 300, spread: 0.24, color: '#ffab62' },
  { name: 'Prism Sprayer', fireRate: 0.18, damage: 5, pellets: 7, speed: 360, spread: 0.68, color: '#ff8bdf' },
  { name: 'Thunderseed', fireRate: 0.64, damage: 30, pellets: 1, speed: 500, spread: 0.01, color: '#f4f4ff' },
  { name: 'Tidal Trident', fireRate: 0.38, damage: 12, pellets: 3, speed: 390, spread: 0.3, color: '#54dfff' },
  { name: 'Meteor Pea', fireRate: 0.52, damage: 26, pellets: 1, speed: 260, spread: 0.02, color: '#ff915e' },
  { name: 'Bramble Burst', fireRate: 0.3, damage: 8, pellets: 6, speed: 330, spread: 0.58, color: '#7cff8b' },
  { name: 'Ghost Orchid', fireRate: 0.44, damage: 17, pellets: 2, speed: 470, spread: 0.08, color: '#e2c4ff' },
  { name: 'Sonic Croaker', fireRate: 0.14, damage: 9, pellets: 4, speed: 520, spread: 0.32, color: '#72fff0' },
  { name: 'Amber Acorn', fireRate: 0.58, damage: 25, pellets: 1, speed: 310, spread: 0.02, color: '#ffbb52' },
  { name: 'Vortex Pod', fireRate: 0.28, damage: 6, pellets: 8, speed: 390, spread: 0.78, color: '#9cb2ff' },
  { name: 'Rainstick Repeater', fireRate: 0.09, damage: 4, pellets: 2, speed: 410, spread: 0.14, color: '#66cfff' },
  { name: 'Dawnfire Bow', fireRate: 0.5, damage: 21, pellets: 2, speed: 490, spread: 0.06, color: '#ffb84d' },
  { name: 'Nightshade Needler', fireRate: 0.22, damage: 7, pellets: 4, speed: 450, spread: 0.3, color: '#be83ff' },
  { name: 'Coral Comet', fireRate: 0.68, damage: 34, pellets: 1, speed: 230, spread: 0, color: '#ff797e' },
  { name: 'Swamp Spark', fireRate: 0.32, damage: 10, pellets: 5, speed: 380, spread: 0.48, color: '#b6ff62' },
  { name: 'Starfruit Sling', fireRate: 0.4, damage: 13, pellets: 3, speed: 350, spread: 0.22, color: '#f8ff79' },
  { name: 'Quake Quill', fireRate: 0.74, damage: 29, pellets: 2, speed: 270, spread: 0.12, color: '#d4a47b' },
  { name: 'Aurora Arc', fireRate: 0.2, damage: 8, pellets: 6, speed: 430, spread: 0.6, color: '#8bffe1' },
  { name: 'Ironwood Launcher', fireRate: 0.54, damage: 23, pellets: 1, speed: 360, spread: 0.01, color: '#b9835a' },
  { name: 'Dewdrop Repeater', fireRate: 0.07, damage: 3, pellets: 1, speed: 500, spread: 0.12, color: '#b4faff' },
  { name: 'Wildfire Bloom', fireRate: 0.36, damage: 16, pellets: 4, speed: 320, spread: 0.4, color: '#ff694e' },
  { name: 'Royal Lotus Cannon', fireRate: 0.78, damage: 36, pellets: 3, speed: 240, spread: 0.34, color: '#ff9ce2' },
  { name: 'Island Ranger', fireRate: 0.25, damage: 12, pellets: 2, speed: 530, spread: 0.05, color: '#daffad' },
  { name: 'Frogstar Finale', fireRate: 0.000000000000000000000001, damage: 39.999999999999999999999999999999999999999999999999999999999999999999999999999999999, pellets: 450, speed: 350, spread: 0.85, color: '#fff17a' },
  { name: 'Mangrove Meteor', fireRate: 0.46, damage: 27, pellets: 2, speed: 320, spread: 0.16, color: '#ff8b67' },
];

const basePlayerHealth = 100;

const player = {
  x: world.centerX,
  y: world.centerY,
  r: 18,
  speed: 230,
  health: basePlayerHealth,
  invuln: 0,
  maxHealth: basePlayerHealth,
  fireCooldown: 0,
  weaponIndex: 0,
  wood: 0,
};

const toad = {
  x: world.centerX + 50,
  y: world.centerY + 30,
  r: 20,
  cooldown: 0,
  glow: 0,
};

const rescuePlane = {
  active: false,
  x: -220,
  y: 100,
  speed: 260,
};

const state = {
  running: false,
  elapsed: 0,
  score: 0,
  spawnTimer: 0,
  berryTimer: 0,
  level: 1,
  levelGoal: 10,
  kills: 0,
  woodUsed: 0,
  bossStage: false,
  bossSpawned: false,
  bossHeliTimer: 0,
  campaignMode: false,
  campaignLevel: 1,
  totalCampaignLevels: 100,
  fullWeaponAccess: false,
  best: Number(localStorage.getItem('frog-wars-best') || 0),
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizePlayerName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function currentRoomCode() {
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get('room');
  if (codeFromUrl) {
    const code = codeFromUrl.toUpperCase().slice(0, 8);
    params.set('room', code);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', nextUrl);
    localStorage.setItem('frog-wars-active-room', code);
    return code;
  }

  const activeRoom = localStorage.getItem('frog-wars-active-room');
  if (activeRoom && activeRoom.trim()) {
    return activeRoom.toUpperCase().slice(0, 8);
  }

  return '';
}

function syncRoomSettings() {
  roomState.code = currentRoomCode();
  roomState.toadEnabled = Boolean(toadToggle && toadToggle.checked);
  if (roomCodeInput) roomCodeInput.value = roomState.code;
  const payload = {
    room: roomState.code,
    toadEnabled: roomState.toadEnabled,
    updatedAt: Date.now(),
  };
  localStorage.setItem(`${roomStoragePrefix}${roomState.code}`, JSON.stringify(payload));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(roomChannel);
    channel.postMessage(payload);
    channel.close();
  }
}

function loadRoomSettings() {
  roomState.code = currentRoomCode();
  const stored = localStorage.getItem(`${roomStoragePrefix}${roomState.code}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.toadEnabled === 'boolean') {
        roomState.toadEnabled = parsed.toadEnabled;
      }
    } catch (error) {
      console.warn('Room settings unreadable', error);
    }
  }
  if (toadToggle) toadToggle.checked = roomState.toadEnabled;
  if (roomCodeInput) roomCodeInput.value = roomState.code;
}

function spawnWoodPile(x, y, amount = 5) {
  if (woodPiles.length >= 100) return false;
  woodPiles.push({
    x,
    y,
    r: 24,
    amount,
    pulse: Math.random() * Math.PI * 2,
  });
  return true;
}

function setOverlayVisible(show) {
  overlay.classList.toggle('visible', show);
}

function resetGame() {
  player.x = world.centerX;
  player.y = world.centerY;
  player.maxHealth = basePlayerHealth;
  player.health = player.maxHealth;
  player.invuln = 0;
  player.fireCooldown = 0;
  player.weaponIndex = 0;
  player.wood = 0;

  toad.x = world.centerX + 50;
  toad.y = world.centerY + 30;
  toad.cooldown = 0;

  projectiles.length = 0;
  squids.length = 0;
  berries.length = 0;
  woodPiles.length = 0;
  fortWalls.length = 0;

  for (let i = 0; i < 11; i += 1) {
    const x = 40 + Math.random() * Math.max(1, world.width - 80);
    const y = world.groundTop + 40 + Math.random() * Math.max(1, world.height - world.groundTop - 80);
    if (woodPiles.length < 100) {
      spawnWoodPile(x, y, 10);
    }
  }

  state.elapsed = 0;
  state.score = 0;
  state.spawnTimer = 0;
  state.berryTimer = 0;
  state.level = 1;
  state.levelGoal = 10;
  state.kills = 0;
  state.woodUsed = 0;
  state.bossStage = false;
  state.bossSpawned = false;
  state.bossHeliTimer = 0;
  state.campaignMode = false;
  state.campaignLevel = 1;
  state.running = true;
  rescuePlane.active = false;
  rescuePlane.x = -220;
  rescuePlane.y = 100;
  woodActionButton.hidden = false;

  healthValue.textContent = String(player.health);
  scoreValue.textContent = String(state.score);
  timeValue.textContent = `${Math.floor(state.elapsed)}s`;
  levelValue.textContent = String(state.level);
  weaponValue.textContent = weapons[player.weaponIndex].name;
}

function nearestEnemy() {
  let target = null;
  let best = Infinity;
  for (const squid of squids) {
    const d = distance(player, squid);
    if (d < best) {
      best = d;
      target = squid;
    }
  }
  return target;
}

function fireWeapon() {
  if (!state.running || player.fireCooldown > 0) return;

  const weapon = weapons[player.weaponIndex];
  const target = nearestEnemy();
  let aimX = pointer.x;
  let aimY = pointer.y;

  if (target) {
    aimX = target.x;
    aimY = target.y;
  }

  const dx = aimX - player.x;
  const dy = aimY - player.y;
  const baseAngle = Math.atan2(dy, dx) || 0;

  for (let i = 0; i < weapon.pellets; i += 1) {
    const offset = weapon.pellets > 1 ? (i - (weapon.pellets - 1) / 2) * weapon.spread : 0;
    const angle = baseAngle + offset;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      r: weapon.pellets === 1 ? 5 : 4,
      from: 'frog',
      damage: weapon.damage,
      color: weapon.color,
    });
  }

  player.fireCooldown = weapon.fireRate;
}

function selectWeapon(index) {
  const requestedIndex = (index + weapons.length) % weapons.length;
  if (state.fullWeaponAccess) {
    player.weaponIndex = requestedIndex;
  } else if (restrictedWeaponIndices.includes(requestedIndex)) {
    player.weaponIndex = requestedIndex;
  } else {
    const currentPosition = restrictedWeaponIndices.indexOf(player.weaponIndex);
    const nextPosition = index > player.weaponIndex ? currentPosition + 1 : currentPosition - 1;
    player.weaponIndex = restrictedWeaponIndices[(nextPosition + restrictedWeaponIndices.length) % restrictedWeaponIndices.length];
  }
  weaponValue.textContent = weapons[player.weaponIndex].name;
}

function advanceLevel() {
  if (state.kills >= state.levelGoal) {
    const activeWeaponIndex = player.weaponIndex;
    state.level += 1;
    state.kills = 0;
    state.levelGoal = Math.max(8, Math.round(state.levelGoal * 1.4));
    player.health = clamp(player.health + 15, 0, player.maxHealth);
    player.weaponIndex = activeWeaponIndex;
    levelValue.textContent = String(state.level);
    weaponValue.textContent = weapons[player.weaponIndex].name;
  }
}

function spawnSquid() {
  const x = 32 + Math.random() * (world.width - 64);
  const y = world.groundTop + 32 + Math.random() * (world.height - world.groundTop - 64);
  const heli = Math.random() < 0.28;

  squids.push({
    x,
    y,
    r: heli ? 20 : 16 + Math.random() * 8,
    speed: 45 + Math.random() * 15 + state.elapsed * 0.3,
    phase: Math.random() * Math.PI * 2,
    hp: (heli ? 32 : 20) + state.level * 2,
    heli,
    alerted: false,
    landed: false,
    targetX: 32 + Math.random() * (world.width - 64),
    targetY: world.groundTop + 32 + Math.random() * (world.height - world.groundTop - 64),
  });
}

function spawnBossSquid() {
  squids.push({
    x: world.width * 0.72,
    y: world.groundTop + 90,
    r: 46,
    speed: 80,
    phase: Math.random() * Math.PI * 2,
    hp: 420,
    heli: false,
    boss: true,
    alerted: true,
    landed: true,
    targetX: world.width * 0.72,
    targetY: world.groundTop + 90,
  });
  state.bossSpawned = true;
  state.bossHeliTimer = 3;
}

function spawnBossHelicopter(boss) {
  const side = Math.random() < 0.5 ? -1 : 1;
  squids.push({
    x: boss.x + side * 120,
    y: boss.y - 60,
    r: 18,
    speed: 110,
    phase: Math.random() * Math.PI * 2,
    hp: 35,
    heli: true,
    bossHelicopter: true,
    alerted: true,
    landed: false,
    landingTime: 0.6,
    targetX: player.x,
    targetY: player.y,
  });
}

function maybeSpawnBerry() {
  if (berries.length < 4) {
    const x = 32 + Math.random() * (world.width - 64);
    const y = world.groundTop + 28 + Math.random() * (world.height - world.groundTop - 56);

    berries.push({ x, y, r: 8, pulse: Math.random() * Math.PI * 2 });
  }
}

function handleWoodInteraction() {
  const collectable = woodPiles.find((pile) => distance(player, pile) < player.r + pile.r + 12);
  if (collectable && keys.e) {
    player.wood += collectable.amount;
    const index = woodPiles.indexOf(collectable);
    woodPiles.splice(index, 1);
    keys.e = false;
    return;
  }

  if (!keys.e || player.wood < 5) return;

  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const len = Math.hypot(dx, dy) || 1;
  const buildX = player.x + (dx / len) * 26;
  const buildY = player.y + (dy / len) * 26;

  const overlaps = fortWalls.some((wall) => Math.abs(wall.x - buildX) < 20 && Math.abs(wall.y - buildY) < 20);
  if (!overlaps) {
    fortWalls.push({
      x: buildX,
      y: buildY,
      w: 22,
      h: 22,
      hp: 80,
    });
    player.wood -= 5;
    state.woodUsed += 5;
  }

  keys.e = false;
}

function collectOrDropWood() {
  if (!state.running) return;

  const collectable = woodPiles.find((pile) => distance(player, pile) < player.r + pile.r + 12);
  if (collectable) {
    player.wood += collectable.amount;
    woodPiles.splice(woodPiles.indexOf(collectable), 1);
  } else if (player.wood > 0) {
    const angle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
    const dropX = clamp(player.x + Math.cos(angle) * 64, 24, world.width - 24);
    const dropY = clamp(player.y + Math.sin(angle) * 64, world.groundTop + 24, world.height - 24);
    if (spawnWoodPile(dropX, dropY, player.wood)) player.wood = 0;
  }
  updateHud();
}

function handleInput(dt) {
  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const nextX = player.x + dx * player.speed * dt;
    const nextY = player.y + dy * player.speed * dt;

    player.x = clamp(nextX, player.r, world.width - player.r);
    player.y = clamp(nextY, world.groundTop + player.r, world.height - player.r);
  }
}

function updateToad(dt) {
  if (!roomState.toadEnabled) return;

  const desiredX = player.x + Math.cos(state.elapsed * 0.7) * 56;
  const desiredY = player.y + Math.sin(state.elapsed * 0.7 + 1.2) * 54;

  const dx = desiredX - toad.x;
  const dy = desiredY - toad.y;
  const len = Math.hypot(dx, dy) || 1;
  toad.x += (dx / len) * 120 * dt;
  toad.y += (dy / len) * 120 * dt;

  toad.cooldown = Math.max(0, toad.cooldown - dt);
  toad.glow += dt * 4;

  let nearest = null;
  let nearestDist = Infinity;
  for (const squid of squids) {
    if (!squid.heli || !squid.alerted) continue;
    const d = distance(toad, squid);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = squid;
    }
  }

  if (nearest && nearestDist < 260 && toad.cooldown <= 0) {
    const dxp = nearest.x - toad.x;
    const dyp = nearest.y - toad.y;
    const lenp = Math.hypot(dxp, dyp) || 1;

    projectiles.push({
      x: toad.x,
      y: toad.y,
      vx: (dxp / lenp) * 360,
      vy: (dyp / lenp) * 360,
      r: 6,
      from: 'toad',
    });

    toad.cooldown = 0.52;
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const shot = projectiles[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;

    let hit = false;
    for (const squid of squids) {
      if (distance(shot, squid) < shot.r + squid.r) {
        squid.hp -= shot.damage || 1;
        hit = true;
        break;
      }
    }

    if (hit || shot.x < -20 || shot.x > world.width + 20 || shot.y < -20 || shot.y > world.height + 20) {
      projectiles.splice(i, 1);
    }
  }

  for (let i = squids.length - 1; i >= 0; i -= 1) {
    const squid = squids[i];
    if (squid.hp <= 0) {
      if (squid.boss) {
        squids.splice(i, 1);
        for (let j = squids.length - 1; j >= 0; j -= 1) {
          if (squids[j].bossHelicopter) squids.splice(j, 1);
        }
        state.score += 100;
        state.kills += 1;
        state.bossStage = false;
        state.bossSpawned = false;
        state.campaignMode = true;
        state.campaignLevel = Math.min(100, state.campaignLevel + 1);
        if (state.campaignLevel >= state.totalCampaignLevels) {
          state.running = false;
          woodActionButton.hidden = true;
          setOverlayVisible(true);
          overlay.innerHTML = `
            <div class="panel">
              <h2>Campaign Complete</h2>
              <p>You cleared the 100-level island campaign and escaped the war.</p>
              <p>Final score: ${Math.floor(state.score)}</p>
              <button id="restartButton">Play Again</button>
            </div>
          `;
          document.getElementById('restartButton').addEventListener('click', () => {
            startGame();
          });
        }
      } else {
        const reward = Math.random() < 0.5 ? 'wood' : 'berry';
        if (reward === 'wood') {
          spawnWoodPile(squid.x, squid.y, 5 + Math.floor(Math.random() * 5));
        } else {
          berries.push({ x: squid.x, y: squid.y, r: 8, pulse: Math.random() * Math.PI * 2 });
        }
        squids.splice(i, 1);
        state.score += 10;
        state.kills += 1;
        advanceLevel();
      }
    }
  }
}

function updateSquids(dt) {
  if (state.bossStage && !state.bossSpawned) {
    spawnBossSquid();
  }

  if (state.bossStage && state.bossSpawned) {
    const boss = squids.find((squid) => squid.boss);
    if (boss) {
      state.bossHeliTimer -= dt;
      if (state.bossHeliTimer <= 0) {
        state.bossHeliTimer = 4;
        spawnBossHelicopter(boss);
      }

      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const len = Math.hypot(dx, dy) || 1;
      boss.x = clamp(boss.x + (dx / len) * boss.speed * dt, boss.r, world.width - boss.r);
      boss.y = clamp(boss.y + (dy / len) * boss.speed * dt * 0.8, world.groundTop + boss.r, world.height - boss.r);
    }
  }

  for (const squid of squids) {
    squid.phase += dt * 5;
    if (squid.heli && !squid.alerted && distance(squid, player) < 250) {
      squid.alerted = true;
      squid.landingTime = 0.65;
    }

    let targetX = squid.targetX ?? squid.x;
    let targetY = squid.targetY ?? squid.y;
    let speed = squid.speed;
    if (squid.heli && squid.alerted) {
      if (!squid.landed) {
        squid.landingTime -= dt;
        if (squid.landingTime <= 0) squid.landed = true;
      } else {
        targetX = player.x;
        targetY = player.y;
        speed *= 1.55;
      }
    } else if (!squid.boss && distance(squid, { x: targetX, y: targetY }) < 18) {
      squid.targetX = 28 + Math.random() * (world.width - 56);
      squid.targetY = world.groundTop + 26 + Math.random() * (world.height - world.groundTop - 52);
      targetX = squid.targetX;
      targetY = squid.targetY;
    }

    const dx = targetX - squid.x;
    const dy = targetY - squid.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = squid.x + (dx / len) * speed * dt;
    let ny = squid.y + (dy / len) * speed * dt;

    for (const wall of fortWalls) {
      const nearestX = clamp(nx, wall.x - wall.w / 2, wall.x + wall.w / 2);
      const nearestY = clamp(ny, wall.y - wall.h / 2, wall.y + wall.h / 2);
      const wallDist = Math.hypot(nx - nearestX, ny - nearestY);
      if (wallDist < squid.r + 7) {
        const pushX = nx - wall.x;
        const pushY = ny - wall.y;
        const pushLen = Math.hypot(pushX, pushY) || 1;
        nx = wall.x + (pushX / pushLen) * (squid.r + 8);
        ny = wall.y + (pushY / pushLen) * (squid.r + 8);
      }
    }

    squid.x = clamp(nx, squid.r, world.width - squid.r);
    squid.y = clamp(ny, world.groundTop + squid.r, world.height - squid.r);

    if (squid.heli && squid.alerted && squid.landed && distance(player, squid) < player.r + squid.r + 2) {
      if (player.invuln <= 0) {
        player.health = Math.max(0, player.health - 12);
        player.invuln = 0.8;
      }
    }
  }
}

function updateBerries(dt) {
  for (let i = berries.length - 1; i >= 0; i -= 1) {
    const berry = berries[i];
    berry.pulse += dt * 3;

    if (distance(player, berry) < player.r + berry.r + 6) {
      player.health = clamp(player.health + 18, 0, player.maxHealth);
      berries.splice(i, 1);
      state.score += 5;
    }
  }
}

function updateHud() {
  healthValue.textContent = String(Math.max(0, Math.round(player.health)));
  scoreValue.textContent = String(Math.floor(state.score));
  timeValue.textContent = `${Math.floor(state.elapsed)}s`;
  levelValue.textContent = String(state.level);
  weaponValue.textContent = weapons[player.weaponIndex].name;
}

function nearestWoodPile() {
  let nearest = null;
  let nearestDist = Infinity;

  for (const pile of woodPiles) {
    const d = distance(player, pile);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = pile;
    }
  }

  return nearest;
}

function drawWoodArrow(pile) {
  const angle = Math.atan2(pile.y - player.y, pile.x - player.x);
  const panelX = Math.max(12, world.width - 144);
  const panelY = world.height - 64;
  const arrowX = panelX + 24;
  const arrowY = panelY + 28;

  ctx.save();
  ctx.fillStyle = 'rgba(25, 30, 25, 0.9)';
  ctx.fillRect(panelX, panelY, 132, 48);
  ctx.strokeStyle = '#ffc14c';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, 132, 48);

  ctx.translate(arrowX, arrowY);
  ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = '#fff08a';
  ctx.strokeStyle = '#6e3b00';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ffae24';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(9, 8);
  ctx.lineTo(0, 4);
  ctx.lineTo(-9, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#fff4bd';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('WOOD', panelX + 45, panelY + 20);
  ctx.font = '12px Arial';
  ctx.fillText(`${Math.round(distance(player, pile))} away`, panelX + 45, panelY + 37);
}

function update(dt) {
  if (!state.running) return;

  state.elapsed += dt;
  state.score += dt * 2;
  state.spawnTimer -= dt;
  state.berryTimer -= dt;
  player.invuln = Math.max(0, player.invuln - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);

  if (!state.bossStage && state.spawnTimer <= 0) {
    spawnSquid();
    state.spawnTimer = Math.max(0.7, 3 - state.elapsed * 0.03 - (state.level - 1) * 0.08);
  }

  if (state.berryTimer <= 0) {
    maybeSpawnBerry();
    state.berryTimer = 7;
  }

  handleInput(dt);
  handleWoodInteraction();
  updateToad(dt);
  updateProjectiles(dt);
  updateSquids(dt);
  updateBerries(dt);
  updateHud();

  if (!state.bossStage && !rescuePlane.active && state.level >= 5) {
    rescuePlane.active = true;
    rescuePlane.x = -220;
    rescuePlane.y = Math.min(world.height * 0.3, 150);
  }

  if (rescuePlane.active) {
    rescuePlane.x += rescuePlane.speed * dt;
    if (rescuePlane.x >= player.x + 28) {
      rescuePlane.active = false;
      state.bossStage = true;
      state.bossSpawned = false;
      state.bossHeliTimer = 2;
      state.spawnTimer = 3;
      player.x = world.centerX;
      player.y = world.centerY;
      toad.x = player.x + 50;
      toad.y = player.y + 30;
      squids.length = 0;
      projectiles.length = 0;
    }
  }

  if (player.health <= 0) {
    state.running = false;
    woodActionButton.hidden = true;
    state.best = Math.max(state.best, Math.floor(state.score));
    localStorage.setItem('frog-wars-best', String(state.best));
    setOverlayVisible(true);
    overlay.innerHTML = `
      <div class="panel">
        <h2>Game Over</h2>
        <p>You survived ${Math.floor(state.elapsed)} seconds and scored ${Math.floor(state.score)} points.</p>
        <p>Best score: ${state.best}</p>
        <button id="restartButton">Try Again</button>
      </div>
    `;
    document.getElementById('restartButton').addEventListener('click', () => {
      overlay.innerHTML = `
        <div class="panel">
          <h2>Island Survival</h2>
          <p>
            You are an orange poison dart frog. Survive the squid swarm on your island with the help of
            your computer toad ally.
          </p>
          <ul>
            <li>Move with WASD or Arrow Keys</li>
            <li>Collect glowing berries to recover health</li>
            <li>Keep the squids away from your island</li>
          </ul>
          <button id="startButton">Start Game</button>
        </div>
      `;
      const restart = document.getElementById('startButton');
      restart.addEventListener('click', startGame);
      setOverlayVisible(true);
    });
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, '#edf8ff');
  sky.addColorStop(0.32, '#bfe4ff');
  sky.addColorStop(0.68, '#b9d686');
  sky.addColorStop(1, '#3a693d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  const sun = ctx.createRadialGradient(world.width * 0.82, world.height * 0.2, 8, world.width * 0.82, world.height * 0.2, 70);
  sun.addColorStop(0, 'rgba(255, 244, 170, 1)');
  sun.addColorStop(0.3, 'rgba(255, 218, 116, 0.8)');
  sun.addColorStop(1, 'rgba(255, 218, 116, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(world.width * 0.66, 0, world.width * 0.34, world.height * 0.45);

  const ground = ctx.createLinearGradient(0, world.groundTop, 0, world.height);
  ground.addColorStop(0, '#8acb6d');
  ground.addColorStop(0.42, '#5ca75c');
  ground.addColorStop(1, '#2f4f31');
  ctx.fillStyle = ground;
  ctx.fillRect(0, world.groundTop, world.width, world.height - world.groundTop);

  ctx.fillStyle = 'rgba(42, 74, 39, 0.42)';
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 57) % world.width;
    const y = world.groundTop + 18 + ((i * 91) % (world.height - world.groundTop));
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTrees() {
  for (const tree of world.trees) drawTree(tree);
}

function drawTree(tree) {
  const size = tree.size;
  ctx.fillStyle = 'rgba(22, 43, 26, 0.32)';
  ctx.beginPath();
  ctx.ellipse(tree.x + 7, tree.y + size * 0.4, size * 0.96, size * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#56391f';
  ctx.fillRect(tree.x - size * 0.18, tree.y - size * 0.12, size * 0.36, size);
  ctx.fillStyle = '#9b6b3b';
  ctx.fillRect(tree.x - size * 0.08, tree.y - size * 0.08, size * 0.08, size * 0.82);

  const canopy = ctx.createRadialGradient(
    tree.x - size * 0.2,
    tree.y - size * 0.5,
    size * 0.08,
    tree.x,
    tree.y - size * 0.1,
    size
  );
  canopy.addColorStop(0, ['#7ebd52', '#8cc75a', '#70ae49'][tree.shade]);
  canopy.addColorStop(0.55, ['#347c3e', '#3e8944', '#2c7138'][tree.shade]);
  canopy.addColorStop(1, '#194d30');
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.ellipse(tree.x, tree.y - size * 0.28, size * 0.74, size * 0.62, 0, 0, Math.PI * 2);
  ctx.ellipse(tree.x - size * 0.43, tree.y, size * 0.44, size * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(tree.x + size * 0.42, tree.y + size * 0.02, size * 0.46, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(191, 224, 112, 0.5)';
  ctx.beginPath();
  ctx.ellipse(tree.x - size * 0.22, tree.y - size * 0.48, size * 0.23, size * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function depthScale(y) {
  const depth = clamp((y - world.groundTop) / (world.height - world.groundTop), 0, 1);
  return 0.62 + depth * 0.56;
}

function drawAtDepth(x, y, draw) {
  const scale = depthScale(y);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

function drawShadow(x, y, radius) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBerry(berry) {
  const size = berry.r + Math.sin(berry.pulse) * 2;
  drawShadow(berry.x, berry.y + 7, size + 4);
  const g = ctx.createRadialGradient(berry.x - 1, berry.y - 2, 1, berry.x, berry.y, size + 3);
  g.addColorStop(0, '#ffd6de');
  g.addColorStop(0.35, '#ff7aa5');
  g.addColorStop(1, '#a31942');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(berry.x, berry.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(berry.x - 2, berry.y - size, 4, size * 1.5);
}

function drawWoodPile(pile) {
  const pulse = Math.sin(pile.pulse += 0.16) * 4;
  const near = distance(player, pile) < 120;
  drawShadow(pile.x, pile.y + 14, pile.r + 12);

  const glowSize = pile.r + 22 + Math.max(0, pulse);
  const pileGlow = ctx.createRadialGradient(pile.x, pile.y - 4, 3, pile.x, pile.y, glowSize);
  pileGlow.addColorStop(0, near ? 'rgba(255, 238, 156, 1)' : 'rgba(255, 229, 150, 0.95)');
  pileGlow.addColorStop(0.35, near ? 'rgba(255, 180, 60, 0.9)' : 'rgba(255, 202, 91, 0.75)');
  pileGlow.addColorStop(1, 'rgba(255, 202, 91, 0)');
  ctx.fillStyle = pileGlow;
  ctx.beginPath();
  ctx.arc(pile.x, pile.y, glowSize, 0, Math.PI * 2);
  ctx.fill();

  const woodGradient = ctx.createLinearGradient(pile.x - pile.r, pile.y - pile.r, pile.x + pile.r, pile.y + pile.r);
  woodGradient.addColorStop(0, '#efd0a1');
  woodGradient.addColorStop(0.2, '#d18d4f');
  woodGradient.addColorStop(0.6, '#8a4923');
  woodGradient.addColorStop(1, '#4b2611');

  ctx.fillStyle = woodGradient;
  for (let i = 0; i < 8; i += 1) {
    const x = pile.x - pile.r + 3 + i * 5;
    const h = 16 + ((i % 3) * 5) + pulse;
    ctx.fillRect(x, pile.y - h / 2, 4, h);
  }

  ctx.fillStyle = '#ffe38f';
  ctx.strokeStyle = '#4d2a00';
  ctx.lineWidth = 2;
  ctx.strokeRect(pile.x - pile.r - 3, pile.y - pile.r - 3, pile.r * 2 + 6, pile.r * 2 + 6);
  ctx.fillRect(pile.x - 2, pile.y - pile.r - 8, 4, 8);
  ctx.fillRect(pile.x + 6, pile.y - pile.r - 2, 3, 6);
  ctx.fillRect(pile.x - 8, pile.y - pile.r - 6, 3, 6);

  if (!near) return;

  const labelWidth = 72;
  const labelHeight = 22;
  const labelX = pile.x - labelWidth / 2;
  const labelY = pile.y - pile.r - 30;

  ctx.fillStyle = 'rgba(255, 166, 25, 0.96)';
  ctx.shadowColor = '#ffb52e';
  ctx.shadowBlur = 20;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff2a1';
  ctx.lineWidth = 2;
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  ctx.fillStyle = '#241604';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WOOD', pile.x, labelY + 16);
  ctx.textAlign = 'left';
}

function drawFortWall(wall) {
  const x = wall.x;
  const y = wall.y;
  const w = wall.w;
  const h = wall.h;
  const grad = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  grad.addColorStop(0, '#d6aa67');
  grad.addColorStop(0.5, '#8f6033');
  grad.addColorStop(1, '#563819');
  ctx.fillStyle = grad;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = 'rgba(54, 33, 14, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}

function drawSquid(squid) {
  const bob = Math.sin(squid.phase) * 4;
  const bodyX = squid.x;
  const bodyY = squid.y + (squid.heli && !squid.landed ? bob - 14 : bob);

  drawShadow(bodyX, bodyY + 16, squid.r + 10);
  if (squid.heli && !squid.landed) {
    const hel = ctx.createLinearGradient(bodyX - 20, bodyY - 10, bodyX + 20, bodyY + 10);
    hel.addColorStop(0, '#6d7b8e');
    hel.addColorStop(1, '#2c3b46');
    ctx.fillStyle = hel;
    ctx.beginPath();
    ctx.moveTo(bodyX - 20, bodyY + 2);
    ctx.lineTo(bodyX - 14, bodyY - 18);
    ctx.lineTo(bodyX + 10, bodyY - 18);
    ctx.lineTo(bodyX + 20, bodyY + 2);
    ctx.lineTo(bodyX - 20, bodyY + 2);
    ctx.fill();
    ctx.fillStyle = '#dfe4ec';
    ctx.fillRect(bodyX - 8, bodyY - 13, 16, 5);
    ctx.fillStyle = '#1a2127';
    ctx.fillRect(bodyX - 2, bodyY - 20, 4, 6);
    return;
  }

  const squidGrad = ctx.createLinearGradient(bodyX - 16, bodyY - 18, bodyX + 16, bodyY + 18);
  squidGrad.addColorStop(0, '#7a63ff');
  squidGrad.addColorStop(1, '#33226d');
  ctx.fillStyle = squidGrad;
  ctx.beginPath();
  ctx.ellipse(bodyX, bodyY, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12141d';
  ctx.fillRect(bodyX - 15, bodyY + 10, 7, 18);
  ctx.fillRect(bodyX + 8, bodyY + 10, 7, 18);

  ctx.fillStyle = '#fff';
  ctx.fillRect(bodyX - 8, bodyY - 5, 4, 4);
  ctx.fillRect(bodyX + 4, bodyY - 5, 4, 4);
  ctx.fillStyle = '#12141d';
  ctx.fillRect(bodyX - 6, bodyY - 4, 2, 2);
  ctx.fillRect(bodyX + 5, bodyY - 4, 2, 2);
}

function drawProjectile(shot) {
  drawShadow(shot.x, shot.y + 6, shot.r + 4);
  ctx.fillStyle = shot.from === 'squid' ? '#ff7b7b' : '#dff6ff';
  ctx.fillRect(shot.x - shot.r, shot.y - shot.r, shot.r * 2, shot.r * 2);
}

function drawFrog() {
  const x = player.x;
  const y = player.y;
  drawShadow(x, y + 18, 22);

  const body = ctx.createRadialGradient(x - 5, y - 12, 2, x, y, 24);
  body.addColorStop(0, '#ffd66d');
  body.addColorStop(0.72, '#f4a11b');
  body.addColorStop(1, '#b86100');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d66d00';
  ctx.fillRect(x - 7, y + 10, 5, 10);
  ctx.fillRect(x + 2, y + 10, 5, 10);

  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 8, y - 8, 6, 6);
  ctx.fillRect(x + 2, y - 8, 6, 6);
  ctx.fillStyle = '#111';
  ctx.fillRect(x - 6, y - 7, 2, 2);
  ctx.fillRect(x + 6, y - 7, 2, 2);

  ctx.fillStyle = '#b8ff6f';
  ctx.fillRect(x - 12, y + 2, 5, 5);
  ctx.fillRect(x + 7, y + 2, 5, 5);

  if (player.invuln > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 18, y - 18, 36, 36);
  }
}

function drawToad() {
  if (!roomState.toadEnabled) return;

  const x = toad.x;
  const y = toad.y;
  drawShadow(x, y + 16, 22);

  const body = ctx.createRadialGradient(x, y - 8, 5, x, y, 28);
  body.addColorStop(0, '#cbeeff');
  body.addColorStop(0.72, '#94dff0');
  body.addColorStop(1, '#4aa9d0');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1d3557';
  ctx.fillRect(x - 7, y - 18, 4, 6);
  ctx.fillRect(x + 3, y - 18, 4, 6);
}

function drawRescuePlane() {
  const x = rescuePlane.x;
  const y = rescuePlane.y;
  drawShadow(x, y + 12, 34);

  ctx.fillStyle = '#dfeaf9';
  ctx.beginPath();
  ctx.moveTo(x - 42, y);
  ctx.lineTo(x - 10, y - 10);
  ctx.lineTo(x + 36, y - 8);
  ctx.lineTo(x + 52, y);
  ctx.lineTo(x + 36, y + 8);
  ctx.lineTo(x - 10, y + 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8bc5ff';
  ctx.fillRect(x - 28, y - 2, 22, 4);
  ctx.fillStyle = '#ffefbd';
  ctx.fillRect(x + 8, y - 4, 8, 8);
  ctx.fillStyle = '#6d7d8e';
  ctx.fillRect(x - 44, y - 2, 10, 4);
  ctx.fillRect(x - 44, y + 2, 10, 4);
}

function drawStatusText() {
  const stageText = state.bossStage ? 'Boss arena' : state.campaignMode ? `Area ${state.campaignLevel}/${state.totalCampaignLevels}` : `Squid alert! Level ${state.level}`;
  ctx.fillStyle = 'rgba(4, 17, 24, 0.66)';
  ctx.fillRect(12, 12, 380, 68);
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#efffff';
  ctx.fillText(stageText, 24, 32);
  ctx.font = '12px Arial';
  ctx.fillText(`Weapon: ${weapons[player.weaponIndex].name}  |  Wood: ${player.wood}  |  Kills ${state.kills}/${state.levelGoal}`, 24, 54);
}

function render() {
  drawBackground();
  drawTrees();
  const actors = [];

  for (const pile of woodPiles) {
    actors.push({ y: pile.y, x: pile.x, draw: () => drawWoodPile(pile) });
  }
  for (const wall of fortWalls) {
    actors.push({ y: wall.y, x: wall.x, draw: () => drawFortWall(wall) });
  }
  for (const berry of berries) {
    actors.push({ y: berry.y, x: berry.x, draw: () => drawBerry(berry) });
  }
  for (const shot of projectiles) {
    actors.push({ y: shot.y, x: shot.x, draw: () => drawProjectile(shot) });
  }
  for (const squid of squids) {
    actors.push({ y: squid.y, x: squid.x, draw: () => drawSquid(squid) });
  }
  actors.push({ y: toad.y, x: toad.x, draw: drawToad });
  if (rescuePlane.active) {
    actors.push({ y: rescuePlane.y, x: rescuePlane.x, draw: drawRescuePlane });
  }
  actors.push({ y: player.y, x: player.x, draw: drawFrog });
  actors.sort((first, second) => first.y - second.y);

  for (const actor of actors) {
    drawAtDepth(actor.x, actor.y, actor.draw);
  }

  const woodTarget = nearestWoodPile();
  if (woodTarget) drawWoodArrow(woodTarget);

  drawStatusText();
}

function gameLoop(timestamp) {
  if (!gameLoop.lastTime) gameLoop.lastTime = timestamp;
  const dt = Math.min((timestamp - gameLoop.lastTime) / 1000, 0.033);
  gameLoop.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const normalizedName = normalizePlayerName(playerNameInput.value);
  if (normalizedName.split(' ').length < 2) {
    playerNameInput.setCustomValidity('Enter your first and last name.');
    playerNameInput.reportValidity();
    playerNameInput.focus();
    return;
  }
  playerNameInput.setCustomValidity('');
  state.fullWeaponAccess = fullWeaponNames.has(normalizedName);
  roomState.toadEnabled = Boolean(toadToggle && toadToggle.checked);
  syncRoomSettings();
  resizeCanvas();
  resetGame();
  if (!state.fullWeaponAccess) selectWeapon(0);
  setOverlayVisible(false);
}

function shareRoomLink() {
  const code = roomCodeInput.value.trim().toUpperCase() || generateRoomCode();
  roomCodeInput.value = code;
  roomState.code = code;
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
  window.history.replaceState({}, '', `${window.location.pathname}?room=${code}`);
  localStorage.setItem('frog-wars-active-room', code);
  localStorage.setItem(`${roomStoragePrefix}${code}`, JSON.stringify({ room: code, toadEnabled: Boolean(toadToggle && toadToggle.checked), updatedAt: Date.now() }));
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }
  window.alert(`Room link ready:\n${shareUrl}`);
}

function joinSelectedRoom() {
  const nextCode = roomCodeInput.value.trim().toUpperCase() || generateRoomCode();
  roomCodeInput.value = nextCode;
  roomState.code = nextCode;
  const roomUrl = `${window.location.pathname}?room=${nextCode}`;
  window.history.replaceState({}, '', roomUrl);
  localStorage.setItem('frog-wars-active-room', nextCode);
  syncRoomSettings();
  window.alert(`Joined room ${nextCode}`);
}

window.addEventListener('resize', resizeCanvas);

startButton.addEventListener('click', startGame);
playerNameInput.addEventListener('input', () => playerNameInput.setCustomValidity(''));
woodActionButton.addEventListener('click', collectOrDropWood);
joinRoomButton.addEventListener('click', joinSelectedRoom);
hostRoomButton.addEventListener('click', shareRoomLink);
toadToggle.addEventListener('change', () => {
  roomState.toadEnabled = Boolean(toadToggle.checked);
  syncRoomSettings();
});

window.addEventListener('storage', (event) => {
  if (!event.key || !event.key.startsWith(roomStoragePrefix)) return;
  const payload = event.newValue ? JSON.parse(event.newValue) : null;
  if (!payload) return;
  if (payload.room) roomCodeInput.value = payload.room;
  if (typeof payload.toadEnabled === 'boolean') {
    toadToggle.checked = payload.toadEnabled;
    roomState.toadEnabled = payload.toadEnabled;
  }
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - rect.left) * (world.width / rect.width);
  pointer.y = (event.clientY - rect.top) * (world.height / rect.height);
});

canvas.addEventListener('click', () => {
  if (state.running) fireWeapon();
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (/^[1-9]$/.test(key)) selectWeapon(Number(key) - 1);
  if (key === 'q') selectWeapon(player.weaponIndex - 1);
  if (key === 'e') {
    event.preventDefault();
    selectWeapon(player.weaponIndex + 1);
  }
  if (key === ' ' || key === 'f') {
    event.preventDefault();
    if (!state.running) {
      startGame();
    } else {
      fireWeapon();
    }
  }
});
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  selectWeapon(player.weaponIndex + (event.deltaY > 0 ? 1 : -1));
}, { passive: false });
window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

loadRoomSettings();
resizeCanvas();
setOverlayVisible(true);
requestAnimationFrame(gameLoop);
