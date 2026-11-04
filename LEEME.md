# Jugada · piloto A (modo entrenamiento)

App web instalable: se abre desde un enlace (por ejemplo, de WhatsApp) y se guarda en la pantalla del celular como una app. La IA de pose corre **dentro del teléfono**; el video nunca se sube.

## Qué incluye

| Pieza | Archivo |
|---|---|
| Pantallas: registro con consentimiento del tutor, inicio con meta semanal, ejercicio, cámara en vivo, resultado, progreso, encuesta B/C, perfil y aviso de privacidad | `index.html`, `styles.css`, `app.js` |
| Motor de conteo y calificación de técnica de los 6 ejercicios | `drills.js` |
| Ajustes del piloto (nombre, URL de medición, contacto) | `config.js` |
| Instalación y uso sin conexión | `manifest.webmanifest`, `sw.js`, `icons/` |
| Medición de KPIs a1–a5 en Google Sheets | `apps-script/Codigo.gs` |
| Pruebas del motor con poses sintéticas | `test/drills.test.mjs` |

Ejercicios: **Dominadas**, **Sprint ida y vuelta**, **Pases a pared**, **Tiro a portería** (Pro), **Lanzamiento de QB** y **Postura y arranque** (Pro). Los Pro están abiertos durante el piloto para medir interés.

## Paso 1 · Ajusta `config.js`

- `responsable` y `contacto`: aparecen en el aviso de privacidad.
- `endpoint`: lo llenas en el paso 3.

## Paso 2 · Publica la app (gratis, 5 minutos)

La cámara solo funciona con **https**, así que necesitas un hosting. La forma más rápida:

1. Entra a <https://app.netlify.com/drop>.
2. Arrastra la carpeta `jugada` completa.
3. Netlify te da una dirección `https://algo.netlify.app`. Puedes cambiarle el nombre en *Site settings* (ej. `jugada-piloto.netlify.app`).

Alternativas: Vercel, GitHub Pages o Cloudflare Pages. Cualquier hosting estático con https sirve.

Para actualizar después, vuelve a arrastrar la carpeta en *Deploys*.

## Paso 3 · Conecta la medición del piloto (Google Sheets)

1. Crea una hoja nueva en Google Sheets, por ejemplo "Jugada · piloto A".
2. *Extensiones → Apps Script*. Borra lo que haya y pega el contenido de `apps-script/Codigo.gs`. Guarda.
3. En el menú de funciones elige `configurar` y presiona **Ejecutar**. Acepta los permisos. Se crean las pestañas **eventos** y **KPIs**.
4. *Implementar → Nueva implementación → Aplicación web*. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Implementar.
5. Copia la URL que termina en `/exec`, pégala en `config.js` → `endpoint` y vuelve a publicar la app (paso 2).

La pestaña **KPIs** se calcula sola:

| KPI del plan | Cómo se mide |
|---|---|
| a1 Familias registradas | Teléfonos distintos que completaron el registro |
| a2 Activación a 7 días | Registrados que guardaron un ejercicio en sus primeros 7 días |
| a3 Ejercicios por jugador por semana | Sesiones de los últimos 7 días entre jugadores activos |
| a4 Precisión del conteo | Compara el conteo de la IA con el que escribe el papá en el resultado |
| a5 Familias que piden medir partidos | Respuesta "Sí" en la encuesta de B |

Abajo también verás la precisión **por ejercicio**, para saber cuál calibrar primero, y el interés en la cámara de liga (C) y el precio declarado para B. Copia esos valores al marcador del tablero cada semana.

Qué se envía: un identificador aleatorio del teléfono, deporte, categoría, código de liga, ejercicio, conteos, duración, calificación y respuestas de la encuesta. **Nunca** el nombre del jugador ni imágenes.

## Paso 4 · Prueba tú antes que las familias

1. Abre la dirección en tu celular (Chrome en Android, Safari en iPhone).
2. Regístrate con el código `PRUEBA` para poder filtrar tus datos después.
3. Haz cada ejercicio 2 veces con el celular en tripié, a la distancia que indica la pantalla, y escribe tu conteo en el resultado.
4. Revisa en la hoja que llegaron los eventos y la precisión por ejercicio.
5. Instala la app: en Android desde Perfil → *Instalar Jugada*; en iPhone, Safari → Compartir → *Agregar a inicio*.

La primera vez la IA descarga unos 6 MB; después funciona aunque haya mala señal en la cancha.

## Enlaces con código de origen

Agrega `?c=CODIGO` al enlace para saber qué canal trae a cada familia. El código se precarga en el registro y llega a la hoja en la columna `codigo`:

- Link en el perfil de TikTok: `https://jugada-app.github.io/jugada/?c=TIKTOK`
- Instagram: `?c=INSTAGRAM` · Facebook: `?c=FACEBOOK`
- Grupo de WhatsApp de una liga: `?c=LIGA-NORTE`
- Entrenador embajador: `?c=COACH-RAUL`

## Cómo calibrar el conteo

Los umbrales viven en `drills.js`, en la sección `reglas por ejercicio`. Si un ejercicio **cuenta de más**, sube el umbral; si **cuenta de menos**, bájalo:

| Ejercicio | Umbral principal |
|---|---|
| Dominadas | `lift > 0.35` (altura del pie para contar un toque) |
| Ida y vuelta | zonas `x < 0.3` / `x > 0.7` del cuadro |
| Pases a pared | `kick(F, 2.5, …)` (velocidad del pie) |
| Tiro | `kick(F, 3.5, …)` |
| Lanzamiento | `sp > 3.0` (velocidad de la muñeca al soltar) |
| Postura y arranque | `knee < 140` (postura) y `sp > 2.2` (salida) |

Después de cambiar algo, corre las pruebas: `node test/drills.test.mjs`.

## Límites conocidos de esta versión

- El conteo es **beta**: está probado con poses sintéticas, no con video real. La calibración sale de las primeras sesiones validadas por los papás.
- Dominadas cuenta levantamientos del pie, no detecta el balón: si el balón cae, ese toque igual se cuenta.
- Si entran otras personas al cuadro, la app sigue al jugador más grande y cercano al que ya seguía.
- Los datos del jugador viven en el teléfono; si borra el navegador, se pierde el historial.
- El aviso de privacidad es una versión piloto: revísalo con un especialista antes del lanzamiento comercial.
