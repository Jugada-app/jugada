/**
 * Jugada · receptor de estadísticas del piloto A
 * Pega este código en Extensiones > Apps Script de una Hoja de cálculo nueva.
 * 1) Ejecuta la función configurar() una vez (crea las pestañas "eventos" y "KPIs").
 * 2) Implementar > Nueva implementación > Aplicación web
 *    Ejecutar como: Yo · Quién tiene acceso: Cualquier persona
 * 3) Copia la URL que termina en /exec y pégala en config.js → endpoint.
 */

const COLS = ["fecha", "dispositivo", "tipo", "categoria", "deporte", "codigo", "ejercicio",
  "duracion_s", "reps_ia", "reps_humano", "calidad", "fuente", "dias_desde_registro",
  "interes_b", "interes_c", "precio_b", "comentario", "version", "detalle"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const eventos = Array.isArray(body.eventos) ? body.eventos.slice(0, 50) : [];
    const sh = hoja_("eventos");
    const filas = eventos.map(ev => COLS.map(c => {
      const v = ev[c];
      if (c === "fecha") return v ? new Date(v) : new Date();
      if (v === undefined || v === null) return "";
      return typeof v === "number" ? v : String(v).slice(0, 500);
    }));
    if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, COLS.length).setValues(filas);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, n: filas.length })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Jugada: receptor activo");
}

function hoja_(nombre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    if (nombre === "eventos") { sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLS.length).setFontWeight("bold"); }
  }
  return sh;
}

/** Ejecuta una vez. Crea las pestañas y las fórmulas de los KPIs a1–a5 del plan. */
function configurar() {
  hoja_("eventos");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const k = ss.getSheetByName("KPIs") || ss.insertSheet("KPIs");
  k.clear();
  // Columnas de "eventos": A fecha, B dispositivo, C tipo, G ejercicio, I reps_ia, J reps_humano, K calidad, M dias_desde_registro, N interes_b, O interes_c, P precio_b
  const E = "eventos!";
  const filas = [
    ["KPI", "Valor", "Meta", "Cómo se calcula"],
    ["a1 · Familias registradas", `=IFERROR(COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="registro")),0)`, 100, "Teléfonos distintos con evento registro"],
    ["a2 · Activación a 7 días", `=IFERROR(COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="sesion",${E}M2:M<=7))/B2,0)`, 0.6, "Registrados que guardaron un ejercicio en sus primeros 7 días"],
    ["a3 · Ejercicios por jugador por semana", `=IFERROR(COUNTIFS(${E}C2:C,"sesion",${E}A2:A,">="&(NOW()-7))/COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="sesion",${E}A2:A>=NOW()-7)),0)`, 3, "Últimos 7 días, entre jugadores activos"],
    ["a4 · Precisión del conteo", `=IFERROR(1-SUMPRODUCT(ABS(${E}I2:I-${E}J2:J)*(${E}J2:J<>""))/SUMPRODUCT(${E}J2:J*(${E}J2:J<>"")),"")`, 0.95, "1 − error absoluto / conteo humano, solo sesiones validadas"],
    ["a5 · Familias que piden medir partidos", `=IFERROR(COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="encuesta",${E}N2:N="Sí"))/COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="encuesta")),0)`, 0.4, "Respuesta Sí a la pregunta de partidos (nivel B)"],
    ["Interés en cámara de liga (C)", `=IFERROR(COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="encuesta",${E}O2:O="Sí"))/COUNTUNIQUE(FILTER(${E}B2:B,${E}C2:C="encuesta")),0)`, "", "Respuesta Sí a la pregunta de cámara de liga"],
    ["Precio promedio declarado para B (MXN)", `=IFERROR(AVERAGE(FILTER(${E}P2:P,${E}C2:C="encuesta",${E}P2:P<>"")),0)`, "", "Promedio de la pregunta de precio"],
    ["Sesiones validadas por el papá", `=COUNTIFS(${E}C2:C,"sesion",${E}J2:J,"<>")`, "", "Sesiones con conteo humano capturado"],
    ["Instalaciones como app", `=COUNTIF(${E}C2:C,"instalacion")`, "", ""],
    ["Tarjetas compartidas", `=COUNTIF(${E}C2:C,"compartir")`, "", ""],
  ];
  k.getRange(1, 1, filas.length, 4).setValues(filas);
  k.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#1D6943").setFontColor("#FFFFFF");
  ["B3:C3", "B5:C5", "B6:C6", "B7:B7"].forEach(r => k.getRange(r).setNumberFormat("0%"));
  k.getRange("B4").setNumberFormat("0.0");
  k.setColumnWidth(1, 300); k.setColumnWidth(4, 420);

  // Precisión por ejercicio, para calibrar umbrales del motor
  const start = filas.length + 3;
  k.getRange(start, 1, 1, 4).setValues([["Ejercicio", "Precisión", "Sesiones validadas", "Calidad promedio"]]).setFontWeight("bold");
  const ids = ["dominadas", "idavuelta", "pasepared", "tiro", "lanzamiento", "arranque"];
  ids.forEach((id, i) => {
    const r = start + 1 + i, cond = `(${E}G2:G="${id}")*(${E}J2:J<>"")`;
    k.getRange(r, 1, 1, 4).setValues([[id,
      `=IFERROR(1-SUMPRODUCT(ABS(${E}I2:I-${E}J2:J)*${cond})/SUMPRODUCT(${E}J2:J*${cond}),"")`,
      `=SUMPRODUCT(${cond})`,
      `=IFERROR(AVERAGEIFS(${E}K2:K,${E}G2:G,"${id}",${E}C2:C,"sesion"),"")`]]);
  });
  k.getRange(start + 1, 2, ids.length, 1).setNumberFormat("0%");
  k.getRange(start + 1, 4, ids.length, 1).setNumberFormat("0");
}
