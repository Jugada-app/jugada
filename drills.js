// Jugada · motor de conteo por pose
// Recibe los 33 puntos de MediaPipe Pose (x, y normalizados, visibility) y
// cuenta repeticiones con reglas por ejercicio. No usa el DOM: se puede probar en Node.

export const LM = {
  nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16,
  lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28,
};

const SIDES = [
  { k: "izq", sh: LM.lSh, el: LM.lEl, wr: LM.lWr, hip: LM.lHip, kn: LM.lKn, an: LM.lAn },
  { k: "der", sh: LM.rSh, el: LM.rEl, wr: LM.rWr, hip: LM.rHip, kn: LM.rKn, an: LM.rAn },
];

const BODY = [LM.lSh, LM.rSh, LM.lHip, LM.rHip];
const LEGS = [LM.lKn, LM.rKn, LM.lAn, LM.rAn];
const ARMS = [LM.lEl, LM.rEl, LM.lWr, LM.rWr];

export const DRILLS = [
  {
    id: "dominadas", sport: "futbol", name: "Dominadas", free: true,
    short: "Cuenta cada toque con el pie y revisa tu postura.",
    setup: "Celular de frente o de lado a 3 metros, a la altura de la cintura. Que se vea todo tu cuerpo, de la cabeza a los pies.",
    unit: "toques", need: [...BODY, ...LEGS],
    tips: {
      tronco: "Mantén el tronco derecho y la vista en el balón.",
      altura: "Golpea el balón a la altura de la rodilla; si subes de más el pie pierdes control.",
    },
    checks: { tronco: "Tronco derecho", altura: "Altura controlada" },
  },
  {
    id: "idavuelta", sport: "ambos", name: "Sprint ida y vuelta", free: true,
    short: "Cuenta vueltas y mide el tiempo de cada una.",
    setup: "Celular de lado a 6 metros, que se vea el pasillo completo de ida y vuelta (unos 5 metros). Marca las líneas con conos.",
    unit: "vueltas", need: [LM.lHip, LM.rHip],
    tips: {
      linea: "Llega hasta la línea en cada vuelta; no recortes el giro.",
      ritmo: "Busca que todas las vueltas duren lo mismo: sal más controlado y termina fuerte.",
    },
    checks: { linea: "Llega a la línea", ritmo: "Ritmo constante" },
  },
  {
    id: "pasepared", sport: "futbol", name: "Pases a pared", free: true,
    short: "Cuenta cada golpeo y revisa el pie de apoyo.",
    setup: "Celular de lado a 4 metros, perpendicular a la pared. Que se vean tus pies con claridad.",
    unit: "pases", need: [...BODY, ...LEGS],
    tips: {
      apoyo: "Flexiona un poco la rodilla del pie de apoyo al pegarle.",
      tronco: "Inclínate ligeramente sobre el balón para que el pase vaya raso.",
    },
    checks: { apoyo: "Rodilla de apoyo flexionada", tronco: "Tronco sobre el balón" },
  },
  {
    id: "tiro", sport: "futbol", name: "Tiro a portería", free: false,
    short: "Cuenta tiros y califica apoyo, brazos y seguimiento.",
    setup: "Celular de lado a 5 metros del punto de tiro. Que se vea todo tu cuerpo durante el golpeo.",
    unit: "tiros", need: [...BODY, ...LEGS, LM.lWr, LM.rWr],
    tips: {
      apoyo: "Planta el pie de apoyo con la rodilla flexionada junto al balón.",
      brazos: "Abre los brazos para equilibrarte al golpear.",
      seguimiento: "Termina el golpeo con la pierna arriba, hacia la portería.",
    },
    checks: { apoyo: "Pie de apoyo", brazos: "Brazos de equilibrio", seguimiento: "Seguimiento del golpe" },
  },
  {
    id: "lanzamiento", sport: "tocho", name: "Lanzamiento de QB", free: true,
    short: "Cuenta pases y revisa codo, punto de suelta y paso.",
    setup: "Celular de lado a 4 metros, del lado de tu brazo de lanzar. Que se vea todo tu cuerpo.",
    unit: "lanzamientos", need: [...BODY, ...ARMS, LM.nose, LM.lAn, LM.rAn],
    tips: {
      codo: "Sube el codo a la altura del hombro antes de lanzar.",
      suelta: "Suelta el balón arriba de la cabeza, no a un costado.",
      paso: "Da un paso con el pie contrario a tu brazo de lanzar.",
    },
    checks: { codo: "Codo alto", suelta: "Suelta arriba", paso: "Paso al frente" },
  },
  {
    id: "arranque", sport: "tocho", name: "Postura y arranque", free: false,
    short: "Cuenta salidas desde postura y mide qué tan explosivas son.",
    setup: "Celular de lado a 5 metros. Ponte en postura, sal en velocidad 3 o 4 pasos y regresa a tu lugar.",
    unit: "salidas", need: [...BODY, ...LEGS],
    tips: {
      baja: "Baja más la cadera en la postura: rodillas flexionadas.",
      espalda: "Inclina el pecho al frente, con la espalda recta.",
      explosiva: "Empuja fuerte con ambas piernas en el primer paso.",
    },
    checks: { baja: "Postura baja", espalda: "Espalda al frente", explosiva: "Salida explosiva" },
  },
];

export const DRILL_BY = Object.fromEntries(DRILLS.map(d => [d.id, d]));

/* ---------- geometría ---------- */
const deg = r => (r * 180) / Math.PI;
export function angle(a, b, c) {
  const v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
  const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1e-9;
  return deg(Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d))));
}
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// inclinación del tronco respecto a la vertical, en grados (0 = derecho)
const lean = (sh, hip) => deg(Math.atan2(Math.abs(sh.x - hip.x), Math.abs(hip.y - sh.y) || 1e-9));
const median = a => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };

/* ---------- contador ---------- */
export function createCounter(drillId, opts = {}) {
  const drill = DRILL_BY[drillId];
  if (!drill) throw new Error("Ejercicio desconocido: " + drillId);
  const aspect = opts.aspect || 1; // ancho / alto del video
  const S = {
    reps: [], t0: null, tLast: 0, prev: null, sm: null, torso: 0,
    ground: { izq: null, der: null }, armed: { izq: true, der: true }, lastRep: -9,
    cue: "Colócate para que se vea todo tu cuerpo", seenFrames: 0, lostFrames: 0,
    zone: null, zoneEnter: 0, zoneDepth: 0, lastZoneT: null,
    cock: null, stance: null, needReset: false, pending: [],
  };

  function pts(lm) {
    // suaviza y convierte a unidades con la misma escala en x y en y
    const raw = lm.map(p => ({ x: p.x * aspect, y: p.y, v: p.visibility ?? 1 }));
    if (!S.sm) S.sm = raw.map(p => ({ ...p }));
    else raw.forEach((p, i) => { const s = S.sm[i]; s.x += (p.x - s.x) * 0.6; s.y += (p.y - s.y) * 0.6; s.v = p.v; });
    return S.sm;
  }

  function addRep(t, checks, extra = {}) {
    S.reps.push({ t, checks, ...extra });
    S.lastRep = t;
  }

  function push(lm, t) {
    if (!lm || lm.length < 33) { S.lostFrames++; if (S.lostFrames > 15) S.cue = "No te veo: colócate frente a la cámara"; return snapshot(); }
    const P = pts(lm);
    const vis = drill.need.every(i => P[i].v > 0.5);
    if (!vis) { S.lostFrames++; if (S.lostFrames > 10) S.cue = "Aléjate un poco: necesito ver todo tu cuerpo"; S.prev = null; return snapshot(); }
    S.lostFrames = 0; S.seenFrames++;
    if (S.t0 == null) S.t0 = t;
    const dt = S.prev ? Math.max(1e-3, t - S.prev.t) : 0;
    const msh = mid(P[LM.lSh], P[LM.rSh]), mhip = mid(P[LM.lHip], P[LM.rHip]);
    const torsoNow = dist(msh, mhip);
    S.torso = S.torso ? S.torso + (torsoNow - S.torso) * 0.05 : torsoNow;
    const T = Math.max(S.torso, 0.03);
    const F = { P, t, dt, T, msh, mhip, lean: lean(msh, mhip) };

    // piso por pierna: el punto más bajo reciente del tobillo, que sube muy despacio
    SIDES.forEach(s => {
      const y = P[s.an].y, g = S.ground[s.k];
      S.ground[s.k] = g == null || y > g ? y : g - 0.05 * T * dt;
    });
    F.lift = s => (S.ground[s.k] - P[s.an].y) / T;
    F.vel = i => (S.prev && dt ? { x: (P[i].x - S.prev.P[i].x) / dt / T, y: (P[i].y - S.prev.P[i].y) / dt / T } : { x: 0, y: 0 });

    RULES[drill.id](F);
    settlePending(F);

    S.prev = { t, P: P.map(p => ({ x: p.x, y: p.y })) };
    S.tLast = t;
    return snapshot();
  }

  function settlePending(F) {
    S.pending = S.pending.filter(p => {
      p.update(F);
      if (F.t >= p.until) { p.done(); return false; }
      return true;
    });
  }

  /* ----- reglas por ejercicio ----- */
  const RULES = {
    dominadas(F) {
      SIDES.forEach(s => {
        const lift = F.lift(s);
        if (lift < 0.15) S.armed[s.k] = true;
        if (S.armed[s.k] && lift > 0.35 && F.t - S.lastRep > 0.18) {
          S.armed[s.k] = false;
          addRep(F.t, { tronco: F.lean < 20, altura: lift < 1.3 }, { pie: s.k });
          S.cue = F.lean < 20 ? "¡Bien! Sigue así" : "Endereza el tronco";
        }
      });
      if (!S.reps.length) S.cue = "Empieza cuando quieras";
    },

    idavuelta(F) {
      const x = F.mhip.x / aspect; // 0..1 en el cuadro
      const z = x < 0.3 ? "L" : x > 0.7 ? "R" : null;
      if (z) {
        if (z !== S.zone) {
          if (S.zone) {
            const lap = S.lastZoneT == null ? F.t - S.t0 : F.t - S.lastZoneT;
            addRep(F.t, { linea: S.zoneDepth }, { lap });
            S.cue = `Vuelta ${S.reps.length}: ${lap.toFixed(1)} s`;
          } else S.cue = "Corre hacia la otra línea";
          S.zone = z; S.lastZoneT = F.t; S.zoneDepth = false;
        }
        if ((z === "L" && x < 0.2) || (z === "R" && x > 0.8)) {
          S.zoneDepth = true;
          const last = S.reps[S.reps.length - 1];
          if (last && last.t === S.lastZoneT) last.checks.linea = true;
        }
      }
    },

    pasepared(F) { kick(F, 2.5, false); },
    tiro(F) { kick(F, 3.5, true); },

    lanzamiento(F) {
      const P = F.P;
      SIDES.forEach(s => {
        const wr = P[s.wr], sh = P[s.sh], el = P[s.el];
        const elbowAng = angle(sh, el, wr);
        if (!S.cock && wr.y < sh.y - 0.15 * F.T && elbowAng > 50 && elbowAng < 150) {
          S.cock = { side: s.k, t: F.t, codo: el.y <= sh.y + 0.15 * F.T };
          S.cue = "Brazo arriba… ¡lanza!";
        }
        if (S.cock && S.cock.side === s.k) {
          const v = F.vel(s.wr), sp = Math.hypot(v.x, v.y);
          if (F.t - S.cock.t > 1.5) S.cock = null;
          else if (sp > 3.0 && F.t - S.lastRep > 0.8) {
            const other = SIDES.find(o => o.k !== s.k);
            addRep(F.t, {
              codo: S.cock.codo,
              suelta: wr.y < P[LM.nose].y + 0.1 * F.T,
              paso: Math.abs(P[other.an].x - P[s.an].x) > 0.6 * F.T,
            }, { brazo: s.k });
            S.cock = null;
            S.cue = `Lanzamiento ${S.reps.length}`;
          }
        }
      });
    },

    arranque(F) {
      const P = F.P;
      const knee = (angle(P[LM.lHip], P[LM.lKn], P[LM.lAn]) + angle(P[LM.rHip], P[LM.rKn], P[LM.rAn])) / 2;
      if (S.needReset) { if (knee > 155 || F.t - S.lastRep > 4) S.needReset = false; return; }
      if (!S.stance && knee < 140) { S.stance = { t: F.t, minKnee: knee, lean: F.lean }; S.cue = "Postura lista… ¡sal!"; }
      if (S.stance) {
        S.stance.minKnee = Math.min(S.stance.minKnee, knee);
        S.stance.lean = Math.max(S.stance.lean, F.lean);
        const v = F.vel(LM.lHip), sp = Math.hypot(v.x, v.y);
        if (sp > 2.2 && F.t - S.stance.t > 0.2) {
          const st = S.stance;
          const rec = { t: F.t, checks: { baja: st.minKnee <= 130, espalda: st.lean >= 20 && st.lean <= 55, explosiva: false }, peak: sp };
          S.reps.push(rec); S.lastRep = F.t;
          S.pending.push({ until: F.t + 0.3, update: G => { const w = G.vel(LM.lHip); rec.peak = Math.max(rec.peak, Math.hypot(w.x, w.y)); }, done: () => { rec.checks.explosiva = rec.peak > 3.0; } });
          S.stance = null; S.needReset = true;
          S.cue = `Salida ${S.reps.length}`;
        } else if (knee > 155) S.stance = null;
      }
    },
  };

  function kick(F, thr, shot) {
    SIDES.forEach(s => {
      const v = F.vel(s.an), lift = F.lift(s);
      if (Math.abs(v.x) > thr && lift > 0.05 && F.t - S.lastRep > 0.6) {
        const plant = SIDES.find(o => o.k !== s.k);
        const kneeAng = angle(F.P[plant.hip], F.P[plant.kn], F.P[plant.an]);
        const checks = { apoyo: kneeAng >= 120 && kneeAng <= 172 };
        if (shot) {
          checks.brazos = dist(F.P[LM.lWr], F.P[LM.rWr]) > 1.2 * dist(F.P[LM.lSh], F.P[LM.rSh]);
          checks.seguimiento = false;
          const rec = { t: F.t, checks, pie: s.k, maxLift: lift };
          S.reps.push(rec); S.lastRep = F.t;
          S.pending.push({ until: F.t + 0.45, update: G => { rec.maxLift = Math.max(rec.maxLift, G.lift(s)); }, done: () => { rec.checks.seguimiento = rec.maxLift > 0.5; } });
        } else {
          checks.tronco = F.lean <= 25;
          addRep(F.t, checks, { pie: s.k });
        }
        S.cue = `${shot ? "Tiro" : "Pase"} ${S.reps.length}`;
      }
    });
  }

  function quality() {
    const done = S.reps.filter(r => r.checks);
    if (!done.length) return null;
    const keys = Object.keys(drill.checks);
    let sum = 0;
    done.forEach(r => { sum += keys.filter(k => r.checks[k]).length / keys.length; });
    return Math.round((sum / done.length) * 100);
  }

  function snapshot() {
    return { reps: S.reps.length, cue: S.cue, quality: quality(), elapsed: S.t0 == null ? 0 : S.tLast - S.t0, tracking: S.lostFrames === 0 && S.seenFrames > 0 };
  }

  function finish() {
    // resuelve revisiones pendientes con lo que haya
    S.pending.forEach(p => p.done()); S.pending = [];
    const keys = Object.keys(drill.checks);
    if (drill.id === "idavuelta" && S.reps.length) {
      const med = median(S.reps.map(r => r.lap));
      S.reps.forEach(r => { r.checks.ritmo = Math.abs(r.lap - med) / med <= 0.2; });
    }
    const n = S.reps.length;
    const duration = S.t0 == null ? 0 : S.tLast - S.t0;
    const breakdown = keys.map(k => ({ key: k, label: drill.checks[k], pct: n ? Math.round(S.reps.filter(r => r.checks[k]).length / n * 100) : 0 }));
    const tips = breakdown.filter(b => n && b.pct < 60).map(b => drill.tips[b.key]);
    const extra = {};
    if (drill.id === "idavuelta" && n) {
      const laps = S.reps.map(r => r.lap);
      extra.mejorVuelta = Math.min(...laps); extra.promedioVuelta = laps.reduce((a, b) => a + b, 0) / n;
    }
    if (["dominadas", "pasepared", "tiro"].includes(drill.id) && n) {
      const izq = S.reps.filter(r => r.pie === "izq").length;
      extra.pieIzq = izq; extra.pieDer = n - izq;
    }
    return {
      drill: drill.id, reps: n, duration,
      rpm: duration > 0 ? (n / duration) * 60 : 0,
      quality: quality() ?? 0, breakdown, tips, extra,
    };
  }

  return { push, finish, snapshot, drill };
}
