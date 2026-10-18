# Goniómetro educativo experimental
Módulo estático independiente del backend y del ingreso Google. No agrega permisos OAuth.
Foto: tres puntos editables con arrastre o coordenadas; detección de codo o rodilla opcional.
Cámara: seguimiento automático, congelación y corrección manual. Cierre explícito de tracks al apagar, cambiar fuente o salir de pantalla.
La inferencia es local. Solo la descarga del código/wasm y modelo usa servicios externos al activar automático.
No se guardan imágenes ni resultados en servidor ni localStorage. Exportar PNG es una acción explícita del usuario.

## Abrir
Desde la raíz del repositorio: `python3 -m http.server 8080`.
Abrir `http://localhost:8080/goniometro/`. Para cámara desde teléfono se necesita alojamiento HTTPS; una IP HTTP de la PC no equivale a localhost del teléfono.
Pruebas: `node --test tests/goniometro.test.mjs`.
No es necesario npm install. Dependencia automática fijada: @mediapipe/tasks-vision 0.10.21; modelo pose_landmarker_lite float16 versión 1. Su descarga requiere conexión, no hay garantía offline. Documentación: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
Manual no descarga el detector.

## Interpretación y límites
Se calcula el ángulo entre dos segmentos sobre píxeles de imagen, escalando x por ancho e y por alto. No usar directamente coordenadas normalizadas de una imagen rectangular.
Ángulo geométrico 0–180° y suplemento se muestran por separado; no hay clasificación automática de flexión/hiperextensión ni valores normales.
El modelo estima puntos corporales, no palpa reparos óseos. Solo codos y rodillas en automático; manos, dedos y pies pueden medirse manualmente sobre foto, con referencias definidas por el docente.
Sin validación clínica. Perspectiva, oclusión, ropa, posición y movimiento afectan el resultado. No mide rotaciones fuera del plano.
Inferencia síncrona limitada a ~8 Hz; puede bloquear la interfaz en dispositivos lentos. Worker y evaluación de rendimiento pendientes.
Fotos se reducen a un lado máximo de 1600 px. Se rechazan archivos de más de 15 MB y, tras decodificar, más de 40 megapíxeles.

## Validación antes de integrar/publicar
- Comparar ángulos y repetibilidad con un goniómetro físico y protocolo docente.
- Probar HTTPS Android Chrome, permiso denegado, cambio de cámara, apagar/congelar, fondo y navegación.
- Probar foto vertical/horizontal, arrastre táctil, teclado/coordenadas y descarga PNG.
- Probar carga real de modelo, persona ausente, puntos ocultos, lado corporal y fondos.
- Confirmar que no hay envío de imágenes en red. El CDN sí recibe metadatos de las descargas.
- No incorporar fotos identificables al repositorio ni datos personales en reportes.
Pruebas de geometría ejecutables incluidas; cámara física y precisión anatómica requieren prueba presencial.

## Registro de esta implementación (18/10/2026)
Se ejecutaron seis pruebas de geometría con Node y comprobación sintáctica del módulo. La URL fijada del JavaScript de MediaPipe respondió HTTP 200. No se completó la prueba visual: el navegador de Playwright no estaba instalado y su descarga falló. No se comprobó inferencia real, permiso de cámara ni precisión clínica. La propuesta permanece en rama y PR de borrador, sin despliegue.
