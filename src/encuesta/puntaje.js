// Validación de respuestas y armado del resultado. La usan el front y el backend
// (que recalcula y guarda: es la fuente de verdad).
// El nivel de madurez se calcula con la matriz v3 (ver matriz.js).
import { seccionesVisibles } from './definicion.js'
import { evaluarMatriz } from './matriz.js'

const vacia = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Devuelve { idPregunta: mensaje } con los errores de una sección. */
export function validarSeccion(seccion, respuestas) {
  const errores = {}
  for (const p of seccion.preguntas) {
    const v = respuestas[p.id]
    if (p.requerida && vacia(v)) errores[p.id] = 'Esta pregunta es obligatoria.'
    else if (p.tipo === 'email' && !vacia(v) && !EMAIL.test(String(v).trim())) errores[p.id] = 'Ingresá un correo válido.'
    else if (!vacia(v) && (p.tipo === 'unica' || p.tipo === 'multiple')) {
      const validas = new Set(p.opciones.map((o) => o.texto))
      const elegidas = Array.isArray(v) ? v : [v]
      if (elegidas.some((e) => !validas.has(e))) errores[p.id] = 'Opción no válida.'
    }
  }
  return errores
}

export function validarEncuesta(respuestas) {
  return Object.assign({}, ...seccionesVisibles(respuestas).map((s) => validarSeccion(s, respuestas)))
}

/** Resultado completo: nivel de madurez (matriz v3), casos de uso y stack declarado. */
export function calcularResultado(respuestas) {
  const visibles = seccionesVisibles(respuestas)

  // Casos de uso por estado (de la sección de la industria elegida).
  const casos = { 'En producción': 0, 'En piloto': 0, 'En evaluación': 0, 'No evaluado': 0 }
  for (const s of visibles.filter((x) => x.grupo === 'casos')) {
    for (const p of s.preguntas.filter((x) => x.estadoCaso)) {
      if (respuestas[p.id] in casos) casos[respuestas[p.id]]++
    }
  }

  const stack = [...new Set(['p50', 'p52', 'p53', 'p54', 'p55'].flatMap((id) => [].concat(respuestas[id] ?? [])))]
    .filter((t) => t !== 'Ninguno')

  return { ...evaluarMatriz(respuestas), casos, stack, industria: respuestas.p4 ?? null }
}
