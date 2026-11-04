// Pruebas del motor con poses sintéticas: node test/drills.test.mjs
import { createCounter, LM } from "../drills.js";

const FPS = 30;
// pose de pie, de lado, en coordenadas normalizadas de un cuadro vertical (aspect 9/16)
function pose(o = {}) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.99 }));
  const cx = o.cx ?? 0.5, hipY = o.hipY ?? 0.55;
  const set = (i, x, y) => { p[i] = { x, y, visibility: 0.99 }; };
  const sh = hipY - 0.2;
  set(LM.nose, cx + (o.leanX ?? 0), sh - 0.08);
  set(LM.lSh, cx - 0.04 + (o.leanX ?? 0), sh); set(LM.rSh, cx + 0.04 + (o.leanX ?? 0), sh);
  set(LM.lHip, cx - 0.03, hipY); set(LM.rHip, cx + 0.03, hipY);
  const kneeY = hipY + 0.15 * (o.kneeBend ?? 1), anY = hipY + 0.3 * (o.kneeBend ?? 1);
  set(LM.lKn, cx - 0.03 + (o.kneeOut ?? 0), kneeY); set(LM.rKn, cx + 0.03 + (o.kneeOut ?? 0), kneeY);
  set(LM.lAn, cx - 0.03 + (o.lAnX ?? 0), anY - (o.lLift ?? 0)); set(LM.rAn, cx + 0.03 + (o.rAnX ?? 0), anY - (o.rLift ?? 0));
  set(LM.lEl, cx - 0.06, sh + 0.1); set(LM.rEl, cx + 0.06 + (o.rElX ?? 0), sh + 0.1 + (o.rElY ?? 0));
  set(LM.lWr, cx - 0.07 - (o.armsOut ?? 0), sh + 0.2); set(LM.rWr, cx + 0.07 + (o.rWrX ?? 0) + (o.armsOut ?? 0), sh + 0.2 + (o.rWrY ?? 0));
  return p;
}
function run(id, frames) {
  const c = createCounter(id, { aspect: 9 / 16 });
  frames.forEach((f, i) => c.push(f, i / FPS));
  return c.finish();
}
const results = [];
function check(name, got, want) { const ok = got === want; results.push(ok); console.log(`${ok ? "OK " : "FALLA"} ${name}: ${got} (esperado ${want})`); }

// Dominadas: 10 toques alternados
{
  const f = []; for (let i = 0; i < 20; i++) f.push(pose());
  for (let k = 0; k < 10; k++) for (let i = 0; i < 18; i++) { const l = Math.sin(Math.PI * i / 17) * 0.12; f.push(pose(k % 2 ? { rLift: l } : { lLift: l })); }
  for (let i = 0; i < 10; i++) f.push(pose());
  const r = run("dominadas", f); check("dominadas: toques", r.reps, 10); check("dominadas: pie izquierdo", r.extra.pieIzq, 5);
}
// Ida y vuelta: 6 vueltas entre bordes
{
  const f = []; let x = 0.15;
  for (let lap = 0; lap < 6; lap++) { const to = lap % 2 ? 0.15 : 0.85; for (let i = 0; i <= 45; i++) f.push(pose({ cx: x + (to - x) * i / 45 })); x = to; }
  const r = run("idavuelta", f); check("ida y vuelta: vueltas", r.reps, 6); check("ida y vuelta: ritmo 100%", r.breakdown.find(b => b.key === "ritmo").pct, 100);
}
// Pases: 8 golpeos con el pie derecho
{
  const f = []; for (let i = 0; i < 20; i++) f.push(pose({ kneeBend: 0.95 }));
  for (let k = 0; k < 8; k++) {
    for (let i = 0; i < 6; i++) f.push(pose({ kneeBend: 0.95, rLift: 0.02, rAnX: -0.06 * i / 5 }));
    for (let i = 0; i < 4; i++) f.push(pose({ kneeBend: 0.95, rLift: 0.03, rAnX: -0.06 + 0.14 * i / 3 }));
    for (let i = 0; i < 20; i++) f.push(pose({ kneeBend: 0.95 }));
  }
  const r = run("pasepared", f); check("pases: golpeos", r.reps, 8);
}
// Caminar despacio no debe contar pases
{
  const f = []; for (let i = 0; i < 240; i++) f.push(pose({ cx: 0.3 + i * 0.0008, lAnX: Math.sin(i / 8) * 0.02, rAnX: -Math.sin(i / 8) * 0.02 }));
  const r = run("pasepared", f); check("pases: caminar no cuenta", r.reps, 0);
}
// Lanzamiento: 5 lanzamientos con brazo derecho
{
  const f = []; for (let i = 0; i < 20; i++) f.push(pose());
  for (let k = 0; k < 5; k++) {
    for (let i = 0; i < 15; i++) f.push(pose({ rElY: -0.1, rElX: 0.02, rWrY: -0.32, rWrX: -0.02 }));
    for (let i = 0; i < 4; i++) f.push(pose({ rElY: -0.1, rWrY: -0.32 + 0.1 * i, rWrX: 0.15 * i / 3, rAnX: 0.06 }));
    for (let i = 0; i < 30; i++) f.push(pose());
  }
  const r = run("lanzamiento", f); check("lanzamiento: pases", r.reps, 5);
}
// Arranque: 4 salidas desde postura
{
  const f = []; for (let i = 0; i < 20; i++) f.push(pose());
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < 25; i++) f.push(pose({ kneeBend: 0.75, kneeOut: 0.12, hipY: 0.62, leanX: 0.07 }));
    for (let i = 0; i < 8; i++) f.push(pose({ kneeBend: 0.85, kneeOut: 0.1, hipY: 0.62 - 0.01 * i, cx: 0.5 + 0.05 * i, leanX: 0.07 }));
    for (let i = 0; i < 40; i++) f.push(pose());
  }
  const r = run("arranque", f); check("arranque: salidas", r.reps, 4);
}
// Sin cuerpo visible: no cuenta y no truena
{
  const f = []; for (let i = 0; i < 60; i++) f.push(pose().map(p => ({ ...p, visibility: 0.1 })));
  const r = run("dominadas", f); check("sin cuerpo visible", r.reps, 0);
}
const fails = results.filter(x => !x).length;
console.log(fails ? `\n${fails} prueba(s) fallaron` : `\nTodas las pruebas pasaron (${results.length})`);
process.exit(fails ? 1 : 0);
