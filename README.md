# Autodiagnóstico de madurez en agentes de IA

Encuesta abierta (sin login) que reemplaza al Microsoft Form original. Muestra el
resultado al terminar: nivel de madurez general, radar por dimensión,
recomendaciones y resumen de casos de uso.

Stack: Vue 3 + Vite + Pinia + vue-router + Chart.js en el front; Express 5 en el
backend; Postgres (o un archivo JSON local si no hay base configurada).

## Correr en local

```bash
npm install
npm run dev:api   # backend en http://localhost:3001
npm run dev       # front en http://localhost:5173 (pasa /api al backend)
npm test          # pruebas de puntuación y API
```

Sin `DATABASE_URL`, las respuestas se guardan en `data/respuestas.json`.

## Producción (Railway u otro)

`npm run build` y después `npm start`: el backend sirve el front compilado (`dist/`)
y la API desde el mismo puerto. Variables en `.env.example`.

## Dónde tocar

- `src/encuesta/definicion.js`: preguntas, opciones, condiciones y ramificación por
  industria. Cada pregunta conserva su `numero` del Form original.
- `src/encuesta/matriz.js`: modelo de madurez de la "Matriz de madurez en agentes
  de IA - v3" (Capa de contexto/madurez): niveles, dimensiones, umbral y el mapeo
  de cada ítem de la matriz a las respuestas de la encuesta.
- `src/encuesta/puntaje.js`: validación y armado del resultado. Lo usan el front y
  el backend; el backend recalcula y es la fuente de verdad.
- `src/views/`: pantallas de inicio, encuesta y resultado.

## Recorrido

1. Alcance (qué es la capa agéntica), industria y área.
2. Casos de uso de la industria: punto de partida y punto de control.
3. Gobierno y equipos · 4. Conocimiento y contexto.
5. Tecnología y arquitectura · 6. Operación (observabilidad y seguridad) ·
   7. Costos y valor · 8. Capa ontológica · 9. Tu stack (opcional). Solo con
   agentes en piloto o en producción.
10. Datos de contacto y consentimiento, y después el resultado.

Las preguntas Sí / No / No sé consecutivas se muestran juntas en una grilla.

## Cómo se calcula el nivel

Basado en la hoja `Resultado` del Excel v3, con un puntaje ponderado en lugar del corte por nivel:

- Cinco niveles acumulativos: Exploración, Primeros agentes, Agentes gestionados,
  Agentes coordinados y Conocimiento integrado.
- Cada ítem de la matriz (N1-ROL-01, N3-OBS-02, …) se da por cumplido según una
  respuesta. Están los 40 ítems de la matriz (de 58) que la encuesta evalúa.
- Puntaje ponderado de 0 a 5: cada nivel suma su proporción de ítems cumplidos,
  pero nunca más que el nivel anterior (son acumulativos). Ej.: 100%, 86%, 64%,
  20% y 0% dan 1 + 0,86 + 0,64 + 0,2 + 0 = 2,7. Un "No" resta en proporción.
- Un nivel se alcanza al completar el 80% de su tramo (`UMBRAL` en `matriz.js`):
  0,8 → nivel 1; 2,7 → nivel 2; 2,8 → nivel 3.
- Tope por agentes en producción (la P-01 del Excel), contando los casos de uso
  de la industria marcados "En producción" (con industria "Otra", la pregunta
  p85): con ninguno, máximo nivel 1; con uno, máximo nivel 2. Los niveles por
  encima del tope no suman al puntaje.
- Punto de control (como en el Excel): sin casos en piloto ni en producción, la
  encuesta se acorta a contexto, gobierno, conocimiento y contacto (~20 preguntas).
- Sin responder cuenta como No.

El resultado público muestra el puntaje, el nivel y la escalera; el informe completo
(capacidades pendientes, dimensiones, casos de uso) queda guardado y el endpoint
público no lo devuelve. Tampoco hay comparación con la industria: eso se presenta en la
reunión (botón "Agendar una reunión", link en `VITE_AGENDA_URL`).
