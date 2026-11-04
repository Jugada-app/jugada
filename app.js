// Jugada · app del piloto A
import { CONFIG } from "./config.js";
import { DRILLS, DRILL_BY, createCounter } from "./drills.js";

/* =========================================================
   Datos locales (solo en este teléfono)
   ========================================================= */
const KEY = "jugada.v1";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));
function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.deviceId) return v; } catch (e) {}
  return { deviceId: uid(), profile: null, registeredAt: null, sessions: [], survey: null, queue: [] };
}
let DB = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast("No se pudo guardar en este teléfono"); } }

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SPORT = { futbol: "Futbol", tocho: "Tocho", ambos: "Futbol y tocho" };
const DIST = { dominadas: 3, idavuelta: 6, pasepared: 4, tiro: 5, lanzamiento: 4, arranque: 5 };
const VIEWSIDE = { dominadas: "de frente", idavuelta: "de lado", pasepared: "de lado", tiro: "de lado", lanzamiento: "de lado", arranque: "de lado" };

function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600); }

/* =========================================================
   Medición del piloto: eventos anónimos a Google Sheets
   ========================================================= */
function daysSinceReg() { return DB.registeredAt ? Math.floor((Date.now() - DB.registeredAt) / 86400000) : ""; }
function track(tipo, extra = {}) {
  const p = DB.profile || {};
  DB.queue.push({
    fecha: new Date().toISOString(), dispositivo: DB.deviceId, tipo,
    categoria: p.categoria || "", deporte: p.deporte || "", codigo: p.codigo || "",
    version: CONFIG.version, dias_desde_registro: daysSinceReg(), ...extra,
  });
  if (DB.queue.length > 300) DB.queue = DB.queue.slice(-300);
  save(); flush();
}
let flushing = false;
async function flush() {
  if (!CONFIG.endpoint || flushing || !navigator.onLine || !DB.queue.length) return;
  flushing = true;
  try {
    const batch = DB.queue.slice(0, 25);
    // text/plain evita la verificación CORS previa; Apps Script lo lee igual
    await fetch(CONFIG.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ eventos: batch }) });
    DB.queue = DB.queue.slice(batch.length); save();
  } catch (e) { /* se reintenta al volver la conexión */ }
  flushing = false;
  if (DB.queue.length && CONFIG.endpoint) setTimeout(flush, 1500);
}
addEventListener("online", flush);

/* =========================================================
   Iconos y diagramas
   ========================================================= */
const ICON = {
  dominadas: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="9" r="5.5"/><path d="M8 36h10l4-6"/><path d="M24 18v4"/></svg>`,
  idavuelta: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h26l-6-6M34 26H8l6 6"/></svg>`,
  pasepared: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M34 6v28M30 10l4 4M30 20l4 4"/><circle cx="12" cy="26" r="5.5"/><path d="M20 26h6" stroke-dasharray="2 4"/></svg>`,
  tiro: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 32V10h28v22"/><path d="M6 16h28M14 10v22M26 10v22" stroke-width="1.2" opacity=".55"/><circle cx="20" cy="30" r="4.5"/></svg>`,
  lanzamiento: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><ellipse cx="20" cy="20" rx="14" ry="8.5" transform="rotate(-30 20 20)"/><path d="M15 22l10-6M17 17.5l2 3M20.5 15.5l2 3M23.5 13.5l2 3" stroke-width="1.8"/></svg>`,
  arranque: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10l10 10-10 10M20 10l10 10-10 10"/></svg>`,
};
const sportColor = s => (s === "futbol" ? "var(--pitch)" : s === "tocho" ? "var(--flag)" : "var(--pen)");

function setupDiagram(id) {
  const m = DIST[id], side = VIEWSIDE[id];
  return `<svg viewBox="0 0 320 130" role="img" aria-label="Celular en tripié a ${m} metros, ${side}">
    <line x1="10" y1="112" x2="310" y2="112" stroke="var(--line)" stroke-width="2"/>
    <g stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round">
      <path d="M44 112l8-46M60 112l-8-46M52 112V66"/>
      <rect x="44" y="40" width="16" height="26" rx="3" fill="var(--card)"/>
      <circle cx="52" cy="61" r="1.6" fill="var(--ink)"/>
    </g>
    <path d="M60 50 L250 30 M60 56 L250 106" stroke="var(--pen)" stroke-width="1.4" stroke-dasharray="4 5" fill="none"/>
    <g stroke="var(--flag)" stroke-width="5" stroke-linecap="round" fill="none">
      <circle cx="252" cy="40" r="7" fill="var(--flag)" stroke="none"/>
      <path d="M252 50v28M252 58l-12 10M252 58l12 10M252 78l-9 28M252 78l9 28"/>
    </g>
    <path d="M52 124H252" stroke="var(--ink)" stroke-width="1.5"/><path d="M52 119v10M252 119v10" stroke="var(--ink)" stroke-width="1.5"/>
    <rect x="128" y="115" width="48" height="16" rx="3" fill="var(--paper)"/>
    <text x="152" y="127" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="13" fill="var(--ink)">${m} m</text>
    <text x="300" y="20" text-anchor="end" font-family="Barlow, sans-serif" font-weight="700" font-size="13" fill="var(--muted)">Cuerpo completo · ${side}</text>
  </svg>`;
}

/* =========================================================
   Semana y progreso
   ========================================================= */
function weekStart(d = new Date()) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x.getTime(); }
const thisWeek = () => DB.sessions.filter(s => s.fecha >= weekStart()).length;
function streakWeeks() {
  let n = 0, ws = weekStart();
  for (;;) { const c = DB.sessions.filter(s => s.fecha >= ws && s.fecha < ws + 7 * 864e5).length; if (c >= CONFIG.weeklyGoal) { n++; ws -= 7 * 864e5; } else break; }
  return n;
}
const best = id => DB.sessions.filter(s => s.drill === id).reduce((b, s) => Math.max(b, s.reps), 0);

/* =========================================================
   Vistas
   ========================================================= */
const VIEWS = ["registro", "inicio", "ejercicio", "vivo", "resultado", "progreso", "encuesta", "perfil", "privacidad"];
let lastView = "inicio";
function show(name) {
  VIEWS.forEach(v => ($("v-" + v).hidden = v !== name));
  const tab = ["inicio", "progreso", "perfil"].includes(name);
  $("tabs").hidden = !tab;
  document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === name));
  if (name !== "privacidad") lastView = name;
  scrollTo(0, 0);
}

function route() {
  const h = location.hash.slice(1);
  if (live.running && h !== "vivo") stopLive(true);
  if (h === "privacidad") { renderPrivacy(); return show("privacidad"); }
  if (!DB.profile) return show("registro");
  if (h === "vivo") { if (live.running) return show("vivo"); location.replace("#" + (currentDrill ? "ej-" + currentDrill.id : "inicio")); return; }
  if (h.startsWith("ej-") && DRILL_BY[h.slice(3)]) { renderDrill(h.slice(3)); return show("ejercicio"); }
  if (h === "progreso") { renderProgress(); return show("progreso"); }
  if (h === "encuesta") { renderSurvey(); return show("encuesta"); }
  if (h === "perfil") { renderProfile(); return show("perfil"); }
  if (h === "resultado" && pendingResult) return show("resultado");
  renderHome(); show("inicio");
}
addEventListener("hashchange", route);

/* ---------- Registro ---------- */
$("f-registro").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = $("r-nombre").value.trim(), err = $("r-err");
  if (!nombre) { err.textContent = "Escribe el nombre o apodo del jugador."; err.hidden = false; return; }
  if (!$("r-acepto").checked) { err.textContent = "Para continuar, acepta el aviso de privacidad."; err.hidden = false; return; }
  err.hidden = true;
  const f = new FormData(e.target);
  DB.profile = { nombre, deporte: f.get("deporte"), categoria: f.get("categoria"), codigo: $("r-codigo").value.trim().toUpperCase() };
  DB.registeredAt = Date.now(); save();
  track("registro");
  location.hash = "inicio"; route();
});

/* ---------- Inicio ---------- */
function renderHome() {
  const p = DB.profile;
  $("i-hola").textContent = `Hola, ${p.nombre}`;
  const n = thisWeek(), g = CONFIG.weeklyGoal;
  $("i-semana").textContent = `${Math.min(n, 99)} de ${g} ejercicios`;
  const st = streakWeeks();
  $("i-racha").textContent = n >= g ? "¡Meta de la semana cumplida!" : st ? `Racha: ${st} semana${st > 1 ? "s" : ""} cumpliendo la meta` : "Completa la meta para iniciar tu racha";
  $("i-dots").innerHTML = Array.from({ length: g }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
  const order = DRILLS.slice().sort((a, b) => rank(a) - rank(b));
  function rank(d) { if (p.deporte === "ambos" || d.sport === "ambos" || d.sport === p.deporte) return 0; return 1; }
  $("i-drills").innerHTML = order.map(d => {
    const b = best(d.id);
    return `<a class="drill" href="#ej-${d.id}">
      <span class="ico" style="color:${sportColor(d.sport)}">${ICON[d.id]}</span>
      <span><b>${esc(d.name)}</b><p>${esc(d.short)}</p></span>
      <span class="best">${b ? `<b>${b}</b><br>récord` : d.free ? "" : `<span class="pro">Pro · gratis<br>en piloto</span>`}</span></a>`;
  }).join("");
  $("i-encuesta").hidden = !!DB.survey || DB.sessions.length < CONFIG.surveyAfter;
}

/* ---------- Ejercicio ---------- */
let currentDrill = null;
function renderDrill(id) {
  const d = DRILL_BY[id]; currentDrill = d;
  $("e-nombre").textContent = d.name;
  $("e-short").textContent = d.short;
  const tag = $("e-dep"); tag.textContent = d.sport === "ambos" ? "Futbol y tocho" : SPORT[d.sport]; tag.className = "tag " + d.sport;
  $("e-diagrama").innerHTML = setupDiagram(id);
  $("e-setup").textContent = d.setup;
  $("e-pro").hidden = d.free;
  $("e-frontal").checked = !!DB.prefFront;
  $("e-sonido").checked = DB.prefSound !== false;
}
$("e-frontal").addEventListener("change", e => { DB.prefFront = e.target.checked; save(); });
$("e-sonido").addEventListener("change", e => { DB.prefSound = e.target.checked; save(); });
$("e-camara").addEventListener("click", () => startLive({ kind: "camera" }));
$("e-video").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) startLive({ kind: "file", file: f }); });

/* =========================================================
   IA de pose (MediaPipe) y sesión en vivo
   ========================================================= */
let landmarker = null, landmarkerLoading = null, CONNECTIONS = [];
async function getLandmarker(onMsg) {
  if (landmarker) return landmarker;
  if (!landmarkerLoading) landmarkerLoading = (async () => {
    onMsg("Preparando la IA… la primera vez descarga unos 6 MB");
    const mp = await import(CONFIG.mediapipe.bundle);
    const files = await mp.FilesetResolver.forVisionTasks(CONFIG.mediapipe.wasm);
    const opts = d => ({ baseOptions: { modelAssetPath: CONFIG.mediapipe.model, delegate: d }, runningMode: "VIDEO", numPoses: 3, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    let lmk;
    try { lmk = await mp.PoseLandmarker.createFromOptions(files, opts("GPU")); }
    catch (e) { lmk = await mp.PoseLandmarker.createFromOptions(files, opts("CPU")); }
    CONNECTIONS = mp.PoseLandmarker.POSE_CONNECTIONS || [];
    landmarker = lmk; return lmk;
  })();
  try { return await landmarkerLoading; } catch (e) { landmarkerLoading = null; throw e; }
}

const live = { running: false, counter: null, stream: null, kind: null, lastReps: 0, raf: 0, lastVT: -1, ts: 0, wake: null, audio: null, url: null, started: false, track: null };

function beep() {
  if (!DB.prefSound && DB.prefSound !== undefined) return;
  try {
    live.audio = live.audio || new (window.AudioContext || window.webkitAudioContext)();
    const a = live.audio, o = a.createOscillator(), g = a.createGain();
    o.type = "triangle"; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, a.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.16);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.18);
  } catch (e) {}
}

function setStatus(txt, ok) { const s = $("l-status"); s.textContent = txt; s.classList.toggle("ok", !!ok); }

async function startLive(src) {
  const d = currentDrill; if (!d) return;
  if (DB.prefSound !== false) { try { live.audio = live.audio || new (window.AudioContext || window.webkitAudioContext)(); live.audio.resume(); } catch (e) {} }
  Object.assign(live, { running: true, kind: src.kind, lastReps: 0, lastVT: -1, started: false, track: null });
  $("l-nombre").textContent = d.name; $("l-unidad").textContent = d.unit;
  $("l-reps").textContent = "0"; $("l-tiempo").textContent = "0:00"; $("l-calidad").textContent = "Calidad —";
  $("stage").classList.toggle("mirror", src.kind === "camera" && !!DB.prefFront);
  location.hash = "vivo"; show("vivo");
  const carga = $("l-carga"); carga.hidden = false;
  const video = $("vid");
  try {
    await getLandmarker(m => ($("l-carga-txt").textContent = m));
    if (!live.running) return;
    $("l-carga-txt").textContent = src.kind === "camera" ? "Abriendo la cámara…" : "Abriendo el video…";
    if (src.kind === "camera") {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("camara-no-soportada");
      live.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: DB.prefFront ? "user" : "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      video.srcObject = live.stream; video.removeAttribute("src");
    } else {
      live.url = URL.createObjectURL(src.file);
      video.srcObject = null; video.src = live.url; video.loop = false;
    }
    await new Promise((res, rej) => { if (video.readyState >= 1) return res(); video.onloadedmetadata = res; video.onerror = () => rej(new Error("video")); });
    if (!live.running) return;
    live.counter = createCounter(d.id, { aspect: video.videoWidth / video.videoHeight || 1 });
    carga.hidden = true;
    if (src.kind === "camera") {
      await video.play();
      try { live.wake = await navigator.wakeLock?.request("screen"); } catch (e) {}
      setStatus("Colócate para que se vea todo tu cuerpo");
      loop();
      await countdown();
      if (!live.running) return;
      live.started = true;
    } else {
      video.onended = () => { if (live.running) finishLive(); };
      live.started = true;
      await video.play();
      loop();
    }
  } catch (e) {
    carga.hidden = true;
    const msg = e?.name === "NotAllowedError" ? "Necesitamos permiso para usar la cámara. Actívalo en la configuración del navegador."
      : e?.message === "camara-no-soportada" ? "Este navegador no permite usar la cámara. Abre la app en Chrome o Safari."
      : e?.message === "video" ? "No pudimos abrir ese video. Prueba con otro archivo."
      : "No se pudo preparar la IA. Revisa tu conexión e intenta de nuevo.";
    stopLive(true); toast(msg); location.hash = currentDrill ? "ej-" + currentDrill.id : "inicio";
  }
}

function countdown() {
  return new Promise(res => {
    const el = $("l-cuenta"); let n = 3; el.hidden = false; el.className = "countdown"; el.textContent = n;
    const tick = () => {
      if (!live.running) { el.hidden = true; return res(); }
      n--;
      if (n > 0) { el.textContent = n; beep(); setTimeout(tick, 900); }
      else if (n === 0) { el.textContent = "¡YA!"; el.classList.add("go"); beep(); setTimeout(tick, 600); }
      else { el.hidden = true; res(); }
    };
    beep(); setTimeout(tick, 900);
  });
}

// Elige al jugador más grande en cuadro, con preferencia por el que ya se seguía
function pickPose(list) {
  if (!list || !list.length) return null;
  let bestI = 0, bestScore = -1;
  list.forEach((lm, i) => {
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    lm.forEach(p => { if ((p.visibility ?? 1) > 0.4) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); } });
    let score = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
    if (live.track) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; score *= 1 / (1 + 6 * Math.hypot(cx - live.track.x, cy - live.track.y)); }
    if (score > bestScore) { bestScore = score; bestI = i; live.trackCand = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }; }
  });
  live.track = live.trackCand;
  return list[bestI];
}

function loop() {
  const video = $("vid");
  const step = () => {
    if (!live.running) return;
    if (video.readyState >= 2 && video.currentTime !== live.lastVT) {
      live.lastVT = video.currentTime;
      live.ts = Math.max(live.ts + 1, performance.now());
      let lm = null;
      try { lm = pickPose(landmarker.detectForVideo(video, live.ts).landmarks); } catch (e) {}
      draw(lm);
      if (live.started && live.counter) {
        const t = live.kind === "camera" ? performance.now() / 1000 : video.currentTime;
        const s = live.counter.push(lm, t);
        updateLive(s);
      } else if (!live.started) {
        setStatus(lm ? "Te veo. Prepárate…" : "Colócate para que se vea todo tu cuerpo", !!lm);
      }
    }
    live.raf = requestAnimationFrame(step);
  };
  live.raf = requestAnimationFrame(step);
}

function updateLive(s) {
  $("l-tiempo").textContent = fmtTime(s.elapsed);
  if (s.reps !== live.lastReps) {
    const el = $("l-reps"); el.textContent = s.reps; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    live.lastReps = s.reps; if (DB.prefSound !== false) beep();
  }
  $("l-calidad").textContent = s.quality == null ? "Calidad —" : `Calidad ${s.quality}%`;
  setStatus(s.cue, s.tracking);
}

function draw(lm) {
  const cv = $("ov"), video = $("vid"), ctx = cv.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  if (!lm || !video.videoWidth) return;
  // misma caja que object-fit: contain
  const va = video.videoWidth / video.videoHeight, ca = W / H;
  const bw = va > ca ? W : H * va, bh = va > ca ? W / va : H, bx = (W - bw) / 2, by = (H - bh) / 2;
  const P = lm.map(p => ({ x: bx + p.x * bw, y: by + p.y * bh, v: p.visibility ?? 1 }));
  ctx.lineCap = "round"; ctx.lineWidth = Math.max(3, bw / 180); ctx.strokeStyle = "rgba(242,139,86,.95)";
  CONNECTIONS.forEach(c => { const a = P[c.start], b = P[c.end]; if (a && b && a.v > 0.5 && b.v > 0.5 && c.start > 10 && c.end > 10) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } });
  ctx.fillStyle = "#fff";
  P.forEach((p, i) => { if (i > 10 && p.v > 0.5) { ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(3.5, bw / 220), 0, 7); ctx.fill(); } });
  if (P[0].v > 0.5) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P[0].x, P[0].y, Math.max(10, bw / 60), 0, 7); ctx.stroke(); }
}

function stopLive(silent) {
  live.running = false; cancelAnimationFrame(live.raf);
  const video = $("vid");
  try { video.pause(); } catch (e) {}
  live.stream?.getTracks().forEach(t => t.stop()); live.stream = null;
  video.srcObject = null;
  if (live.url) { URL.revokeObjectURL(live.url); live.url = null; video.removeAttribute("src"); video.load(); }
  try { live.wake?.release(); } catch (e) {} live.wake = null;
  $("l-cuenta").hidden = true; $("l-carga").hidden = true;
}

let pendingResult = null;
function finishLive() {
  if (!live.counter) { stopLive(true); location.hash = currentDrill ? "ej-" + currentDrill.id : "inicio"; return; }
  const r = live.counter.finish(); r.fuente = live.kind; r.fecha = Date.now();
  stopLive(true); live.counter = null;
  pendingResult = r; renderResult(r); location.hash = "resultado"; show("resultado");
}
$("l-terminar").addEventListener("click", finishLive);
$("l-cerrar").addEventListener("click", () => { stopLive(true); live.counter = null; location.hash = currentDrill ? "ej-" + currentDrill.id : "inicio"; });
document.addEventListener("visibilitychange", () => { if (document.hidden && live.running && live.kind === "camera") finishLive(); });

/* =========================================================
   Resultado
   ========================================================= */
const barColor = p => (p >= 80 ? "var(--good)" : p >= 60 ? "var(--warn)" : "var(--crit)");
function renderResult(r) {
  const d = DRILL_BY[r.drill];
  $("s-fecha").textContent = new Date(r.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  $("s-ejercicio").textContent = d.name + (r.fuente === "file" ? " · video" : "");
  $("s-reps").textContent = r.reps; $("s-unidad").textContent = d.unit;
  $("s-tiempo").textContent = fmtTime(r.duration);
  $("s-ritmo").textContent = r.reps ? `${r.rpm.toFixed(r.rpm < 10 ? 1 : 0)}/min` : "—";
  $("s-calidad").textContent = r.reps ? r.quality + "%" : "—";
  $("s-desglose").innerHTML = r.reps ? r.breakdown.map(b => `<div class="bar-row"><div class="lab"><span>${esc(b.label)}</span><span>${b.pct}%</span></div><div class="bar"><i style="width:${b.pct}%;background:${barColor(b.pct)}"></i></div></div>`).join("")
    : `<p class="empty">No se contó ninguna repetición. Revisa que se vea todo tu cuerpo y que el celular esté quieto.</p>`;
  $("s-tips").innerHTML = r.tips.map(t => `<li>${esc(t)}</li>`).join("");
  const ex = r.extra, parts = [];
  if (ex.mejorVuelta != null) parts.push(`Mejor vuelta <b>${ex.mejorVuelta.toFixed(1)} s</b>`, `Promedio <b>${ex.promedioVuelta.toFixed(1)} s</b>`);
  if (ex.pieIzq != null) parts.push(`Pie izquierdo <b>${ex.pieIzq}</b>`, `Pie derecho <b>${ex.pieDer}</b>`);
  const prev = best(r.drill); if (r.reps && r.reps > prev) parts.unshift(`<b style="color:var(--flag)">¡Nuevo récord!</b>`);
  $("s-extra").innerHTML = parts.join("<span>·</span>");
  $("s-humano").value = ""; $("s-precision").textContent = "";
}
$("s-humano").addEventListener("input", e => {
  const h = Number(e.target.value), r = pendingResult;
  if (!r || e.target.value === "" || !h) { $("s-precision").textContent = ""; return; }
  const acc = Math.max(0, 1 - Math.abs(r.reps - h) / h) * 100;
  $("s-precision").textContent = `La IA contó ${r.reps}; coincidencia ${acc.toFixed(0)}%`;
});
$("s-guardar").addEventListener("click", () => {
  const r = pendingResult; if (!r) return;
  const hv = $("s-humano").value, human = hv === "" ? null : Math.max(0, Math.round(Number(hv)));
  const rec = { id: uid(), drill: r.drill, reps: r.reps, human, duration: Math.round(r.duration), quality: r.quality, fuente: r.fuente, fecha: r.fecha, extra: r.extra };
  DB.sessions.push(rec); save();
  track("sesion", { ejercicio: r.drill, duracion_s: rec.duration, reps_ia: r.reps, reps_humano: human ?? "", calidad: r.quality, fuente: r.fuente,
    detalle: JSON.stringify({ desglose: Object.fromEntries(r.breakdown.map(b => [b.key, b.pct])), ...r.extra }) });
  pendingResult = null;
  const n = thisWeek();
  toast(n === CONFIG.weeklyGoal ? "¡Meta de la semana cumplida!" : "Resultado guardado");
  location.hash = !DB.survey && DB.sessions.length === CONFIG.surveyAfter ? "encuesta" : "inicio";
});
$("s-descartar").addEventListener("click", () => { pendingResult = null; location.hash = "inicio"; });
$("s-repetir").addEventListener("click", () => { pendingResult = null; startLive({ kind: "camera" }); });
$("s-compartir").addEventListener("click", shareCard);

async function shareCard() {
  const r = pendingResult || DB.sessions[DB.sessions.length - 1]; if (!r) return;
  const d = DRILL_BY[r.drill], c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
  const x = c.getContext("2d");
  await document.fonts?.ready;
  x.fillStyle = "#13221B"; x.fillRect(0, 0, 1080, 1350);
  // cancha
  x.strokeStyle = "rgba(255,255,255,.08)"; x.lineWidth = 6;
  x.strokeRect(60, 60, 960, 1230); x.beginPath(); x.moveTo(60, 675); x.lineTo(1020, 675); x.stroke();
  x.beginPath(); x.arc(540, 675, 150, 0, 7); x.stroke();
  x.fillStyle = "#3E9E6A"; x.font = "900 64px 'Big Shoulders Display', Impact, sans-serif"; x.fillText("JUGADA", 100, 170);
  x.fillStyle = "#F28B56"; x.beginPath(); x.arc(335, 150, 12, 0, 7); x.fill();
  x.fillStyle = "#E2ECE5"; x.font = "800 72px 'Big Shoulders Display', Impact, sans-serif"; x.fillText(d.name.toUpperCase(), 100, 330);
  x.font = "600 40px Barlow, sans-serif"; x.fillStyle = "#93A69B"; x.fillText(DB.profile.nombre, 100, 395);
  x.fillStyle = "#FFFFFF"; x.font = "900 460px 'Big Shoulders Display', Impact, sans-serif"; x.fillText(String(r.reps), 90, 860);
  x.fillStyle = "#F28B56"; x.font = "800 80px 'Big Shoulders Display', Impact, sans-serif"; x.fillText(d.unit.toUpperCase(), 100, 970);
  x.fillStyle = "#E2ECE5"; x.font = "600 44px 'IBM Plex Mono', monospace";
  x.fillText(`Calidad ${r.quality}%   ·   ${fmtTime(r.duration)}`, 100, 1090);
  x.fillStyle = "#93A69B"; x.font = "500 34px Barlow, sans-serif";
  x.fillText(`Medido con IA · ${new Date(r.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`, 100, 1220);
  const blob = await new Promise(res => c.toBlob(res, "image/png"));
  const file = new File([blob], `jugada-${d.id}.png`, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${DB.profile.nombre}: ${r.reps} ${d.unit} en ${d.name} 💪 #Jugada` }); track("compartir", { ejercicio: d.id }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  track("compartir", { ejercicio: d.id });
}

/* =========================================================
   Progreso
   ========================================================= */
function renderProgress() {
  const ws0 = weekStart(), weeks = [];
  for (let i = 7; i >= 0; i--) { const ws = ws0 - i * 7 * 864e5; weeks.push({ ws, n: DB.sessions.filter(s => s.fecha >= ws && s.fecha < ws + 7 * 864e5).length }); }
  const mx = Math.max(CONFIG.weeklyGoal, ...weeks.map(w => w.n));
  $("p-semanas").innerHTML = weeks.map(w => `<div class="wk"><b>${w.n || ""}</b><i class="${w.n >= CONFIG.weeklyGoal ? "goal" : ""}" style="height:${(w.n / mx) * 100}%"></i><span>${new Date(w.ws).toLocaleDateString("es-MX", { day: "numeric", month: "numeric" })}</span></div>`).join("");
  const recs = DRILLS.map(d => ({ d, b: best(d.id) })).filter(x => x.b);
  $("p-records").innerHTML = recs.length ? recs.map(({ d, b }) => `<div class="rec"><b>${b}</b><span>${esc(d.unit)} · ${esc(d.name)}</span></div>`).join("") : `<p class="empty">Tus récords aparecerán aquí.</p>`;
  const h = DB.sessions.slice().reverse().slice(0, 40);
  $("p-hist").innerHTML = h.length ? h.map(s => { const d = DRILL_BY[s.drill]; return `<li><b>${esc(d?.name || s.drill)}</b><span class="r">${s.reps} ${esc(d?.unit || "")}</span><small>${new Date(s.fecha).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} · ${fmtTime(s.duration)}</small><small class="r">Calidad ${s.quality}%</small></li>`; }).join("") : `<li class="empty">Aún no guardas ejercicios.</li>`;
}

/* =========================================================
   Encuesta B y C
   ========================================================= */
function renderSurvey() {
  const done = !!DB.survey;
  $("f-encuesta").hidden = done; $("q-gracias").hidden = !done;
}
$("f-encuesta").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target), b = f.get("b"), c = f.get("c"), precio = f.get("precio");
  if (!b || !c || precio == null) { const er = $("q-err"); er.textContent = "Responde las tres primeras preguntas."; er.hidden = false; return; }
  $("q-err").hidden = true;
  DB.survey = { b, c, precio: Number(precio), comentario: $("q-comentario").value.trim(), fecha: Date.now() }; save();
  track("encuesta", { interes_b: b, interes_c: c, precio_b: Number(precio), comentario: DB.survey.comentario });
  renderSurvey();
});

/* =========================================================
   Perfil, instalación y privacidad
   ========================================================= */
let installEvt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (!$("v-perfil").hidden) renderProfile(); });
addEventListener("appinstalled", () => { track("instalacion"); toast("Jugada quedó instalada"); });
function renderProfile() {
  const p = DB.profile;
  $("pf-nombre").value = p.nombre; $("pf-codigo").value = p.codigo || "";
  $("pf-version").textContent = `${CONFIG.appName} ${CONFIG.version}`;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $("pf-instalar").hidden = standalone;
  $("pf-inst-btn").hidden = !installEvt;
  $("pf-inst-txt").textContent = ios ? "En Safari toca Compartir y luego “Agregar a inicio”." : installEvt ? "Agrega Jugada a tu pantalla de inicio para abrirla como app." : "Abre el menú del navegador y elige “Instalar app” o “Agregar a pantalla principal”.";
  $("pf-confirm").hidden = true; $("pf-ok").hidden = true;
}
$("pf-inst-btn").addEventListener("click", async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderProfile(); });
$("f-perfil").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("pf-nombre").value.trim(); if (!n) return toast("Escribe un nombre o apodo");
  const codigo = $("pf-codigo").value.trim().toUpperCase(), cambio = codigo !== (DB.profile.codigo || "");
  DB.profile.nombre = n; DB.profile.codigo = codigo; save();
  if (cambio) track("codigo", { detalle: codigo });
  $("pf-ok").hidden = false;
});
$("pf-borrar").addEventListener("click", () => ($("pf-confirm").hidden = false));
$("pf-no").addEventListener("click", () => ($("pf-confirm").hidden = true));
$("pf-si").addEventListener("click", () => {
  track("baja");
  const q = DB.queue; try { localStorage.removeItem(KEY); } catch (e) {}
  DB = load(); DB.queue = q; save(); flush();
  location.hash = ""; route(); toast("Datos borrados de este teléfono");
});

function renderPrivacy() {
  $("pv-back").href = "#" + (DB.profile ? lastView : "");
  $("pv-texto").innerHTML = `
  <p><b>Responsable:</b> ${esc(CONFIG.responsable)}. Contacto: <span class="mono">${esc(CONFIG.contacto)}</span>.</p>
  <h3>Qué datos usa la app</h3>
  <ul><li>Nombre o apodo del jugador, deporte, categoría de edad y código de liga o entrenador.</li><li>Resultados de los ejercicios: repeticiones, tiempo y calificación de técnica.</li></ul>
  <p>Estos datos se guardan <b>solo en este teléfono</b>.</p>
  <h3>Video y cámara</h3>
  <p>La imagen de la cámara o del video que elijas se analiza dentro del teléfono para detectar la postura del cuerpo. <b>No se graba, no se guarda y no se envía</b> a ningún servidor. No usamos reconocimiento facial.</p>
  <h3>Estadísticas del piloto</h3>
  <p>Durante el piloto la app envía datos anónimos para medir si funciona: un identificador aleatorio del teléfono, deporte, categoría, código de liga, ejercicio, repeticiones contadas por la IA y por ti, duración, calificación y respuestas de la encuesta. <b>Nunca se envían el nombre del jugador ni imágenes.</b></p>
  <h3>Menores de edad</h3>
  <p>Si el jugador es menor de 18 años, el registro y el uso deben hacerse con la autorización de su madre, padre o tutor.</p>
  <h3>Tus derechos</h3>
  <p>Puedes borrar todos los datos de este teléfono desde Perfil. Para acceder, corregir u oponerte al uso de las estadísticas anónimas del piloto, escribe al contacto de arriba.</p>
  <p class="muted small">Versión piloto del aviso. Revísala con un especialista en protección de datos antes del lanzamiento comercial.</p>`;
}

/* =========================================================
   Arranque
   ========================================================= */
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
// Código de origen en el enlace (?c=TIKTOK, ?c=LIGA-NORTE): se precarga en el registro para medir qué canal trae familias
try {
  const c = new URLSearchParams(location.search).get("c");
  if (c && !DB.profile) $("r-codigo").value = c.trim().toUpperCase().slice(0, 16);
} catch (e) {}
route(); flush();
