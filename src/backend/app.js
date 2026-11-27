import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { calcularResultado, validarEncuesta } from '../encuesta/puntaje.js'
import { seccionesVisibles, todasLasPreguntas } from '../encuesta/definicion.js'
import { nuevoId } from './almacenamiento.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IDS_VALIDOS = new Set(todasLasPreguntas().map((p) => p.id))

/** Lo que se muestra al encuestado: nivel alcanzado y avance de cada nivel. */
export const resumenPublico = (r) => ({
  nivel: r.nivel,
  puntaje: r.puntaje,
  niveles: r.niveles.map(({ nivel, nombre, descripcion, items, si, pct, cumplido }) => ({ nivel, nombre, descripcion, items, si, pct, cumplido })),
  topeAgentes: r.topeAgentes,
  casosEnProduccion: r.casosEnProduccion,
})

export function crearApp(almacen) {
  const app = express()
  const origenes = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim())
  app.use(cors({ origin: origenes }))
  app.use(express.json({ limit: '200kb' }))

  app.get('/api/salud', (_req, res) => res.json({ ok: true, almacen: almacen.tipo }))

  // Recibe una encuesta completa, la valida, calcula el resultado y la guarda.
  app.post('/api/respuestas', async (req, res) => {
    const entrada = req.body?.respuestas
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return res.status(400).json({ error: 'Faltan las respuestas.' })
    }
    // Solo se guardan preguntas conocidas: nada de campos arbitrarios del cliente.
    const conocidas = Object.fromEntries(Object.entries(entrada).filter(([k]) => IDS_VALIDOS.has(k)))
    // Y solo las que aplican: se descartan respuestas a secciones o preguntas
    // que quedaron ocultas (ej. cambió de industria, o la 78 fue "No").
    const aplicables = new Set(seccionesVisibles(conocidas).flatMap((s) => s.preguntas.map((p) => p.id)))
    const respuestas = Object.fromEntries(Object.entries(conocidas).filter(([k]) => aplicables.has(k)))
    const errores = validarEncuesta(respuestas)
    if (Object.keys(errores).length) return res.status(422).json({ error: 'Hay respuestas incompletas o inválidas.', errores })

    const resultado = calcularResultado(respuestas)
    const registro = {
      id: nuevoId(),
      creado: new Date().toISOString(),
      email: String(respuestas.p1).trim().toLowerCase(),
      empresa: respuestas.p2?.trim() || null,
      industria: respuestas.p4,
      respuestas,
      resultado,
    }
    await almacen.guardar(registro)
    res.status(201).json({ id: registro.id })
  })

  // Resultado de una respuesta (link para volver a ver el diagnóstico). Es público,
  // así que solo devuelve el resumen: el informe completo (capacidades pendientes,
  // dimensiones, casos de uso) queda guardado para revisarlo en la reunión.
  app.get('/api/respuestas/:id/resultado', async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(404).json({ error: 'No encontrado.' })
    const r = await almacen.obtener(req.params.id)
    if (!r) return res.status(404).json({ error: 'No encontrado.' })
    res.json({ id: r.id, creado: r.creado, empresa: r.empresa, resultado: resumenPublico(r.resultado) })
  })

  // En producción el mismo servidor sirve el front compilado (dist/).
  const dist = path.resolve('dist')
  if (existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'Error interno.' })
  })
  return app
}
