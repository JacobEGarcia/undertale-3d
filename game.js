// UNDERTALE 3D - RUINS ch.1 "THE DUMMY" v0.1 (fan demake)
import * as THREE from './three.module.js';

/* ============================== AUDIO ============================== */
const AudioSys = {
  ctx: null, master: null, musicGain: null, muted: false, musicTimer: null,
  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = new C();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
  },
  tone(freq, dur, type = 'square', vol = 0.18, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.2, freq = 800, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const len = Math.max(1, this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.02);
  },
  blip()   { this.tone(880 + Math.random() * 120, 0.045, 'square', 0.07); },
  select() { this.tone(660, 0.05, 'square', 0.10); },
  confirm(){ this.tone(523, 0.05, 'square', 0.11); this.tone(784, 0.09, 'square', 0.11, 0.05); },
  hurt()   { this.noise(0.25, 0.3, 300); this.tone(160, 0.25, 'sawtooth', 0.2, 0, 60); },
  slash()  { this.noise(0.18, 0.3, 2400); this.tone(1400, 0.12, 'sawtooth', 0.12, 0, 300); },
  heal()   { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.12, i * 0.07)); },
  spare()  { [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.13, i * 0.09)); },
  thud()   { this.noise(0.3, 0.25, 150); this.tone(90, 0.3, 'sine', 0.25, 0, 40); },
  startMusic(kind) {
    if (!this.ctx) return;
    this.stopMusic();
    let step = 0;
    // Land of the Dead jazz: walking bass + muted-horn lead stabs, swung 8ths
    const ruinsBass = [55, 0, 65.4, 0, 73.4, 0, 65.4, 0, 55, 0, 65.4, 0, 82.4, 0, 73.4, 0];
    const ruinsLead = [0, 0, 0, 261.6, 0, 0, 329.6, 0, 0, 311.1, 0, 0, 261.6, 0, 246.9, 0];
    const battleBass = [55, 55, 65.4, 55, 73.4, 65.4, 55, 49, 55, 55, 65.4, 55, 82.4, 73.4, 65.4, 61.7];
    const battleLead = [220, 0, 261.6, 0, 329.6, 311.1, 261.6, 0, 220, 0, 261.6, 0, 349.2, 0, 329.6, 311.1];
    const papyrusBass = [73.4, 0, 73.4, 82.4, 73.4, 0, 65.4, 0, 73.4, 0, 73.4, 82.4, 98, 0, 82.4, 0];
    const papyrusLead = [293.7, 0, 349.2, 0, 440, 0, 349.2, 293.7, 261.6, 0, 293.7, 0, 349.2, 329.6, 293.7, 0];
    const bass = kind === 'battle' ? battleBass : kind === 'papyrus' ? papyrusBass : ruinsBass;
    const lead = kind === 'battle' ? battleLead : kind === 'papyrus' ? papyrusLead : ruinsLead;
    const tempo = kind === 'battle' ? 128 : kind === 'papyrus' ? 150 : 78;
    const stepDur = 60 / tempo / 2;
    const scheduleStep = () => {
      if (!this.musicTimer) return;
      const swing = (step % 2 === 0) ? 1.32 : 0.68; // swung 8ths
      if (!this.muted) {
        const t = this.ctx.currentTime;
        const bf = bass[step % bass.length];
        if (bf) {
          const o = this.ctx.createOscillator(), g2 = this.ctx.createGain();
          o.type = 'triangle'; o.frequency.value = bf;
          g2.gain.setValueAtTime(0.14, t); g2.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.7);
          o.connect(g2); g2.connect(this.musicGain); o.start(t); o.stop(t + stepDur * 1.8);
        }
        const lf = lead[step % lead.length];
        if (lf) {
          const o = this.ctx.createOscillator(), g2 = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
          o.type = 'sawtooth'; o.frequency.value = lf;
          f.type = 'lowpass'; f.frequency.value = 1400; // muted-horn
          g2.gain.setValueAtTime(kind === 'battle' ? 0.075 : 0.055, t);
          g2.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.4);
          o.connect(f); f.connect(g2); g2.connect(this.musicGain); o.start(t); o.stop(t + stepDur * 1.5);
        }
        if ((kind === 'battle' || kind === 'papyrus') && step % 2 === 1) this.noise(0.03, 0.028, 6500);
        if ((kind === 'battle' || kind === 'papyrus') && step % 8 === 0) this.noise(0.09, 0.05, 500); // brush kick
      }
      step = (step + 1) % bass.length;
      this.musicTimer = setTimeout(scheduleStep, stepDur * swing * 1000);
    };
    this.musicTimer = setTimeout(scheduleStep, 10);
  },
  stopMusic() { if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; } }
};

/* ============================== RENDERER ============================== */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120819);
scene.fog = new THREE.FogExp2(0x120819, 0.05);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ============================== TEXTURES (procedural canvas) ============================== */
function brickTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#2b1430'; g.fillRect(0, 0, 256, 256);
  const bh = 32, bw = 64;
  for (let y = 0; y < 8; y++) {
    for (let x = -1; x < 5; x++) {
      const off = (y % 2) * bw / 2;
      const shade = 40 + Math.random() * 20;
      g.fillStyle = `rgb(${shade + 26},${shade - 6},${shade + 22})`;
      g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function floorTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1d0f22'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const s = Math.random() * 2.4 + 0.6;
    g.fillStyle = `rgba(${150 + Math.random() * 60},${70 + Math.random() * 40},${60 + Math.random() * 50},${Math.random() * 0.13})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  g.strokeStyle = 'rgba(212,160,60,0.22)'; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke();
    g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowSprite(color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color + 'aa');
  grad.addColorStop(1, 'transparent');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================== RUINS ROOM ============================== */
const brick = brickTexture(); brick.repeat.set(4, 2);
const floorTex = floorTexture(); floorTex.repeat.set(6, 5);

const room = new THREE.Group(); scene.add(room);
{
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9 });
  const mkWall = (w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; room.add(m);
    return m;
  };
  mkWall(6.65, 6, -4.675, 3, -6, 0);
  mkWall(6.65, 6, 4.675, 3, -6, 0);
  mkWall(16, 2.1, 0, 4.95, -6, 0);
  mkWall(16, 6, 0, 3, 6, Math.PI);
  mkWall(12, 6, -8, 3, 0, Math.PI / 2);
  mkWall(12, 6, 8, 3, 0, -Math.PI / 2);

  // art-deco archway: dark door + stepped gold frames
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), new THREE.MeshBasicMaterial({ color: 0x07030c }));
  arch.position.set(0, 1.7, -5.97); room.add(arch);
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc08a2e, roughness: 0.35, metalness: 0.6, emissive: 0x694208, emissiveIntensity: 0.4 });
  [[2.7, 3.9], [3.15, 4.35]].forEach(([w, h]) => {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 0.1), trimMat);
    top.position.set(0, h, -5.94); room.add(top);
    [-1, 1].forEach(s => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.1), trimMat);
      side.position.set(s * w / 2, h / 2, -5.94); room.add(side);
    });
  });
  const archGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffb340'), transparent: true, opacity: 0.4, depthWrite: false }));
  archGlow.scale.set(2.6, 3.8, 1); archGlow.position.set(0, 1.7, -5.9); room.add(archGlow);

  // aztec-deco stepped plinths (replace pillars)
  const pilMat = new THREE.MeshStandardMaterial({ color: 0x3a1f3e, roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc08a2e, roughness: 0.4, metalness: 0.55, emissive: 0x4a2e06, emissiveIntensity: 0.35 });
  [[-5, -4], [5, -4], [-5, 4], [5, 4]].forEach(([x, z]) => {
    let y = 0;
    [[1.5, 0.5], [1.15, 0.5], [0.85, 4.2], [1.1, 0.4], [1.35, 0.4]].forEach(([w, h], i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), i === 1 || i === 3 ? goldMat : pilMat);
      m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; room.add(m);
      y += h;
    });
  });

  // candle clusters (replace torches)
  const candlePts = [];
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.7 });
  const mkCandle = (x, y, z, h) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, h, 10), waxMat);
    c.position.set(x, y + h / 2, z); room.add(c);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffaa33'), transparent: true, opacity: 0.95, depthWrite: false }));
    f.scale.set(0.34, 0.5, 1); f.position.set(x, y + h + 0.18, z); room.add(f);
    return f;
  };
  [[-7.4, -3], [-7.4, 3], [7.4, -3], [7.4, 3]].forEach(([x, z]) => {
    // small side altar: step + 3 candles + light
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.8), pilMat);
    step.position.set(x, 0.25, z); step.castShadow = true; room.add(step);
    const fs = [mkCandle(x - 0.22, 0.5, z, 0.7), mkCandle(x, 0.5, z + 0.18, 0.95), mkCandle(x + 0.22, 0.5, z - 0.1, 0.55)];
    const l = new THREE.PointLight(0xff8f2a, 10, 10, 1.5);
    l.position.set(x, 2.0, z); room.add(l);
    candlePts.push({ flames: fs, l, seed: Math.random() * 100 });
  });
  room.userData.candles = candlePts;

  // papel picado: strings of cut-paper flags
  function papelTexture(color) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 80;
    const g2 = c.getContext('2d');
    g2.fillStyle = color; g2.fillRect(0, 0, 64, 80);
    g2.globalCompositeOperation = 'destination-out';
    // cut-out pattern: diamonds + scalloped bottom
    for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) {
      const cx = 16 + q * 32, cy = 18 + r * 20;
      g2.beginPath(); g2.moveTo(cx, cy - 6); g2.lineTo(cx + 6, cy); g2.lineTo(cx, cy + 6); g2.lineTo(cx - 6, cy); g2.fill();
    }
    for (let q = 0; q < 4; q++) { g2.beginPath(); g2.arc(8 + q * 16, 80, 8, Math.PI, 0); g2.fill(); }
    g2.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const papelColors = ['#ff8f1f', '#e8397a', '#1fb8a6', '#ffd23a', '#8f4ae8'];
  const papelFlags = [];
  [-3.4, -0.4, 2.6].forEach((zRow, ri) => {
    const yTop = 4.6 - ri * 0.15;
    for (let i = 0; i < 9; i++) {
      const x = -6.4 + i * 1.6;
      const sag = Math.sin((i / 8) * Math.PI) * 0.35;
      const f = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.9),
        new THREE.MeshBasicMaterial({ map: papelTexture(papelColors[(i + ri) % papelColors.length]), transparent: true, side: THREE.DoubleSide, alphaTest: 0.15 })
      );
      f.position.set(x, yTop - sag - 0.45, zRow);
      room.add(f);
      papelFlags.push({ f, seed: (ri * 10 + i) * 0.7 });
    }
    // string
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 14.4, 4), new THREE.MeshBasicMaterial({ color: 0x0c0c0c }));
    line.rotation.z = Math.PI / 2; line.position.set(0, yTop, zRow); room.add(line);
  });
  room.userData.papel = papelFlags;

  // ofrenda altar behind the dummy
  const altar = new THREE.Group();
  {
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.35, 1.1), pilMat); t1.position.y = 0.95; t1.castShadow = true; altar.add(t1);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.8), pilMat); t2.position.set(0, 0.45, 0.1); altar.add(t2);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 1.2), new THREE.MeshStandardMaterial({ color: 0xe8397a, roughness: 0.8 }));
    cloth.position.y = 1.15; altar.add(cloth);
    // photo frame (glowing)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), goldMat);
    frame.position.set(0, 1.65, -0.25); altar.add(frame);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
    photo.position.set(0, 1.65, -0.21); altar.add(photo);
    // candles + marigold mounds
    altar.userData = altar.userData || {};
    const aflames = [];
    [-1.1, -0.7, 0.7, 1.1].forEach((x, i) => aflames.push(mkCandle(x, 1.18, -4.6 - 0.3 + (i % 2) * 0.2, 0.4 + (i % 2) * 0.25)));
    const marMat = new THREE.MeshStandardMaterial({ color: 0xff8f1f, emissive: 0x662d00, emissiveIntensity: 0.5, roughness: 0.8 });
    [[-1.35, 0.35], [1.35, 0.35], [-0.5, 0.45], [0.5, 0.45]].forEach(([x, z]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), marMat);
      m.scale.y = 0.6; m.position.set(x, 1.3, z); altar.add(m);
    });
    const al = new THREE.PointLight(0xffa030, 8, 7, 1.6); al.position.set(0, 2.4, 0.4); altar.add(al);
    altar.userData.flames = aflames; altar.userData.light = al;
  }
  altar.position.set(0, 0, -4.6); room.add(altar);
  room.userData.altar = altar;

  // drifting marigold petals (replace dust)
  const N = 260, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const petalCols = [[1.0, 0.56, 0.12], [1.0, 0.72, 0.2], [0.95, 0.4, 0.15]];
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 15;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 11;
    const pc = petalCols[i % 3];
    col[i * 3] = pc[0]; col[i * 3 + 1] = pc[1]; col[i * 3 + 2] = pc[2];
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
  room.add(dust); room.userData.dust = dust;

  // petal carpet: path of marigold petals from door to altar
  const carpetGeo = new THREE.PlaneGeometry(0.16, 0.12);
  const carpetMat = new THREE.MeshBasicMaterial({ color: 0xff8f1f, transparent: true, opacity: 0.85 });
  const carpet = new THREE.InstancedMesh(carpetGeo, carpetMat, 140);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 140; i++) {
    const t = i / 140;
    const x = (Math.random() - 0.5) * (1.1 + t * 0.8);
    const z = -4.3 + t * 8.4;
    q.setFromAxisAngle(up, Math.random() * Math.PI);
    m4.makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
    m4.setPosition(x, 0.012, z);
    carpet.setMatrixAt(i, m4);
  }
  room.add(carpet);


  // ---- corridor to the Ninth Underworld (z -6 .. -26) ----
  const corr = new THREE.Group(); room.add(corr);
  {
    const cfloor = new THREE.Mesh(new THREE.PlaneGeometry(7, 20.4), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }));
    cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(0, 0, -16); cfloor.receiveShadow = true; corr.add(cfloor);
    const cwall = (x, ry) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(20.4, 6), wallMat);
      m.position.set(x, 3, -16); m.rotation.y = ry; m.receiveShadow = true; corr.add(m);
    };
    cwall(-3.5, Math.PI / 2); cwall(3.5, -Math.PI / 2);
    // end wall with dark arch
    const ew = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), wallMat);
    ew.position.set(0, 3, -26); corr.add(ew);
    const earch = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3), new THREE.MeshBasicMaterial({ color: 0x07030c }));
    earch.position.set(0, 1.5, -25.97); corr.add(earch);
    room.userData.endWall = ew; room.userData.endArch = earch;
    const portal = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#c070ff'), transparent: true, opacity: 0.85, depthWrite: false }));
    portal.scale.set(2.4, 3.4, 1); portal.position.set(0, 1.7, -25.9); portal.visible = false; corr.add(portal);
    room.userData.portal = portal;
    // candle pairs + papel strings along the hall
    for (let i = 0; i < 4; i++) {
      const z = -9 - i * 4.4;
      [[-3.1], [3.1]].forEach(([x]) => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), pilMat);
        step.position.set(x, 0.2, z); corr.add(step);
        room.userData.candles.push({ flames: [mkCandle(x - 0.12, 0.4, z, 0.5), mkCandle(x + 0.12, 0.4, z + 0.1, 0.68)], l: (() => { const l = new THREE.PointLight(0xff8f2a, 6, 7, 1.5); l.position.set(x, 1.6, z); corr.add(l); return l; })(), seed: Math.random() * 100 });
      });
    }
    for (let s = 0; s < 4; s++) {
      const z = -8.5 - s * 3.3;
      for (let i = 0; i < 5; i++) {
        const x = -2.6 + i * 1.3;
        const sag = Math.sin((i / 4) * Math.PI) * 0.25;
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshBasicMaterial({ map: papelTexture(papelColors[(i + s) % papelColors.length]), transparent: true, side: THREE.DoubleSide, alphaTest: 0.15 }));
        f.position.set(x, 4.1 - sag - 0.38, z); corr.add(f);
        room.userData.papel.push({ f, seed: (s * 7 + i) * 0.9 });
      }
    }
    // petal path continues down the corridor
    const cp = new THREE.InstancedMesh(carpetGeo, carpetMat, 100);
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
      m4.setPosition((Math.random() - 0.5) * 1.4, 0.012, -6.2 - t * 18.6);
      cp.setMatrixAt(i, m4);
    }
    corr.add(cp);
  }

  // ---- marigold bridge + Ninth Gate plaza (z -26 .. -56) ----
  const plaza = new THREE.Group(); room.add(plaza);
  {
    const marMatP = new THREE.MeshStandardMaterial({ color: 0xff8f1f, emissive: 0x552400, emissiveIntensity: 0.6, roughness: 0.8 });
    // glowing petal river far below the bridge
    const riverTex = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const g2 = c.getContext('2d');
      g2.fillStyle = '#160603'; g2.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * 256, y = Math.random() * 256, r = 2 + Math.random() * 6;
        const col = Math.random() < 0.75 ? '255,143,31' : '255,210,58';
        const grd = g2.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, 'rgba(' + col + ',0.9)'); grd.addColorStop(1, 'rgba(' + col + ',0)');
        g2.fillStyle = grd; g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.fill();
      }
      const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace;
      t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(2, 4);
      return t2;
    })();
    room.userData.river = riverTex;
    const river = new THREE.Mesh(new THREE.PlaneGeometry(18, 32), new THREE.MeshBasicMaterial({ map: riverTex }));
    river.rotation.x = -Math.PI / 2; river.position.set(0, -2.4, -41); plaza.add(river);
    // bridge deck + railings with marigold posts
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 14.5), pilMat);
    deck.position.set(0, -0.15, -33.2); deck.receiveShadow = true; plaza.add(deck);
    [[-1.42], [1.42]].forEach(([x]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 14.5), pilMat);
      rail.position.set(x, 0.62, -33.2); plaza.add(rail);
      for (let i = 0; i < 7; i++) {
        const z = -26.8 - i * 2.15;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.65, 0.09), pilMat);
        post.position.set(x, 0.32, z); plaza.add(post);
        const mg = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), marMatP);
        mg.position.set(x, 0.72, z); plaza.add(mg);
      }
    });
    // petals scattered on the bridge
    const bp = new THREE.InstancedMesh(carpetGeo, carpetMat, 80);
    for (let i = 0; i < 80; i++) {
      const tt = i / 80;
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
      m4.setPosition((Math.random() - 0.5) * 2.0, 0.015, -26.6 - tt * 13);
      bp.setMatrixAt(i, m4);
    }
    plaza.add(bp);
    // plaza floor + low deco side walls
    const pfloor = new THREE.Mesh(new THREE.PlaneGeometry(13, 16.4), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }));
    pfloor.rotation.x = -Math.PI / 2; pfloor.position.set(0, 0.001, -48.2); pfloor.receiveShadow = true; plaza.add(pfloor);
    [[-6.4], [6.4]].forEach(([x]) => {
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 16.4), new THREE.MeshStandardMaterial({ map: wallMat.map, roughness: 0.9 }));
      w2.position.set(x, 0.55, -48.2); plaza.add(w2);
    });
    // stepped pyramids with braziers flanking the gate
    [[-4.4], [4.4]].forEach(([x]) => {
      for (let s2 = 0; s2 < 3; s2++) {
        const w3 = 2.2 - s2 * 0.6;
        const st = new THREE.Mesh(new THREE.BoxGeometry(w3, 0.5, w3), pilMat);
        st.position.set(x, 0.25 + s2 * 0.5, -52.5); plaza.add(st);
      }
      room.userData.candles.push({ flames: [mkCandle(x - 0.2, 1.5, -52.5, 0.7), mkCandle(x + 0.2, 1.5, -52.4, 0.9)], l: (() => { const l3 = new THREE.PointLight(0xff8f2a, 7, 9, 1.5); l3.position.set(x, 2.6, -52.3); plaza.add(l3); return l3; })(), seed: Math.random() * 100 });
    });
    // the Ninth Gate: pillars, stepped lintel, glowing sealed door
    [[-1.6], [1.6]].forEach(([x]) => {
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.4, 0.9), pilMat);
      p2.position.set(x, 2.7, -54.5); plaza.add(p2);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.22, 0.98), marMatP);
      trim.position.set(x, 4.2, -54.5); plaza.add(trim);
      const trim2 = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.22, 0.98), marMatP);
      trim2.position.set(x, 1.4, -54.5); plaza.add(trim2);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 1.1), marMatP);
    lintel.position.set(0, 5.6, -54.5); plaza.add(lintel);
    const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 0.9), pilMat);
    lintel2.position.set(0, 6.3, -54.5); plaza.add(lintel2);
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.0), new THREE.MeshBasicMaterial({ color: 0xa050ff }));
    doorGlow.position.set(0, 2.5, -54.44); plaza.add(doorGlow);
    const doorSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#b060ff'), transparent: true, opacity: 0.5, depthWrite: false }));
    doorSprite.scale.set(3.6, 6.0, 1); doorSprite.position.set(0, 2.6, -54.2); plaza.add(doorSprite);
    const gateLight = new THREE.PointLight(0x9a4dff, 14, 18, 1.4); gateLight.position.set(0, 3, -53); plaza.add(gateLight);
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(13, 8), new THREE.MeshStandardMaterial({ map: wallMat.map, roughness: 0.9 }));
    bw.position.set(0, 4, -55.4); plaza.add(bw);
    // papel strings over the plaza
    for (let s = 0; s < 3; s++) {
      const z = -42 - s * 3.6;
      for (let i = 0; i < 7; i++) {
        const x = -4.5 + i * 1.5;
        const sag = Math.sin((i / 6) * Math.PI) * 0.3;
        const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshBasicMaterial({ map: papelTexture(papelColors[(i + s) % papelColors.length]), transparent: true, side: THREE.DoubleSide, alphaTest: 0.15 }));
        fp.position.set(x, 4.5 - sag - 0.38, z); plaza.add(fp);
        room.userData.papel.push({ f: fp, seed: (s * 11 + i) * 1.3 });
      }
    }
    // floating lanterns
    room.userData.lanterns = [];
    for (let i = 0; i < 6; i++) {
      const ln = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffbf5a'), transparent: true, opacity: 0.85, depthWrite: false }));
      const x = (Math.random() - 0.5) * 8, y = 2.0 + Math.random() * 1.6, z = -41 - Math.random() * 12;
      ln.scale.set(0.5, 0.68, 1); ln.position.set(x, y, z); ln.userData.y0 = y;
      plaza.add(ln); room.userData.lanterns.push(ln);
    }
    // petal path from the bridge to the gate
    const pp = new THREE.InstancedMesh(carpetGeo, carpetMat, 70);
    for (let i = 0; i < 70; i++) {
      const tt = i / 70;
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
      m4.setPosition((Math.random() - 0.5) * 1.6, 0.015, -40.2 - tt * 13);
      pp.setMatrixAt(i, m4);
    }
    plaza.add(pp);
    // candle pairs at the plaza edge
    for (let i = 0; i < 3; i++) {
      const z = -41.5 - i * 4;
      [[-5.6], [5.6]].forEach(([x]) => {
        const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), pilMat);
        step2.position.set(x, 0.2, z); plaza.add(step2);
        room.userData.candles.push({ flames: [mkCandle(x - 0.12, 0.4, z, 0.5), mkCandle(x + 0.12, 0.4, z + 0.1, 0.68)], l: (() => { const l4 = new THREE.PointLight(0xff8f2a, 6, 7, 1.5); l4.position.set(x, 1.6, z); plaza.add(l4); return l4; })(), seed: Math.random() * 100 });
      });
    }
  }

  // lighting: warm candle key + purple fill
  room.add(new THREE.AmbientLight(0x663a55, 0.8));
  const key = new THREE.DirectionalLight(0xffb060, 0.55);
  key.position.set(2, 6, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  room.add(key);
  const dl = new THREE.PointLight(0xb040ff, 3.5, 9, 1.8); dl.position.set(-3, 2.5, 2); room.add(dl);
}

/* ============================== HEART (player SOUL) ============================== */
function heartGeometry(scale = 1) {
  const s = new THREE.Shape();
  const x = 0, y = 0;
  s.moveTo(x, y + 0.5);
  s.bezierCurveTo(x, y + 0.85, x - 0.55, y + 0.85, x - 0.55, y + 0.45);
  s.bezierCurveTo(x - 0.55, y + 0.1, x, y - 0.12, x, y - 0.45);
  s.bezierCurveTo(x, y - 0.12, x + 0.55, y + 0.1, x + 0.55, y + 0.45);
  s.bezierCurveTo(x + 0.55, y + 0.85, x, y + 0.85, x, y + 0.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, steps: 1 });
  g.center(); g.scale(scale, scale, scale);
  return g;
}
const playerHeart = new THREE.Group();
{
  const h = new THREE.Mesh(heartGeometry(0.42), new THREE.MeshStandardMaterial({ color: 0xff0022, emissive: 0xcc0011, emissiveIntensity: 0.9, roughness: 0.3 }));
  h.castShadow = true; playerHeart.add(h);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff2244'), transparent: true, opacity: 0.5, depthWrite: false }));
  glow.scale.set(1.6, 1.6, 1); playerHeart.add(glow);
  const l = new THREE.PointLight(0xff2244, 2.2, 4, 2); playerHeart.add(l);
}
playerHeart.position.set(0, 0.9, 3.6);
scene.add(playerHeart);

/* ============================== THE DUMMY ============================== */
const dummy = new THREE.Group();
{
  const bone = new THREE.MeshStandardMaterial({ color: 0xefe6d0, roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a2a, roughness: 0.6 });
  // stand
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.16, 20), dark);
  base.position.y = 0.08; base.castShadow = true; dummy.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), dark);
  pole.position.y = 0.6; dummy.add(pole);
  // body (bone-white, painted sash)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.95, 18), bone);
  body.position.y = 1.5; body.castShadow = true; dummy.add(body);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.42, 0.22, 18), new THREE.MeshStandardMaterial({ color: 0xe8397a, roughness: 0.7 }));
  sash.position.y = 1.62; dummy.add(sash);
  // sugar-skull head: canvas face texture
  function skullTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g2 = c.getContext('2d');
    // eye sockets: dark with marigold rings
    [[40, 52], [88, 52]].forEach(([x, y]) => {
      g2.fillStyle = '#ff8f1f';
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g2.beginPath(); g2.arc(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 2.8, 0, 7); g2.fill(); }
      g2.fillStyle = '#241028'; g2.beginPath(); g2.arc(x, y, 6.5, 0, 7); g2.fill();
    });
    // nose (inverted heart) + stitched grin + forehead flower
    g2.fillStyle = '#241028';
    g2.beginPath(); g2.moveTo(64, 72); g2.lineTo(60, 66); g2.lineTo(68, 66); g2.fill();
    g2.strokeStyle = '#241028'; g2.lineWidth = 1.8;
    g2.beginPath(); g2.moveTo(42, 92); g2.quadraticCurveTo(64, 102, 86, 92); g2.stroke();
    for (let i = 0; i < 7; i++) { const x = 45 + i * 6.3; g2.beginPath(); g2.moveTo(x, 90 + Math.sin(i / 6 * Math.PI) * 4.4); g2.lineTo(x, 96 + Math.sin(i / 6 * Math.PI) * 4.4); g2.stroke(); }
    g2.fillStyle = '#e8397a';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g2.beginPath(); g2.arc(64 + Math.cos(a) * 8, 26 + Math.sin(a) * 8, 4.5, 0, 7); g2.fill(); }
    g2.fillStyle = '#ffd23a'; g2.beginPath(); g2.arc(64, 26, 4, 0, 7); g2.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 18), new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.8 }));
  head.position.y = 2.3; head.castShadow = true; dummy.add(head);
  dummy.userData.head = head;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: skullTexture(), transparent: true }));
  face.position.set(0, 2.3, 0.39); dummy.add(face);
  // marigold crown ring at neck
  const marMat = new THREE.MeshStandardMaterial({ color: 0xff8f1f, emissive: 0x552400, emissiveIntensity: 0.6, roughness: 0.8 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), marMat);
    m.position.set(Math.cos(a) * 0.3, 1.98, Math.sin(a) * 0.3); dummy.add(m);
  }
  // arms (bone)
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.4, 4, 8);
  const a1 = new THREE.Mesh(armGeo, bone); a1.position.set(-0.45, 1.6, 0); a1.rotation.z = 1.15; dummy.add(a1);
  const a2 = new THREE.Mesh(armGeo, bone); a2.position.set(0.45, 1.6, 0); a2.rotation.z = -1.15; dummy.add(a2);
  dummy.userData.arms = [a1, a2];
  // warm halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffb340'), transparent: true, opacity: 0.28, depthWrite: false }));
  halo.scale.set(2.4, 3.2, 1); halo.position.y = 1.6; dummy.add(halo);
}
dummy.position.set(0, 0, -2.6);
scene.add(dummy);

/* ============================== FROGGIT CALACA ============================== */
const froggit = new THREE.Group();
{
  const bone = new THREE.MeshStandardMaterial({ color: 0xefe6d0, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), bone);
  body.scale.set(1, 0.78, 0.9); body.position.y = 0.85; body.castShadow = true; froggit.add(body);
  // eye stalks with painted rings
  const dark = new THREE.MeshStandardMaterial({ color: 0x241028, roughness: 0.5 });
  [[-0.22], [0.22]].forEach(([x]) => {
    const stalk = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bone);
    stalk.position.set(x, 1.35, 0.18); froggit.add(stalk);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dark);
    eye.position.set(x, 1.38, 0.31); froggit.add(eye);
  });
  // painted grin + marigold chin ring
  const grin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), dark);
  grin.position.set(0, 0.75, 0.47); froggit.add(grin);
  const marMat = new THREE.MeshStandardMaterial({ color: 0xff8f1f, emissive: 0x552400, emissiveIntensity: 0.6, roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), marMat);
    m.position.set(-0.2 + i * 0.1, 0.52, 0.42); froggit.add(m);
  }
  // feet
  [[-0.3], [0.3]].forEach(([x]) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bone);
    f.scale.set(1.3, 0.5, 1.6); f.position.set(x, 0.1, 0.15); froggit.add(f);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffb340'), transparent: true, opacity: 0.22, depthWrite: false }));
  halo.scale.set(1.9, 2.2, 1); halo.position.y = 0.9; froggit.add(halo);
}
froggit.position.set(0, 0, -14);
froggit.visible = true;
scene.add(froggit);

/* ============================== TORIEL OF THE DEAD ============================== */
const toriel = new THREE.Group();
{
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x3d2352, roughness: 0.75 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc08a2e, roughness: 0.4, metalness: 0.55, emissive: 0x4a2e06, emissiveIntensity: 0.4 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.8 });
  // robe: tall tapered body
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 1.05, 2.6, 20), robeMat);
  robe.position.y = 1.3; robe.castShadow = true; toriel.add(robe);
  toriel.userData.robe = robe;
  // robe gold hem
  const hem = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.05, 8, 24), goldMat);
  hem.rotation.x = Math.PI / 2; hem.position.y = 0.06; toriel.add(hem);
  // shoulders
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), robeMat);
  sh.scale.set(1.15, 0.6, 0.9); sh.position.y = 2.55; toriel.add(sh);
  // skull face plate
  function torielFace() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g2 = c.getContext('2d');
    // kind eyes: marigold rings, soft dark sockets
    [[42, 52], [86, 52]].forEach(([x, y]) => {
      g2.fillStyle = '#ff8f1f';
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g2.beginPath(); g2.arc(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 3.2, 0, 7); g2.fill(); }
      g2.fillStyle = '#241028'; g2.beginPath(); g2.ellipse(x, y, 7, 9, 0, 0, 7); g2.fill();
      g2.fillStyle = '#ffd9a0'; g2.beginPath(); g2.arc(x + 1.5, y - 2, 2, 0, 7); g2.fill();
    });
    // gentle smile + nose
    g2.strokeStyle = '#241028'; g2.lineWidth = 2.4;
    g2.beginPath(); g2.moveTo(50, 92); g2.quadraticCurveTo(64, 100, 78, 92); g2.stroke();
    g2.fillStyle = '#241028';
    g2.beginPath(); g2.moveTo(64, 74); g2.lineTo(60, 68); g2.lineTo(68, 68); g2.fill();
    // forehead marigold
    g2.fillStyle = '#ff8f1f';
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g2.beginPath(); g2.arc(64 + Math.cos(a) * 8, 24 + Math.sin(a) * 8, 4, 0, 7); g2.fill(); }
    g2.fillStyle = '#ffd23a'; g2.beginPath(); g2.arc(64, 24, 4.5, 0, 7); g2.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), boneMat);
  head.scale.set(1, 1.1, 0.95); head.position.y = 3.05; head.castShadow = true; toriel.add(head);
  toriel.userData.head = head;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({ map: torielFace(), transparent: true }));
  face.position.set(0, 3.05, 0.4); toriel.add(face);
  // horns: two curved cones
  [[-1, 0.35], [1, -0.35]].forEach(([s]) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.75, 10), boneMat);
    horn.position.set(s * 0.38, 3.5, -0.05);
    horn.rotation.z = s * 0.75;
    toriel.add(horn);
  });
  // candle crown: 3 small flames floating above
  toriel.userData.crown = [];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffaa33'), transparent: true, opacity: 0.9, depthWrite: false }));
    f.scale.set(0.3, 0.45, 1);
    f.position.set((i - 1) * 0.3, 3.85 + (i === 1 ? 0.12 : 0), 0);
    toriel.add(f); toriel.userData.crown.push(f);
  }
  // arms (raised, casting)
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.7, 4, 8);
  const a1 = new THREE.Mesh(armGeo, robeMat); a1.position.set(-0.62, 2.3, 0.25); a1.rotation.z = 0.9; a1.rotation.x = -0.5; toriel.add(a1);
  const a2 = new THREE.Mesh(armGeo, robeMat); a2.position.set(0.62, 2.3, 0.25); a2.rotation.z = -0.9; a2.rotation.x = -0.5; toriel.add(a2);
  toriel.userData.arms = [a1, a2];
  // palm flames
  toriel.userData.palms = [];
  [[-0.95, 2.6, 0.55], [0.95, 2.6, 0.55]].forEach(p => {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff7a1f'), transparent: true, opacity: 0.85, depthWrite: false }));
    f.scale.set(0.5, 0.65, 1); f.position.set(...p); toriel.add(f); toriel.userData.palms.push(f);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#b040ff'), transparent: true, opacity: 0.22, depthWrite: false }));
  halo.scale.set(3.4, 4.4, 1); halo.position.y = 2.2; toriel.add(halo);
}
toriel.position.set(0, 0, -23.5);
toriel.visible = true;
scene.add(toriel);

/* ============================== PAPYRUS CALACA ============================== */
const papyrus = new THREE.Group();
{
  const bone = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.8 });
  const suit = new THREE.MeshStandardMaterial({ color: 0x3a2050, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc08a2e, roughness: 0.4, metalness: 0.5, emissive: 0x4a2e06, emissiveIntensity: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 2.0, 16), suit);
  body.position.y = 1.15; body.castShadow = true; papyrus.add(body);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.16, 16), gold);
  sash.position.y = 1.35; papyrus.add(sash);
  // big pink bowtie
  const bow = new THREE.Group();
  [[-0.16], [0.16]].forEach(([x]) => {
    const w2 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 4), new THREE.MeshStandardMaterial({ color: 0xe8397a, roughness: 0.6 }));
    w2.rotation.z = Math.PI / 2 * (x < 0 ? -1 : 1); w2.position.x = x; bow.add(w2);
  });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe8397a }));
  bow.add(knot);
  bow.position.set(0, 2.24, 0.26); papyrus.add(bow);
  function papyrusFace() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g2 = c.getContext('2d');
    // tall confident sockets
    [[44, 44], [84, 44]].forEach(([x, y]) => {
      g2.fillStyle = '#241028';
      g2.beginPath(); g2.ellipse(x, y, 7, 11, 0, 0, 7); g2.fill();
      g2.fillStyle = '#fff2d0'; g2.beginPath(); g2.arc(x + 2, y - 3, 2.2, 0, 7); g2.fill();
    });
    // determined brows + nose
    g2.strokeStyle = '#241028'; g2.lineWidth = 2.4;
    g2.beginPath(); g2.moveTo(36, 30); g2.lineTo(52, 26); g2.stroke();
    g2.beginPath(); g2.moveTo(76, 26); g2.lineTo(92, 30); g2.stroke();
    g2.fillStyle = '#241028';
    g2.beginPath(); g2.moveTo(64, 64); g2.lineTo(60, 58); g2.lineTo(68, 58); g2.fill();
    // HUGE grin with teeth
    g2.fillStyle = '#241028';
    g2.beginPath(); g2.moveTo(34, 80); g2.quadraticCurveTo(64, 96, 94, 80); g2.quadraticCurveTo(64, 108, 34, 80); g2.fill();
    g2.strokeStyle = '#f4ecd8'; g2.lineWidth = 1.6;
    for (let i = 1; i < 6; i++) { const x = 34 + i * 10; g2.beginPath(); g2.moveTo(x, 82 + Math.sin(i / 6 * Math.PI) * 8); g2.lineTo(x, 90 + Math.sin(i / 6 * Math.PI) * 9); g2.stroke(); }
    const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace;
    return t2;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), bone);
  head.scale.set(1, 1.25, 0.95); head.position.y = 2.75; head.castShadow = true; papyrus.add(head);
  papyrus.userData.head = head;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshBasicMaterial({ map: papyrusFace(), transparent: true }));
  face.position.set(0, 2.75, 0.33); papyrus.add(face);
  // top hat with marigold band
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 20), suit);
  hat.add(brim);
  const crown2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.52, 20), suit);
  crown2.position.y = 0.28; hat.add(crown2);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.315, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xff8f1f, emissive: 0x552400, emissiveIntensity: 0.6 }));
  band.position.y = 0.1; hat.add(band);
  const hm2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), band.material);
  hm2.position.set(0, 0.1, 0.3); hat.add(hm2);
  hat.position.y = 3.35; hat.rotation.z = 0.09; papyrus.add(hat);
  papyrus.userData.hat = hat;
  // long arms, dramatic pose
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.85, 4, 8);
  const a1 = new THREE.Mesh(armGeo, suit); a1.position.set(-0.48, 1.9, 0.05); a1.rotation.z = 0.5; papyrus.add(a1);
  const a2 = new THREE.Mesh(armGeo, suit); a2.position.set(0.48, 1.9, 0.05); a2.rotation.z = -0.5; papyrus.add(a2);
  papyrus.userData.arms = [a1, a2];
  [[-0.78, 1.62], [0.78, 1.62]].forEach(([x, y]) => {
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bone);
    h2.position.set(x, y, 0.05); papyrus.add(h2);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffb340'), transparent: true, opacity: 0.22, depthWrite: false }));
  halo.scale.set(2.6, 3.6, 1); halo.position.y = 2.0; papyrus.add(halo);
}
papyrus.position.set(0, 0, -33);
scene.add(papyrus);

/* ============================== SANS CALACA (gate watcher) ============================== */
const sans = new THREE.Group();
{
  const bone = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.85 });
  const hoodie = new THREE.MeshStandardMaterial({ color: 0x2a3f66, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.95, 14), hoodie);
  body.position.y = 0.55; body.castShadow = true; sans.add(body);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), hoodie);
  hood.scale.set(1, 0.9, 1); hood.position.y = 1.25; sans.add(hood);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), bone);
  head.position.set(0, 1.22, 0.12); sans.add(head);
  const grin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0x241028 }));
  grin.position.set(0, 1.12, 0.37); sans.add(grin);
  const sock = new THREE.MeshStandardMaterial({ color: 0x241028 });
  [[-0.1], [0.1]].forEach(([x]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), sock);
    e.position.set(x, 1.28, 0.35); sans.add(e);
  });
  const eye = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffd23a'), transparent: true, opacity: 0.95, depthWrite: false }));
  eye.scale.set(0.16, 0.16, 1); eye.position.set(-0.1, 1.28, 0.38); sans.add(eye);
  sans.userData.eye = eye;
  sans.rotation.z = 0.06;
}
sans.position.set(2.2, 0, -53.4);
sans.rotation.y = -0.5;
scene.add(sans);


/* ============================== INPUT ============================== */
const keys = {};
let confirmPressed = false, cancelPressed = false;
const dir = { up: false, down: false, left: false, right: false };
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (!keys[k]) {
    if (k === 'z' || k === 'enter') confirmPressed = true;
    if (k === 'x' || k === 'shift') cancelPressed = true;
    if (k === 'arrowup' || k === 'w') dir.up = true;
    if (k === 'arrowdown' || k === 's') dir.down = true;
    if (k === 'arrowleft' || k === 'a') dir.left = true;
    if (k === 'arrowright' || k === 'd') dir.right = true;
  }
  keys[k] = true;
  if (k === 'm') { AudioSys.muted = !AudioSys.muted; document.getElementById('mute').style.color = AudioSys.muted ? '#803030' : 'rgba(255,255,255,0.35)'; }
  AudioSys.init();
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
function consumeConfirm() { const v = confirmPressed; confirmPressed = false; return v; }
function consumeCancel() { const v = cancelPressed; cancelPressed = false; return v; }
function consumeDir(d) { const v = dir[d]; dir[d] = false; return v; }

/* ============================== UI HELPERS ============================== */
const $ = (id) => document.getElementById(id);
const dlgEl = $('dlg'), menuEl = $('menu'), hudEl = $('hud'), battleEl = $('battle');
const fadeEl = $('fade'), meterEl = $('meter'), dmgEl = $('dmg'), cardEl = $('card'), hintEl = $('hint');
const btnEls = [...document.querySelectorAll('.btn')];

function showHint(t) { hintEl.style.display = t ? 'block' : 'none'; hintEl.textContent = t || ''; }
function setFade(opacity, color = '#fff') { fadeEl.style.background = color; fadeEl.style.opacity = opacity; }

// typewriter dialog: returns promise resolved when text finished and Z pressed
let typeToken = 0;
function dialog(lines, opts = {}) {
  return new Promise((resolve) => {
    const my = ++typeToken;
    dlgEl.style.display = 'block';
    menuEl.style.display = 'none';
    dlgEl.textContent = '';
    const full = lines.join('\n');
    let i = 0, done = false;
    const tick = () => {
      if (my !== typeToken) return;
      if (consumeConfirm()) {
        if (!done) { i = full.length; }
        else { if (!opts.hold) { dlgEl.style.display = 'none'; } resolve(); return; }
      }
      if (i < full.length) {
        const ch = full[i];
        i++;
        dlgEl.textContent = full.slice(0, i);
        if (ch !== ' ' && ch !== '\n' && i % 2 === 0) AudioSys.blip();
        setTimeout(tick, 26);
      } else {
        if (!done) { done = true; if (opts.auto) { setTimeout(() => { if (my === typeToken) { dlgEl.style.display = 'none'; resolve(); } }, opts.auto); return; } }
        setTimeout(tick, 33);
      }
    };
    tick();
  });
}

// menu chooser: rows of options, Z to pick, X to back (returns -1)
function choose(options, goldIdx = -1) {
  return new Promise((resolve) => {
    menuEl.style.display = 'block';
    dlgEl.style.display = 'none';
    let sel = 0;
    const render = () => {
      menuEl.innerHTML = options.map((o, i) =>
        `<span class="opt ${i === sel ? 'sel' : ''} ${i === goldIdx ? 'mercy-gold' : ''}" style="${i === goldIdx ? 'color:#ffff66' : ''}">${o}</span>`
      ).join('');
    };
    render();
    const tick = () => {
      if (consumeCancel()) { AudioSys.select(); menuEl.style.display = 'none'; resolve(-1); return; }
      if (consumeDir('up')) { sel = (sel + options.length - 1) % options.length; AudioSys.select(); render(); }
      if (consumeDir('down')) { sel = (sel + 1) % options.length; AudioSys.select(); render(); }
      if (consumeConfirm()) { AudioSys.confirm(); menuEl.style.display = 'none'; resolve(sel); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/* ============================== BATTLE STATE ============================== */
const B = {
  active: false, phase: 'idle', // menu, dialog, act, item, mercy, fight, enemy, over
  foeKey: null, foe: null, foeHP: 0, foeMax: 0, talks: 0,
  playerHP: 20, playerMax: 20,
  items: { 'Monster Candy': 3, 'Spider Donut': 1 },
  turn: 0, invuln: 0, shake: 0, pattern: null, patternT: 0,
  soulMode: 'red', vy: 0, grounded: true, moving: false, captured: false, boardPop: 1, sansMet: false, sansTalking: false,
  done: { calaca: false, froggit: false, toriel: false, papyrus: false },
};
const foeModel = () => B.foe.model();
// stash base emissive so hit-flash can restore it
[dummy, froggit, toriel, papyrus, sans].forEach(m => m.traverse(o => { if (o.material && o.material.isMeshStandardMaterial) o.material.userData.e0 = o.material.emissiveIntensity || 0; }));

const flavor = [
  ['* LA CALACA sways to music only it can hear.'],
  ['* Marigold petals drift through the candlelight.'],
  ["* LA CALACA's painted grin holds steady. Mostly."],
  ['* Somewhere far below, the Ninth Underworld hums\n  a slow bolero.'],
  ['* The candles on the ofrenda flicker in time with\n  the tune.'],
];

/* ---------- petal burst particles ---------- */
const bursts = [];
function petalBurst(pos, color = 0xff8f1f, n = 26) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.065), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true }));
    m.position.set(pos.x + (Math.random() - 0.5) * 0.6, pos.y + Math.random() * 1.6, pos.z + (Math.random() - 0.5) * 0.6);
    scene.add(m);
    const a = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 1.8;
    bursts.push({ m, vx: Math.cos(a) * sp, vy: 1.2 + Math.random() * 2.2, vz: Math.sin(a) * sp, life: 1.6 + Math.random() * 0.8, spin: (Math.random() - 0.5) * 8 });
  }
}
function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life -= dt;
    b.vy -= 3.2 * dt;
    b.m.position.x += b.vx * dt; b.m.position.y += b.vy * dt; b.m.position.z += b.vz * dt;
    b.m.rotation.x += b.spin * dt; b.m.rotation.z += b.spin * 0.7 * dt;
    b.m.material.opacity = Math.min(1, b.life);
    if (b.life <= 0 || b.m.position.y < 0.01) { scene.remove(b.m); b.m.material.dispose(); bursts.splice(i, 1); }
  }
}

/* ---------- foe registry ---------- */
const FOES = {
  calaca: {
    name: 'LA CALACA', hp: 30, model: () => dummy, getPatterns: () => patterns,
    camH: 2.5, camDist: 3.95, lookH: 2.0, boardDY: 1.92, boardDZ: 1.55,
    talksNeeded: 1,
    intro: ['* LA CALACA blocks the marigold path!', '* TORIEL watches from the candle-shadows, arms\n  crossed. This is her test.'],
    flavor: flavor,
    check: ['* LA CALACA  -  ATK 0  DEF 0', '* A sugar-skull heart, painted brave.', '* It looks... nervous. Same.'],
    talk: [['* You talk to LA CALACA.', '* ...', "* It doesn't seem much for conversation.", '* But TORIEL seems happy with you.', '* The marigolds glow a little brighter.']],
    notReady: ['* You offer mercy.', '* LA CALACA shivers. It is not ready to be\n  spared yet.', '* Maybe... try talking first?'],
    spare: ['* You spare LA CALACA.', '* Its painted eyes well up. (Paint cannot cry,\n  but this seems to.)', '* TORIEL steps from the candlelight, smiling.', '* "You did well, my child."'],
    miss: ['* You swing wide. LA CALACA looks mildly\n  embarrassed for you.'],
    hit: ['* You strike LA CALACA. Petals and plaster fly.'],
    lowHP: ['* LA CALACA is barely holding together.'],
    kill: ['* LA CALACA bursts apart!', '* Petals drift down over the ofrenda.', '* ...', '* In the candle-shadows, TORIEL looks away.'],
    winSub: { spared: 'The Land of the Dead feels a little kinder. TORIEL approves.', killed: 'The candles burn colder. TORIEL will remember this.' },
    winNext: 'the corridor north glows with candlelight.',
    revive: ['* You pull yourself back together.', '* LA CALACA is still there. It believes in you.\n  (It has to. It is a calaca.)'],
  },
  froggit: {
    name: 'FROGGIT CALACA', hp: 24, model: () => froggit, getPatterns: () => froggitPatterns,
    camH: 2.3, camDist: 3.7, lookH: 1.6, boardDY: 1.7, boardDZ: 1.5,
    talksNeeded: 1,
    intro: ['* A FROGGIT hops from the shadows!', '* Its painted ribbit echoes down the corridor.'],
    flavor: [
      ['* FROGGIT bounces in place, off the beat.'],
      ['* It croaks something about the Ninth Underworld.\n  You do not understand.'],
      ['* The corridor candles gutter in a draft.'],
    ],
    check: ['* FROGGIT CALACA  -  ATK 2  DEF 1', '* A small dead frog with a big painted smile.', '* It just wants to hop along.'],
    talk: [['* You compliment FROGGIT\u2019s hop form.', '* It blushes under the paint.']],
    notReady: ['* FROGGIT tilts its head. Not yet.'],
    spare: ['* You spare FROGGIT.', '* It hops a tiny happy hop and settles into\n  the petals.'],
    miss: ['* You miss. FROGGIT hops politely out of\n  the way.'],
    hit: ['* You bop FROGGIT. It squeaks.'],
    lowHP: ['* FROGGIT is hopping on one leg.'],
    kill: ['* FROGGIT bursts into petals.', '* The corridor feels emptier.'],
    winSub: { spared: 'FROGGIT watches you go, smiling.', killed: 'Petals scatter down the corridor.' },
    winNext: 'a tall figure waits at the far arch.',
    revive: ['* You get back up.', '* FROGGIT is still hopping. Encouragingly?'],
  },
  toriel: {
    name: 'TORIEL', hp: 80, model: () => toriel, getPatterns: () => torielPatterns,
    camH: 3.0, camDist: 4.9, lookH: 2.6, boardDY: 2.1, boardDZ: 1.9,
    talksNeeded: 3, merciful: true, boss: true,
    intro: ['* TORIEL, Keeper of the Dead\u2019s Door, bars the way.', '* "You wish to pass, my child? Then show me\n  your heart... or your resolve."'],
    flavor: [
      ['* Candle-flames orbit TORIEL like patient moths.'],
      ['* Her painted smile does not waver.'],
      ['* You smell marigolds and old, warm stone.'],
      ['* TORIEL hums a lullaby in a minor key.'],
    ],
    check: ['* TORIEL  -  ATK 6  DEF 4', '* Keeper of the Dead\u2019s Door. Mother of the\n  Ninth Gate.', '* Her fire has never burned a child. Not once.'],
    talk: [
      ['* You tell TORIEL you don\u2019t want to fight.', '* Her flames dip, just slightly.'],
      ['* You tell her about the calaca you spared.', '* Her candle crown flickers. Something soft\n  crosses her face.'],
      ['* You say you only want to go home.', '* TORIEL\u2019s flames gutter low.', '* "...Then go, my child. And do not look back."'],
    ],
    notReady: ['* You reach for mercy.', '* TORIEL shakes her head gently. "Not yet.', '* Show me you mean it. Speak to me."'],
    spare: ['* You spare TORIEL.', '* The last flame in her palms goes quiet.', '* She kneels, and the marigolds bow with her.', '* "Walk well, my child. The dead will watch\n  over you."'],
    miss: ['* You swing. TORIEL does not move. She does\n  not need to.'],
    hit: ['* You strike TORIEL. Her smile falters.'],
    lowHP: ['* TORIEL is swaying. Her candles dim.'],
    kill: ['* TORIEL\u2019s flames go out, one by one.', '* "So. You are like the others after all."', '* She crumbles into petals and candle-smoke.', '* The door stands open. Nothing feels won.'],
    winSub: { spared: 'The Keeper of the Door stepped aside with a smile.', killed: 'The door is open. The candles are out.' },
    winNext: 'a marigold bridge glows beyond the open arch.',
    revive: ['* You cannot give up just yet.', '* TORIEL lowers her palms. "Again, then.\n  Gently, my child."'],
  },
  papyrus: {
    name: 'PAPYRUS CALACA', hp: 60, model: () => papyrus, getPatterns: () => papyrusPatterns,
    soul: 'blue', capture: true, music: 'papyrus',
    camH: 3.1, camDist: 5.0, lookH: 2.3, boardDY: 2.15, boardDZ: 1.9,
    talksNeeded: 2,
    intro: ['* PAPYRUS CALACA strikes a pose on the bridge!', '* "NYEH HEH HEH! A LIVING SOUL, CROSSING MY\n  MARIGOLD BRIDGE!"', '* "I, THE GREAT PAPYRUS, SHALL CAPTURE YOU!\n  ...POLITELY."'],
    flavor: [
      ['* PAPYRUS adjusts his top hat. It is also dead.\n  The hat is very brave about it.'],
      ['* Maracas rattle somewhere off the beat.'],
      ['* PAPYRUS mutters about his "FAMOUS\n  PAN-DE-MUERTO PUZZLE."'],
    ],
    check: ['* PAPYRUS CALACA  -  ATK 4  DEF 2', '* Self-appointed Guardian of the Marigold\n  Bridge.', '* Loves puzzles, spaghetti de muerto, and\n  being tall.'],
    talk: [
      ['* You ask about the bridge.', '* "I PAINTED EVERY PETAL MYSELF! TWICE!"', '* His chest puffs with pride.'],
      ['* You say his hat is magnificent.', '* "NYEH!!! YOU HAVE EXCELLENT TASTE!"', '* "PERHAPS YOU ARE NOT WORTH CAPTURING\n  AFTER ALL..."'],
    ],
    notReady: ['* You offer mercy.', '* "A TRICK! THE GREAT PAPYRUS IS NOT FOOLED!"', '* (He looks like he wants to be fooled.)'],
    spare: ['* You spare PAPYRUS.', '* "NYEH...? YOU... WANT TO BE MY FRIEND?"', '* "THEN IT IS SETTLED! FRIENDS!! I SHALL\n  WRITE IT IN MY CALENDAR OF BONES!"'],
    miss: ['* You miss. PAPYRUS poses anyway.', '* "A VALIANT EFFORT!"'],
    hit: ['* You bop PAPYRUS. His hat spins.', '* "A DIRECT HIT! WELL STRUCK!"'],
    lowHP: ['* PAPYRUS wobbles. "I AM... MOSTLY FINE!"'],
    kill: ['* PAPYRUS tips his hat.', '* "WELL. YOU ARE STRONG... AND NOTHING ELSE."', '* He crumbles into petals.', '* The bridge feels very long now.'],
    winSub: { spared: 'PAPYRUS declared you his friend and taught you the handshake. It has 40 steps.', killed: 'The marigold bridge is quiet. No maracas play.' },
    winNext: 'the Ninth Gate stands sealed... for now. (v0.4 - to be continued)',
    revive: ['* You refuse to fall.', '* "SEE? DETERMINATION! MY FAVORITE BONE-TRAIT!"'],
  },
};

function updateHP() {
  $('hpfill').style.width = Math.max(0, B.playerHP / B.playerMax * 100) + '%';
  $('hptxt').textContent = `${Math.max(0, B.playerHP)} / ${B.playerMax}`;
}

/* ---------- bullet board (3D plane in scene) ---------- */
const board = {
  group: new THREE.Group(), w: 3.4, h: 2.3, visible: false,
  heart: null, bullets: [],
};
{
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  const mk = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, 0); board.group.add(m); };
  const t = 0.045;
  mk(board.w, t, 0, board.h / 2); mk(board.w, t, 0, -board.h / 2);
  mk(t, board.h, -board.w / 2, 0); mk(t, board.h, board.w / 2, 0);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(board.w, board.h), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
  back.position.z = -0.01; board.group.add(back);

  board.heart = new THREE.Group();
  const hm = new THREE.Mesh(heartGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
  board.heart.add(hm);
  const hg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff2244'), transparent: true, opacity: 0.6, depthWrite: false }));
  hg.scale.set(0.55, 0.55, 1); board.heart.add(hg);
  board.heart.userData.mesh = hm; board.heart.userData.glow = hg;
  board.heart.position.z = 0.02;
  board.group.add(board.heart);
  board.group.position.set(0, 1.92, -1.05);
  board.group.scale.setScalar(0.62);
  board.group.visible = false;
  scene.add(board.group);
}
function boardShow(v) { board.visible = v; board.group.visible = v; }

function spawnBullet(x, y, vx, vy, opts = {}) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: opts.color || 0xffffff }));
  g.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(opts.glow || '#ffffff'), transparent: true, opacity: 0.75, depthWrite: false }));
  glow.scale.set(0.42, 0.42, 1); g.add(glow);
  // 3D entrance: fly in from depth
  g.position.set(x, y, opts.fromDepth !== false ? -1.6 : 0.02);
  board.group.add(g);
  board.bullets.push({ g, x, y, vx, vy, sway: opts.sway || 0, homing: opts.homing || false, seed: Math.random() * 10, age: 0, r: 0.085 });
}

/* patterns */
const froggitPatterns = [
  { name: 'hop-shot', dur: 5, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 0.85;
        // aimed slow hops: spawn at top, arc toward heart's position at spawn
        const hx = board.heart.position.x, hy = board.heart.position.y;
        const sx = (Math.random() - 0.5) * board.w, sy = board.h / 2 + 0.1;
        const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1;
        const sp = 0.75;
        spawnBullet(sx, sy, dx / d * sp, dy / d * sp, { sway: 0.9, glow: '#aef0c8', color: 0xaef0c8 });
      } } },
  { name: 'lilypad-ring', dur: 5, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 1.1; p.n = (p.n || 0) + 1;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + p.n * 0.3;
          spawnBullet(0, 0, Math.cos(a) * 0.6, Math.sin(a) * 0.6, { fromDepth: false, glow: '#ffb340', color: 0xffb340 });
        }
      } } },
];
const torielPatterns = [
  { name: 'flame-wave', dur: 7, tick(p, dt) {
      // falling flame rows with a gap
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 1.15;
        const gap = (Math.random() - 0.5) * (board.w - 1.2);
        for (let x = -board.w / 2 + 0.15; x < board.w / 2; x += 0.34) {
          if (Math.abs(x - gap) < 0.45) continue;
          spawnBullet(x, board.h / 2 + 0.12, 0, -1.0, { glow: '#ff7a1f', color: 0xff6a10, sway: 0.25 });
        }
      } } },
  { name: 'hand-sweep', dur: 7, tick(p, dt) {
      // curtains sweeping from alternating sides with a moving safe lane
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 1.0; p.n = (p.n || 0) + 1;
        const fromLeft = p.n % 2 === 0;
        const lane = (Math.random() - 0.5) * (board.h - 1.0);
        for (let y = -board.h / 2 + 0.1; y < board.h / 2; y += 0.3) {
          if (Math.abs(y - lane) < 0.42) continue;
          spawnBullet(fromLeft ? -board.w / 2 - 0.12 : board.w / 2 + 0.12, y, fromLeft ? 0.95 : -0.95, 0, { glow: '#ff9540', color: 0xff8f2a });
        }
      } } },
  { name: 'homing-embers', dur: 8, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 0.7;
        const a = Math.random() * Math.PI * 2;
        const b = { };
        spawnBullet(Math.cos(a) * board.w * 0.45, Math.sin(a) * board.h * 0.45, 0, 0, { glow: '#ffd23a', color: 0xffb340, homing: true });
      } } },
];
/* bones (Papyrus): wide bullets; blue bones only bite a MOVING soul */
function spawnBone(x, y, vx, opts = {}) {
  const w = opts.w || 0.5, h = opts.h || 0.16;
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: opts.blue ? 0x3fa9ff : 0xf4ecd8 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), mat));
  if (w >= h) {
    [[-w / 2], [w / 2]].forEach(([kx]) => {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(h * 0.75, 6, 6), mat);
      knob.position.x = kx; g.add(knob);
    });
  } else {
    [[-h / 2], [h / 2]].forEach(([ky]) => {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(w * 0.75, 6, 6), mat);
      knob.position.y = ky; g.add(knob);
    });
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(opts.blue ? '#55b5ff' : '#fff2d0'), transparent: true, opacity: 0.45, depthWrite: false }));
  const gs = Math.max(w, h) + 0.25;
  glow.scale.set(gs, gs, 1); g.add(glow);
  g.position.set(x, y, -1.6);
  board.group.add(g);
  board.bullets.push({ g, x, y, vx, vy: 0, w, h, bone: true, blue: !!opts.blue, sway: 0, homing: false, seed: Math.random() * 10, age: 0, r: 0 });
}
const papyrusPatterns = [
  { name: 'bone-hop', dur: 8, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 1.05;
        if (Math.random() < 0.22) spawnBone(board.w / 2 + 0.4, -board.h / 2 + 0.55, -1.6, { w: 0.18, h: 1.1 }); // tall: stay down
        else spawnBone(board.w / 2 + 0.4, -board.h / 2 + 0.13, -1.6, { w: 0.55, h: 0.18 });                     // low: jump!
      } } },
  { name: 'blue-standstill', dur: 8, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 1.25; p.n = (p.n || 0) + 1;
        if (p.n % 2 === 0) spawnBone(board.w / 2 + 0.4, 0, -1.35, { w: 0.2, h: board.h - 0.2, blue: true }); // freeze!
        else spawnBone(board.w / 2 + 0.4, -board.h / 2 + 0.13, -1.6, { w: 0.55, h: 0.18 });                    // jump!
      } } },
  { name: 'fabled-special', dur: 5, tick(p, dt) {
      // he is preparing his SPECIAL ATTACK. any second now. definitely.
      if (!p.fired && B.patternT > 4.0) { p.fired = true;
        spawnBone(0, 0, 0.6, 0, { w: 0.3, h: 0.14 });
      } } },
];
const patterns = [
  { name: 'petal-rain', dur: 6, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 0.55; spawnBullet((Math.random() - 0.5) * (board.w - 0.4), board.h / 2 + 0.15, 0, -0.85, { sway: 0.5, glow: '#ffb340', color: 0xff8f1f }); }
    } },
  { name: 'calavera-cross', dur: 6, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 0.9;
        const y = (Math.random() - 0.5) * (board.h - 0.5);
        spawnBullet(-board.w / 2 - 0.15, y, 0.95, 0, { glow: '#ff7ab0', color: 0xe8397a });
        spawnBullet(board.w / 2 + 0.15, -y, -0.95, 0, { glow: '#ff7ab0', color: 0xe8397a });
      } } },
  { name: 'vela-spiral', dur: 5, tick(p, dt) {
      p.spawn -= dt;
      if (p.spawn <= 0) { p.spawn = 0.8; p.n = (p.n || 0) + 1;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + p.n * 0.45;
          spawnBullet(0, 0, Math.cos(a) * 0.8, Math.sin(a) * 0.8, { fromDepth: false, glow: '#ffd23a', color: 0xffd23a });
        }
      } } },
];

function startEnemyTurn() {
  B.phase = 'enemy';
  B.pattern = Object.assign({ spawn: 0.3 }, B.foe.getPatterns()[B.turn % B.foe.getPatterns().length]);
  B.patternT = 0;
  boardShow(true);
  B.boardPop = 0;
  setFade(0.5, '#fff'); setTimeout(() => setFade(0, '#fff'), 110);
  B.soulMode = B.foe.soul || 'red';
  B.vy = 0; B.grounded = true; B.moving = false;
  dir.up = dir.down = dir.left = dir.right = false;
  board.heart.position.set(0, B.soulMode === 'blue' ? -board.h / 2 + 0.12 : 0, 0.02);
  const soulCol = B.soulMode === 'blue' ? 0x2244ff : 0xff0022;
  board.heart.userData.mesh.material.color.setHex(soulCol);
  board.heart.userData.glow.material.map = glowSprite(B.soulMode === 'blue' ? '#4477ff' : '#ff2244');
  board.heart.userData.glow.material.needsUpdate = true;
  const sh = document.getElementById('soulheart');
  if (sh) sh.style.color = B.soulMode === 'blue' ? '#4477ff' : '#ff2244';
  AudioSys.select();
}
function endEnemyTurn() {
  boardShow(false);
  board.bullets.forEach(b => board.group.remove(b.g));
  board.bullets.length = 0;
  B.turn++;
  B.phase = 'dialog';
  let lines = B.foe.flavor[B.turn % B.foe.flavor.length];
  if (B.captured) {
    B.captured = false;
    lines = ['* PAPYRUS captured you!', '* He put you in his BONE CAGE.', '* The bars were decorative. You stepped out.', '* "NYEH?! MY CAGE!! I SHALL ADD MORE BONES\n  NEXT TIME!"'];
  }
  dialog(lines).then(() => showMenu());
}

function hurtPlayer(dmg) {
  if (B.invuln > 0) return;
  B.playerHP -= dmg;
  if (B.foe && B.foe.capture && B.playerHP < 1) { B.playerHP = 1; B.captured = true; }
  B.invuln = 0.9;
  B.shake = 0.35;
  AudioSys.hurt();
  updateHP();
  if (B.playerHP <= 0) playerDown();
}

function playerDown() {
  B.phase = 'over';
  boardShow(false);
  AudioSys.stopMusic();
  setFade(1, '#000');
  setTimeout(() => {
    cardEl.style.display = 'flex';
    cardEl.innerHTML = `<div class="big">...<br><br>You cannot give up just yet...<br><br><span style="color:#ff4444">STAY DETERMINED!</span></div><div class="small">PRESS [Z]</div>`;
  }, 500);
  const wait = () => {
    if (consumeConfirm()) {
      cardEl.style.display = 'none';
      B.playerHP = B.playerMax; B.invuln = 2; updateHP();
      setFade(0, '#000');
      AudioSys.startMusic(B.foe.music || 'battle');
      B.phase = 'dialog';
      dialog(B.foe.revive).then(() => showMenu());
      return;
    }
    requestAnimationFrame(wait);
  };
  setTimeout(wait, 800);
}

/* ---------- FIGHT meter ---------- */
function fightSequence() {
  B.phase = 'fight';
  meterEl.style.display = 'block';
  const cur = meterEl.querySelector('.cursor');
  let x = 0, dir = 1, done = false;
  const speed = 1.9;
  let last = performance.now();
  const step = (now) => {
    const dt = (now - last) / 1000; last = now;
    if (!done && consumeConfirm()) {
      done = true;
      const d = Math.abs(x - 0.5) * 2; // 0 center, 1 edge
      const dmg = d < 0.06 ? 14 : d < 0.2 ? 11 : d < 0.45 ? 8 : d < 0.75 ? 5 : 0;
      meterEl.style.display = 'none';
      resolveHit(dmg);
      return;
    }
    x += dir * speed * dt;
    if (x > 1) { x = 1; dir = -1; }
    if (x < 0) { x = 0; dir = 1; }
    cur.style.left = (x * 100) + '%';
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function resolveHit(dmg) {
  AudioSys.slash();
  const isKill = dmg >= B.foeHP;
  // slash flash + damage number
  dmgEl.style.display = 'block';
  dmgEl.style.color = dmg === 0 ? '#888' : '#fff';
  dmgEl.textContent = dmg === 0 ? 'MISS' : dmg;
  foeModel().userData.hitFlash = 0.4;
  setTimeout(() => { dmgEl.style.display = 'none'; }, 700);
  B.foeHP = Math.max(0, B.foeHP - dmg);
  B.phase = 'dialog';
  if (isKill) {
    killFoe();
  } else {
    const lines = dmg === 0
      ? B.foe.miss
      : [...B.foe.hit, ...(B.foeHP <= B.foeMax * 0.3 ? B.foe.lowHP : [])];
    dialog(lines).then(() => startEnemyTurn());
  }
}
function killFoe() {
  AudioSys.thud();
  petalBurst(foeModel().position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xff8f1f, 30);
  foeModel().userData.explode = true;
  dialog(B.foe.kill).then(() => {
    victory(false);
  });
}
function victory(spared) {
  B.phase = 'over';
  B.done[B.foeKey] = true;
  boardShow(false);
  if (spared) petalBurst(foeModel().position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xffd23a, 34);
  AudioSys.stopMusic();
  AudioSys.spare();
  setFade(1, '#fff');
  setTimeout(() => {
    setFade(0, '#fff');
    battleEl.style.display = 'none';
    cardEl.style.display = 'flex';
    cardEl.innerHTML = `<div class="big">YOU WON!<br><br>You earned 0 XP and 0 gold.</div><div class="small">${spared ? B.foe.winSub.spared : B.foe.winSub.killed}<br><br>${B.foe.winNext}<br><br>PRESS [Z]</div>`;
    AudioSys.startMusic('ruins');
  }, 400);
  const wait = () => {
    if (consumeConfirm()) {
      cardEl.style.display = 'none';
      B.active = false;
      hudEl.style.display = 'none'; dlgEl.style.display = 'none';
      if (spared) { foeModel().visible = false; }
      exitBattle();
      return;
    }
    requestAnimationFrame(wait);
  };
  setTimeout(wait, 600);
}

/* ---------- menus ---------- */
async function showMenu() {
  B.phase = 'menu';
  let sel = 0;
  const render = () => btnEls.forEach((b, i) => b.classList.toggle('sel', i === sel));
  hudEl.style.display = 'flex';
  render();
  while (B.phase === 'menu') {
    await new Promise(r => {
      const tick = () => {
        if (B.phase !== 'menu') { r(); return; }
        if (consumeDir('left')) { sel = (sel + 3) % 4; AudioSys.select(); render(); }
        if (consumeDir('right')) { sel = (sel + 1) % 4; AudioSys.select(); render(); }
        if (consumeConfirm()) { AudioSys.confirm(); r(); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
    if (B.phase !== 'menu') break;
    const choice = btnEls[sel].dataset.b;
    if (choice === 'FIGHT') { fightSequence(); break; }
    if (choice === 'ACT') {
      B.phase = 'act';
      const pick = await choose(['* Check', '* Talk']);
      if (pick === -1) { B.phase = 'menu'; continue; }
      B.phase = 'dialog';
      if (pick === 0) {
        await dialog(B.foe.check);
      } else {
        const lines = B.foe.talk[Math.min(B.talks, B.foe.talk.length - 1)];
        B.talks++;
        await dialog(lines);
      }
      startEnemyTurn(); break;
    }
    if (choice === 'ITEM') {
      B.phase = 'item';
      const names = Object.keys(B.items).filter(n => B.items[n] > 0);
      if (!names.length) { B.phase = 'dialog'; await dialog(['* Your pockets are empty.']); B.phase = 'menu'; continue; }
      const pick = await choose(names.map(n => `* ${n} x${B.items[n]}`));
      if (pick === -1) { B.phase = 'menu'; continue; }
      const n = names[pick];
      B.items[n]--;
      const healAmt = n === 'Spider Donut' ? 12 : 10;
      B.playerHP = Math.min(B.playerMax, B.playerHP + healAmt);
      updateHP(); AudioSys.heal();
      B.phase = 'dialog';
      await dialog([`* You eat the ${n}.`, `* Recovered ${healAmt} HP!`, ...(n === 'Spider Donut' ? ['* It tastes... webby.'] : [])]);
      startEnemyTurn(); break;
    }
    if (choice === 'MERCY') {
      B.phase = 'mercy';
      const spareReady = B.talks >= B.foe.talksNeeded;
      const pick = await choose(['* Spare'], spareReady ? 0 : -1);
      if (pick === -1) { B.phase = 'menu'; continue; }
      if (spareReady) {
        B.phase = 'dialog';
        foeModel().userData.golden = true;
        await dialog(B.foe.spare);
        victory(true); break;
      } else {
        B.phase = 'dialog';
        await dialog(B.foe.notReady);
        startEnemyTurn(); break;
      }
    }
  }
}

/* ---------- battle enter/exit ---------- */
const battleCamPos = new THREE.Vector3(0, 2.5, 1.35);
const battleCamLook = new THREE.Vector3(0, 2.0, -2.4);
let camMode = 'explore';
let exploreCamPos = new THREE.Vector3(0, 3, 6), exploreCamLook = new THREE.Vector3(0, 1, 0);

function enterBattle(foeKey) {
  B.active = true; B.phase = 'dialog'; B.turn = 0;
  B.foeKey = foeKey; B.foe = FOES[foeKey];
  B.foeHP = B.foe.hp; B.foeMax = B.foe.hp; B.talks = 0;
  B.playerHP = B.playerMax; B.items = { 'Monster Candy': 3, 'Spider Donut': 1 };
  updateHP();
  const m = foeModel();
  // camera + board anchors relative to foe position
  battleCamPos.set(0, B.foe.camH, m.position.z + B.foe.camDist);
  battleCamLook.set(0, B.foe.lookH, m.position.z);
  board.group.position.set(0, B.foe.boardDY, m.position.z + B.foe.boardDZ);
  camMode = 'flash';
  AudioSys.stopMusic();
  AudioSys.noise(0.4, 0.25, 2000);
  setFade(1, '#fff');
  setTimeout(() => {
    setFade(0, '#fff');
    camMode = 'battle';
    playerHeart.visible = false;
    battleEl.style.display = 'block';
    hudEl.style.display = 'flex';
    showHint('');
    AudioSys.startMusic(B.foe.music || 'battle');
    dialog(B.foe.intro).then(() => showMenu());
  }, 450);
}
function exitBattle() {
  const sh = document.getElementById('soulheart');
  if (sh) sh.style.color = '#ff2244';
  gameState = 'explore';
  camMode = 'explore';
  playerHeart.visible = true;
  battleEl.style.display = 'none';
  boardShow(false);
  showHint('WASD — move');
  playerHeart.position.set(0, 0.9, B.foe ? foeModel().position.z + 2.6 : 0.5);
}

/* ============================== GAME STATE / LOOP ============================== */
let gameState = 'title'; // title, explore, battle
const clock = new THREE.Clock();
let started = false;

function startGame() {
  if (started) return;
  started = true;
  AudioSys.init();
  document.getElementById('title').style.display = 'none';
  AudioSys.startMusic('ruins');
  gameState = 'explore';
  showHint('WASD — move\nfollow the marigold path');
  AudioSys.confirm();
}

const tmpV = new THREE.Vector3();
function updateExplore(dt, t) {
  const speed = 3.4;
  let mx = 0, mz = 0;
  if (B.sansTalking) { mx = 0; mz = 0; }
  if (!B.sansTalking && (keys['w'] || keys['arrowup'])) mz -= 1;
  if (!B.sansTalking && (keys['s'] || keys['arrowdown'])) mz += 1;
  if (!B.sansTalking && (keys['a'] || keys['arrowleft'])) mx -= 1;
  if (!B.sansTalking && (keys['d'] || keys['arrowright'])) mx += 1;
  if (mx || mz) {
    const len = Math.hypot(mx, mz); mx /= len; mz /= len;
    let nx = playerHeart.position.x + mx * speed * dt;
    let nz = playerHeart.position.z + mz * speed * dt;
    nz = THREE.MathUtils.clamp(nz, B.done.toriel ? -52.4 : -25.2, 5.2);
    if (nz < -5.9 && Math.abs(nx) > 1.3) nz = Math.max(nz, -5.9); // wall gap only
    let xMax = 7.2;
    if (nz < -5.6) xMax = 2.9;   // corridor
    if (nz < -26.2) xMax = 1.25; // marigold bridge
    if (nz < -40) xMax = 5.7;    // Ninth Gate plaza
    nx = THREE.MathUtils.clamp(nx, -xMax, xMax);
    playerHeart.position.x = nx;
    playerHeart.position.z = nz;
    playerHeart.rotation.y = Math.atan2(mx, mz);
  }
  playerHeart.position.y = 0.9 + Math.sin(t * 2.6) * 0.06;
  playerHeart.rotation.z = Math.sin(t * 1.8) * 0.06;

  // camera follow
  tmpV.copy(playerHeart.position).add(new THREE.Vector3(0, 2.3, 3.6));
  exploreCamPos.lerp(tmpV, 1 - Math.pow(0.002, dt));
  exploreCamLook.lerp(playerHeart.position, 1 - Math.pow(0.002, dt));
  camera.position.copy(exploreCamPos);
  camera.lookAt(exploreCamLook);

  // encounter triggers
  if (!B.done.calaca) {
    const d = Math.hypot(playerHeart.position.x - dummy.position.x, playerHeart.position.z - dummy.position.z);
    if (d < 1.9) { gameState = 'battle'; enterBattle('calaca'); }
  } else if (!B.done.froggit && playerHeart.position.z < -12.2) {
    gameState = 'battle'; enterBattle('froggit');
  } else if (B.done.froggit && !B.done.toriel && playerHeart.position.z < -19.5) {
    gameState = 'battle'; enterBattle('toriel');
  } else if (B.done.toriel && !B.done.papyrus && playerHeart.position.z < -30.8) {
    gameState = 'battle'; enterBattle('papyrus');
  }
  // the gate watcher
  if (B.done.papyrus && !B.sansMet && playerHeart.position.z < -50.2) {
    B.sansMet = true; B.sansTalking = true;
    showHint('');
    dialog(['* (A short calaca in a big hoodie leans against\n  the Ninth Gate, hands in pockets.)',
      '* "heya. real polite bridge-crossing back there.\n  the GREAT PAPYRUS won\'t stop talking\n  about you."',
      '* "me? i\'m nobody. i just watch the door."',
      '* "the ninth gate opens when the ledger\n  balances. kindness weighs more than\n  you\'d think."',
      '* "...see you around, kid. i\'ll be keeping\n  count."',
      '* (His left eye flickers marigold-gold.)']).then(() => { B.sansTalking = false; showHint('WASD — move'); });
  }
}

function updateBattle(dt, t) {
  // camera
  const sway = Math.sin(t * 0.5) * 0.06;
  tmpV.copy(battleCamPos); tmpV.x += sway;
  camera.position.lerp(tmpV, 1 - Math.pow(0.001, dt));
  camera.lookAt(battleCamLook);

  if (B.shake > 0) {
    B.shake -= dt;
    camera.position.x += (Math.random() - 0.5) * B.shake * 0.25;
    camera.position.y += (Math.random() - 0.5) * B.shake * 0.25;
  }
  if (B.boardPop < 1) {
    B.boardPop = Math.min(1, B.boardPop + dt * 3.2);
    const e = 1 - Math.pow(1 - B.boardPop, 3);
    board.group.scale.setScalar(0.62 * (0.35 + 0.65 * e));
  }
  if (B.invuln > 0) {
    B.invuln -= dt;
    board.heart.visible = Math.floor(t * 14) % 2 === 0;
  } else board.heart.visible = true;

  // foe idle + hit reaction
  const fm = B.active && B.foe ? foeModel() : dummy;
  if (!fm.userData.explode) {
    if (B.foeKey === 'calaca' || !B.active) {
      fm.position.y = Math.sin(t * 1.6) * 0.05;
      fm.rotation.y = Math.sin(t * 0.7) * 0.08;
      const h = fm.userData.head;
      if (h) h.position.y = 2.3 + Math.sin(t * 2.1) * 0.03;
      if (fm.userData.arms) {
        fm.userData.arms[0].rotation.z = 1.15 + Math.sin(t * 1.6) * 0.1;
        fm.userData.arms[1].rotation.z = -1.15 - Math.sin(t * 1.6) * 0.1;
      }
    } else if (B.foeKey === 'froggit') {
      fm.position.y = Math.abs(Math.sin(t * 3.2)) * 0.35;
      fm.rotation.y = Math.sin(t * 1.1) * 0.15;
      fm.scale.y = 1 - Math.abs(Math.sin(t * 3.2)) * 0.08;
    } else if (B.foeKey === 'toriel') {
      fm.position.y = 0.15 + Math.sin(t * 0.9) * 0.08;
      fm.rotation.y = Math.sin(t * 0.4) * 0.05;
      if (fm.userData.arms) {
        fm.userData.arms[0].rotation.z = 0.9 + Math.sin(t * 0.9) * 0.15;
        fm.userData.arms[1].rotation.z = -0.9 - Math.sin(t * 0.9) * 0.15;
      }
      if (fm.userData.crown) fm.userData.crown.forEach((f, i) => { f.material.opacity = 0.7 + 0.25 * Math.sin(t * 11 + i * 2); });
      if (fm.userData.palms) fm.userData.palms.forEach((f, i) => { f.material.opacity = 0.6 + 0.3 * Math.sin(t * 9 + i * 3); f.scale.set(0.5 + Math.sin(t * 7 + i) * 0.06, 0.65 + Math.sin(t * 8 + i * 2) * 0.08, 1); });
    } else if (B.foeKey === 'papyrus') {
      fm.position.y = Math.sin(t * 1.5) * 0.06;
      fm.rotation.y = Math.sin(t * 0.9) * 0.12;
      if (fm.userData.arms) { fm.userData.arms[0].rotation.z = 0.5 + Math.sin(t * 1.5) * 0.2; fm.userData.arms[1].rotation.z = -0.5 - Math.cos(t * 1.2) * 0.2; }
      if (fm.userData.head) fm.userData.head.position.y = 2.75 + Math.sin(t * 2.4) * 0.04;
      if (fm.userData.hat) fm.userData.hat.rotation.z = 0.09 + Math.sin(t * 1.8) * 0.03;
    }
    if (fm.userData.hitFlash > 0) {
      fm.userData.hitFlash -= dt;
      fm.position.x = (Math.random() - 0.5) * 0.14;
      fm.children.forEach(c => { if (c.material && c.material.isMeshStandardMaterial) { c.material.emissive = new THREE.Color(0xff3333); c.material.emissiveIntensity = fm.userData.hitFlash; } });
    } else if (!fm.userData.golden) {
      fm.position.x *= 0.8;
      fm.children.forEach(c => { if (c.material && c.material.isMeshStandardMaterial && c.material.emissiveIntensity) { const e0 = c.material.userData.e0; c.material.emissiveIntensity = e0 !== undefined ? e0 : 0; } });
    }
    if (fm.userData.golden) {
      const gl = 0.35 + Math.sin(t * 3) * 0.15;
      fm.children.forEach(c => { if (c.material && c.material.isMeshStandardMaterial) { c.material.emissive = new THREE.Color(0xaa8800); c.material.emissiveIntensity = gl; } });
    }
  } else if (fm.visible) {
    fm.rotation.z += dt * 2.2;
    fm.position.y -= dt * 1.6;
    fm.scale.multiplyScalar(Math.max(0.0, 1 - dt * 1.4));
    if (fm.scale.x < 0.02) fm.visible = false;
  }

  // enemy turn sim
  if (B.phase === 'enemy') {
    const p = B.pattern;
    B.patternT += dt;
    p.tick(p, dt);

    // heart movement inside board (red: free / blue: gravity + jump)
    const hs = 2.7;
    let hx = 0, hy = 0;
    if (keys['a'] || keys['arrowleft']) hx -= 1;
    if (keys['d'] || keys['arrowright']) hx += 1;
    if (B.soulMode === 'blue') {
      const ground = -board.h / 2 + 0.12;
      B.vy -= 12 * dt;
      let ny = board.heart.position.y + B.vy * dt;
      if (ny <= ground) { ny = ground; B.vy = 0; B.grounded = true; } else B.grounded = false;
      if (consumeDir('up') && B.grounded) { B.vy = 5.0; AudioSys.blip(); }
      ny = Math.min(ny, board.h / 2 - 0.12);
      board.heart.position.y = ny;
      B.moving = hx !== 0 || !B.grounded;
    } else {
      if (keys['w'] || keys['arrowup']) hy += 1;
      if (keys['s'] || keys['arrowdown']) hy -= 1;
      if (hx || hy) { const l = Math.hypot(hx, hy); hx /= l; hy /= l; }
      board.heart.position.y = THREE.MathUtils.clamp(board.heart.position.y + hy * hs * dt, -board.h / 2 + 0.12, board.h / 2 - 0.12);
      B.moving = hx !== 0 || hy !== 0;
    }
    board.heart.position.x = THREE.MathUtils.clamp(board.heart.position.x + hx * hs * dt, -board.w / 2 + 0.12, board.w / 2 - 0.12);

    // bullets
    for (let i = board.bullets.length - 1; i >= 0; i--) {
      const b = board.bullets[i];
      b.age += dt;
      if (b.homing) {
        // embers track the heart - but a merciful Keeper's fire bends AWAY when you're weak
        const dx = board.heart.position.x - b.x, dy = board.heart.position.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        const merciful = B.foe && B.foe.merciful && B.playerHP <= 6;
        const sgn = merciful ? -1 : 1;
        const sp = merciful ? 0.55 : 0.7;
        b.vx += (dx / d * sp * sgn - b.vx) * Math.min(1, dt * 2.2);
        b.vy += (dy / d * sp * sgn - b.vy) * Math.min(1, dt * 2.2);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let y = b.y;
      if (b.sway) y += Math.sin(b.age * 3 + b.seed) * 0.18 * b.sway;
      // depth entrance: -1.6 -> 0.02 over 0.5s
      const zTarget = 0.02;
      if (b.g.position.z < zTarget) b.g.position.z = Math.min(zTarget, b.g.position.z + dt * 3.4);
      b.g.position.x = b.x; b.g.position.y = y;
      const sIn = Math.min(1, b.age * 3);
      b.g.scale.setScalar(sIn);
      // out of bounds
      if (b.x < -board.w / 2 - 0.4 || b.x > board.w / 2 + 0.4 || b.y < -board.h / 2 - 0.4 || b.y > board.h / 2 + 0.4) {
        board.group.remove(b.g); board.bullets.splice(i, 1); continue;
      }
      // collision (only once arrived at plane)
      if (b.g.position.z > -0.05 && b.age > 0.3) {
        const dx = b.x - board.heart.position.x, dy = y - board.heart.position.y;
        let hit = false;
        if (b.bone) hit = Math.abs(dx) < b.w / 2 + 0.1 && Math.abs(dy) < b.h / 2 + 0.1;
        else hit = dx * dx + dy * dy < (b.r + 0.13) * (b.r + 0.13);
        if (hit && b.blue && !B.moving) hit = false; // blue bones only bite a moving soul
        if (hit) {
          board.group.remove(b.g); board.bullets.splice(i, 1);
          hurtPlayer(b.bone ? 4 : 3);
          continue;
        }
      }
    }
    if (B.patternT > p.dur && B.phase === 'enemy') endEnemyTurn();
  }
}

function updateRuins(dt, t) {
  // candle clusters flicker
  for (const cc of room.userData.candles) {
    const f = 0.85 + Math.sin(t * 11 + cc.seed) * 0.1 + Math.sin(t * 23 + cc.seed * 2) * 0.06;
    cc.l.intensity = 10 * f;
    cc.flames.forEach((fl, i) => {
      fl.scale.set(0.34 * f, 0.5 * (f + 0.08 * Math.sin(t * 17 + cc.seed + i)), 1);
      fl.material.opacity = 0.8 + 0.15 * Math.sin(t * 13 + cc.seed + i * 2);
    });
  }
  // papel picado sway
  for (const p of room.userData.papel) {
    p.f.rotation.x = Math.sin(t * 0.9 + p.seed) * 0.22;
    p.f.rotation.y = Math.sin(t * 0.6 + p.seed * 1.7) * 0.12;
  }
  // altar flames + light
  const al = room.userData.altar;
  if (al) {
    const f = 0.85 + Math.sin(t * 9 + 3) * 0.12;
    al.userData.light.intensity = 8 * f;
    al.userData.flames.forEach((fl, i) => { fl.material.opacity = 0.75 + 0.2 * Math.sin(t * 12 + i * 1.7); });
  }
  // corridor foes idle while exploring
  if (!B.active) {
    if (froggit.visible && !B.done.froggit) {
      froggit.position.y = Math.abs(Math.sin(t * 3.2)) * 0.3;
      froggit.rotation.y = Math.sin(t * 1.1) * 0.12;
    }
    if (toriel.visible && !B.done.toriel) {
      toriel.position.y = 0.15 + Math.sin(t * 0.9) * 0.07;
      toriel.userData.crown.forEach((f, i) => { f.material.opacity = 0.7 + 0.25 * Math.sin(t * 11 + i * 2); });
      toriel.userData.palms.forEach((f, i) => { f.material.opacity = 0.55 + 0.3 * Math.sin(t * 9 + i * 3); });
    }
    if (sans.visible) {
      sans.userData.eye.material.opacity = 0.55 + 0.4 * Math.max(0, Math.sin(t * 2.2));
      sans.position.y = Math.sin(t * 1.1) * 0.03;
    }
    if (papyrus.visible && !B.done.papyrus) {
      papyrus.position.y = Math.sin(t * 1.4) * 0.05;
      papyrus.rotation.y = Math.sin(t * 0.8) * 0.1;
      if (papyrus.userData.arms) { papyrus.userData.arms[0].rotation.z = 0.5 + Math.sin(t * 1.4) * 0.12; papyrus.userData.arms[1].rotation.z = -0.5 - Math.sin(t * 1.4) * 0.12; }
    }
  }
  // the Keeper's door opens once her test is passed
  if (B.done.toriel && room.userData.endWall && room.userData.endWall.visible) {
    room.userData.endWall.visible = false; room.userData.endArch.visible = false;
    if (room.userData.portal) room.userData.portal.visible = true;
  }
  // petal river shimmer + lantern bob
  if (room.userData.river) room.userData.river.offset.x = (t * 0.03) % 1;
  if (room.userData.lanterns) room.userData.lanterns.forEach((l, i) => { l.position.y = l.userData.y0 + Math.sin(t * 0.8 + i * 1.3) * 0.15; });
  // petals drift down slowly, swirl
  const dp = room.userData.dust.geometry.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    dp.array[i * 3 + 1] -= dt * 0.12;
    dp.array[i * 3] += Math.sin(t * 0.5 + i) * dt * 0.12;
    if (dp.array[i * 3 + 1] < 0) dp.array[i * 3 + 1] = 5;
  }
  dp.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (gameState === 'title') {
    if (consumeConfirm()) startGame();
    camera.position.set(Math.sin(t * 0.12) * 1.4, 2.6, 6);
    camera.lookAt(0, 1.4, -2);
  } else if (gameState === 'explore') {
    updateExplore(dt, t);
  } else if (gameState === 'battle') {
    updateBattle(dt, t);
  }
  updateBursts(dt);
  updateRuins(dt, t);
  renderer.render(scene, camera);
}
animate();

// debug probe (harmless in prod)
window.__G = { get state() { return gameState; }, B, playerHeart, dummy, papyrus, board, dir, keys, hurtPlayer, petalBurst };
