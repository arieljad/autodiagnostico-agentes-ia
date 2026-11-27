import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import os from 'node:os'
import path from 'node:path'
import { calcularResultado, validarEncuesta } from '../../encuesta/puntaje.js'
import { seccionesVisibles, todasLasPreguntas } from '../../encuesta/definicion.js'
import { ITEMS } from '../../encuesta/matriz.js'

const opciones = Object.fromEntries(todasLasPreguntas().filter((p) => p.opciones).map((p) => [p.id, p.opciones.map((o) => o.texto)]))
const ultima = (id) => opciones[id].at(-1)

// Completa las obligatorias que falten con la primera opción (o un texto),
// repitiendo hasta que no aparezcan preguntas nuevas (hay preguntas condicionadas).
function completar(respuestas) {
  const r = { ...respuestas }
  let cambio = true
  while (cambio) {
    cambio = false
    for (const s of seccionesVisibles(r)) {
      for (const p of s.preguntas) {
        if (r[p.id] !== undefined || !p.requerida) continue
        cambio = true
        if (!p.opciones) r[p.id] = 'Atención al cliente'
        else r[p.id] = p.tipo === 'multiple' ? [p.opciones[0].texto] : p.opciones[0].texto
      }
    }
  }
  return r
}
const idsVisibles = (r) => seccionesVisibles(r).flatMap((s) => s.preguntas.map((p) => p.id))

const base = { p1: 'ana@empresa.com', p4: 'Seguros' }
const SI = ['p86', 'p87', 'p88', 'p89', 'p90', 'p91', 'p49', 'p59', 'p61', 'p62', 'p63', 'p64', 'p66', 'p67', 'p68', 'p69', 'p71', 'p72', 'p73', 'p74', 'p75', 'p76', 'p77', 'p81', 'p82', 'p83']
// Respuestas que cumplen todos los ítems de la matriz.
const maximas = completar({
  ...base,
  p11: 'En producción', p12: 'En producción',
  p45: ultima('p45'), p48: ultima('p48'), p57: ultima('p57'), p58: ultima('p58'), p65: ultima('p65'), p78: ultima('p78'),
  p47: opciones.p47.slice(1),
  p60: 'Sí, en todos los casos', p70: 'Sí, en todos los agentes',
  ...Object.fromEntries(SI.map((id) => [id, 'Sí'])),
})
const conNo = (...ids) => ({ ...maximas, ...Object.fromEntries(ids.map((id) => [id, 'No'])) })

describe('definición', () => {
  it('tiene 81 preguntas del Form más 9 nuevas, sin ids repetidos', () => {
    const ids = todasLasPreguntas().map((p) => p.id)
    expect(ids).toHaveLength(90)
    expect(new Set(ids).size).toBe(90)
  })
  it('orden: contexto, casos, dimensiones de lo básico a lo avanzado, stack y contacto al final', () => {
    expect(seccionesVisibles(maximas).map((s) => s.id)).toEqual(
      ['alcance', 'casos-11', 'gobierno', 'conocimiento', 'tecnologia', 'operacion', 'costos', 'ontologia', 'stack', 'contacto'])
  })
  it('punto de control: sin casos en piloto ni producción, la encuesta se acorta', () => {
    const sinAgentes = { ...base, p11: 'En evaluación' }
    expect(seccionesVisibles(sinAgentes).map((s) => s.id)).toEqual(['alcance', 'casos-11', 'gobierno', 'conocimiento', 'contacto'])
    expect(idsVisibles(sinAgentes)).not.toContain('p87') // inventario de agentes
    expect(idsVisibles(sinAgentes)).toEqual(expect.arrayContaining(['p86', 'p69', 'p76', 'p89', 'p91'])) // bases del nivel 1 y conocimiento
    expect(idsVisibles({ ...base, p11: 'En piloto' })).toContain('p61')
  })
  it('muestra solo la sección de casos de uso de la industria elegida', () => {
    const casos = seccionesVisibles({ p4: 'Salud' }).filter((s) => s.grupo === 'casos')
    expect(casos.map((s) => s.titulo)).toEqual(['Casos de uso de agentes · Salud'])
  })
  it('salta tecnología y dominios de la ontología si la 78 es "No, aún no se consideró"', () => {
    const conAgentes = { p4: 'Seguros', p11: 'En piloto' }
    expect(idsVisibles({ ...conAgentes, p78: 'No, aún no se consideró' })).not.toContain('p80')
    expect(idsVisibles({ ...conAgentes, p78: 'No, aún no se consideró' })).not.toContain('p79')
    expect(idsVisibles(conAgentes)).not.toContain('p80') // hasta que responda la 78
    expect(idsVisibles({ ...conAgentes, p78: 'Se está evaluando o diseñando conceptualmente, pero no hay desarrollos técnicos' })).toEqual(
      expect.arrayContaining(['p79', 'p80']))
  })
  it('salta área del líder y roles (46 y 47) si en la 45 no hay liderazgo', () => {
    const sinLider = { p45: opciones.p45[0] }
    expect(idsVisibles(sinLider)).not.toContain('p46')
    expect(idsVisibles(sinLider)).not.toContain('p47')
    expect(validarEncuesta(completar({ ...base, ...sinLider }))).toEqual({}) // la 47 ya no es obligatoria
    expect(idsVisibles({ p45: opciones.p45[1] })).toEqual(expect.arrayContaining(['p46', 'p47']))
  })
  it('con industria "Otra", la pregunta 85 define el punto de control y el tope', () => {
    const otra = (p85) => calcularResultado({ ...maximas, p4: 'Otra', p41: 'Reclamos', p85 })
    expect(otra('Dos o más en producción').nivel.nivel).toBe(5)
    expect(otra('Uno en producción').nivel.nivel).toBe(2)
    expect(otra('Solo en piloto').nivel.nivel).toBe(1)
    expect(idsVisibles({ p4: 'Otra', p85: 'Solo en piloto' })).toContain('p61')
    expect(idsVisibles({ p4: 'Otra', p85: 'Ninguno en piloto ni en producción' })).not.toContain('p61')
  })
  it('cada ítem de la matriz se apoya en preguntas que existen', () => {
    const ids = new Set(todasLasPreguntas().map((p) => p.id))
    for (const it of ITEMS) for (const p of it.preguntas) if (p !== 'casos') expect(ids.has(p), `${it.id} → ${p}`).toBe(true)
  })
})

describe('validación', () => {
  it('exige las obligatorias y valida el correo', () => {
    const errores = validarEncuesta({ p1: 'no-es-mail', p4: 'Seguros' })
    expect(errores.p1).toMatch(/correo/)
    expect(errores.p45).toBeDefined()
  })
  it('no exige los dominios (80) cuando la 78 es "No"', () => {
    const r = completar({ ...base, p78: 'No, aún no se consideró' })
    expect(r.p80).toBeUndefined()
    expect(validarEncuesta(r)).toEqual({})
  })
  it('las respuestas máximas son válidas', () => {
    expect(validarEncuesta(maximas)).toEqual({})
  })
})

describe('nivel de madurez (matriz v3)', () => {
  it('llega al nivel 5 cuando se cumplen todas las capacidades', () => {
    const r = calcularResultado(maximas)
    expect(r.nivel.nivel).toBe(5)
    expect(r.niveles.every((n) => n.cumplido)).toBe(true)
    expect(r.siguiente).toBeNull()
    expect(r.pendientes).toEqual([])
  })

  it('queda en el punto de partida sin las bases del nivel 1', () => {
    const r = calcularResultado(completar({ ...base, p86: 'No', p69: 'No', p76: 'No' }))
    expect(r.nivel.nivel).toBe(0)
    expect(r.siguiente.nivel).toBe(1)
    expect(r.pendientes.map((p) => p.id)).toEqual(['N1-GOB-01', 'N1-ROL-01', 'N1-CON-01', 'N1-SEG-01', 'N1-COS-01'])
  })

  it('limita el nivel según los casos de uso en producción', () => {
    expect(calcularResultado({ ...maximas, p11: 'En piloto', p12: 'En evaluación' }).nivel.nivel).toBe(1)
    const uno = calcularResultado({ ...maximas, p12: 'En piloto' })
    expect(uno.casosEnProduccion).toBe(1)
    expect(uno.nivel.nivel).toBe(2)
    expect(uno.topeAgentes).toBe(true)
    expect(uno.pendientes).toEqual([]) // las capacidades del nivel 3 ya están: falta tener más agentes
    expect(uno.fortalezas.length).toBeGreaterThan(0)
  })

  it('pondera el puntaje: cada nivel suma su proporción, sin superar la del anterior', () => {
    expect(calcularResultado(maximas).puntaje).toBe(5)
    // 9 de 11 en el nivel 3: los niveles 4 y 5 suman como mucho lo mismo que el 3.
    const nueve = calcularResultado(conNo('p49', 'p67'))
    expect(nueve.puntaje).toBe(4.5) // 1 + 1 + 3 × 9/11
    expect(nueve.nivel.nivel).toBe(4)
    // Un "No" más resta en proporción, no hace caer el nivel de golpe.
    const r = calcularResultado(conNo('p49', 'p67', 'p87')) // 8 de 11 en el nivel 3
    expect(r.puntaje).toBe(4.2)
    expect(r.nivel.nivel).toBe(4)
    expect(r.siguiente.nivel).toBe(5)
    expect(r.pendientes.map((p) => p.id)).toEqual(['N3-GOB-01', 'N3-ROL-02', 'N3-OBS-01'])
    expect(r.niveles[3].pct).toBe(100)
  })

  it('un nivel se alcanza con el 80% de su tramo del puntaje', () => {
    const sinAgentes = { p11: 'En piloto', p12: 'En evaluación' }
    const unNo = calcularResultado({ ...conNo('p86'), ...sinAgentes }) // 4 de 5 en el nivel 1
    expect(unNo.puntaje).toBe(0.8)
    expect(unNo.nivel.nivel).toBe(1)
    const dosNo = calcularResultado({ ...conNo('p86', 'p69'), ...sinAgentes }) // 3 de 5
    expect(dosNo.puntaje).toBe(0.6)
    expect(dosNo.nivel.nivel).toBe(0)
  })

  it('el tope por agentes en producción corta el puntaje', () => {
    const uno = calcularResultado({ ...maximas, p12: 'En piloto' })
    expect(uno.puntaje).toBe(2)
    expect(calcularResultado({ ...maximas, p11: 'En piloto', p12: 'En evaluación' }).puntaje).toBe(1)
  })

  it('arma la matriz dimensión × nivel', () => {
    const r = calcularResultado(conNo('p61'))
    const obs = r.dimensiones.find((d) => d.id === 'obs')
    expect(obs.porNivel[2]).toEqual({ si: 1, total: 2 })
    expect(obs.porNivel[1]).toBeNull()
  })
})

describe('API', () => {
  let app
  beforeAll(async () => {
    process.env.DATA_FILE = path.join(os.tmpdir(), `respuestas-${Date.now()}.json`)
    const { crearAlmacen } = await import('../almacenamiento.js')
    const { crearApp } = await import('../app.js')
    app = crearApp(await crearAlmacen())
  })

  it('rechaza una encuesta incompleta', async () => {
    const res = await request(app).post('/api/respuestas').send({ respuestas: base })
    expect(res.status).toBe(422)
  })

  it('guarda una encuesta completa y devuelve su resultado', async () => {
    const res = await request(app).post('/api/respuestas').send({ respuestas: { ...maximas, extra: 'x' } })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(String) })
    const ver = await request(app).get(`/api/respuestas/${res.body.id}/resultado`)
    expect(ver.status).toBe(200)
    expect(ver.body.resultado.nivel.nivel).toBe(5)
    expect(ver.body.resultado.puntaje).toBe(5)
    expect(ver.body.resultado.niveles).toHaveLength(5)
  })

  it('el resultado público no expone el informe completo, pero queda guardado', async () => {
    const res = await request(app).post('/api/respuestas').send({ respuestas: conNo('p49', 'p67', 'p87') })
    const { resultado } = (await request(app).get(`/api/respuestas/${res.body.id}/resultado`)).body
    for (const clave of ['pendientes', 'fortalezas', 'dimensiones', 'casos', 'stack', 'siguiente']) {
      expect(resultado).not.toHaveProperty(clave)
    }
    const { crearAlmacen } = await import('../almacenamiento.js')
    const guardada = await (await crearAlmacen()).obtener(res.body.id)
    expect(guardada.resultado.pendientes.map((p) => p.id)).toEqual(['N3-GOB-01', 'N3-ROL-02', 'N3-OBS-01'])
  })

  it('descarta respuestas a preguntas que quedaron ocultas', async () => {
    const r = { ...completar({ ...base, p78: 'No, aún no se consideró' }), p79: 'Neo4j', p80: 'Ventas', p12: 'En piloto' }
    const res = await request(app).post('/api/respuestas').send({ respuestas: { ...r, p4: 'Salud' } })
    expect(res.status).toBe(201)
    const { crearAlmacen } = await import('../almacenamiento.js')
    const guardada = await (await crearAlmacen()).obtener(res.body.id)
    expect(guardada.respuestas).not.toHaveProperty('p79')
    expect(guardada.respuestas).not.toHaveProperty('p80')
    expect(guardada.respuestas).not.toHaveProperty('p12') // caso de uso de Seguros, pero eligió Salud
  })

  it('devuelve 404 para un id inexistente', async () => {
    expect((await request(app).get('/api/respuestas/no-existe/resultado')).status).toBe(404)
  })
})
