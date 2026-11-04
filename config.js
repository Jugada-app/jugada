// Jugada · configuración del piloto A
// Edita estos valores antes de publicar. No necesitas tocar el resto del código.
export const CONFIG = {
  appName: "Jugada",
  version: "0.1-piloto-A",

  // URL de la aplicación web de Google Apps Script (ver LEEME.md, paso 3).
  // Vacío = la app funciona igual, pero no envía estadísticas del piloto.
  endpoint: "",

  // Aparecen en el aviso de privacidad. Pon tu nombre o el de tu empresa.
  responsable: "Adrián Pimentel Limón",
  contacto: "tu-correo@ejemplo.com",

  // Meta semanal de ejercicios por jugador (KPI a3 del plan)
  weeklyGoal: 3,
  // Después de cuántos ejercicios guardados se invita a la encuesta de B y C
  surveyAfter: 3,

  // Modelo de pose (MediaPipe). Se descarga la primera vez y queda guardado en el teléfono.
  mediapipe: {
    bundle: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs",
    wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    model: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  },
};
