// Modelo de madurez basado en "Matriz de madurez en agentes de IA - v3.xlsx".
//
// - Cinco niveles acumulativos: para estar en el nivel 3 hay que cumplir los
//   niveles 1, 2 y 3.
// - Cada ítem de la matriz (N1-ROL-01, N2-OBS-01, …) pertenece a un nivel y a una
//   dimensión, y se da por cumplido según la respuesta a una pregunta de la encuesta.
//   Solo están los ítems de la matriz que la encuesta actual permite evaluar.
// - Un nivel se cumple con al menos UMBRAL de sus ítems en Sí. El Excel usa 100%
//   por defecto y sugiere 80% como alternativa; acá se usa 80% porque la encuesta
//   evalúa menos ítems por nivel que la matriz completa.
// - Tope por agentes en producción (como la P-01 del Excel): el nivel 2 requiere
//   al menos un caso de uso en producción; los niveles 3 a 5, al menos dos. Se
//   cuentan los casos de uso de la industria marcados "En producción"; con
//   industria "Otra", la respuesta a la pregunta p85.

import { ESTADO_OTRA, ENCUESTA, todasLasPreguntas } from './definicion.js'

export const UMBRAL = 0.8

export const NIVELES = [
  { nivel: 1, nombre: 'Exploración', descripcion: 'La organización explora la IA, pero todavía no tiene agentes en producción.' },
  { nivel: 2, nombre: 'Primeros agentes', descripcion: 'Hay uno o más agentes en producción, implementados por área o por proveedor y sin coordinación entre ellos.' },
  { nivel: 3, nombre: 'Agentes gestionados', descripcion: 'Hay varios agentes con dueños, una plataforma de referencia y controles comunes.' },
  { nivel: 4, nombre: 'Agentes coordinados', descripcion: 'Hay una arquitectura agéntica común: los agentes se comunican, se delegan tareas, comparten contexto y se gobiernan de forma central.' },
  { nivel: 5, nombre: 'Conocimiento integrado', descripcion: 'Una capa ontológica integra procesos, normativas, documentos y datos, y da a todos los agentes un significado común y explicable.' },
]
export const SIN_NIVEL = { nivel: 0, nombre: 'Punto de partida', descripcion: 'Todavía no se cumplen las bases del nivel 1: referente, política de uso, casos identificados, reglas de uso de datos y una estimación de valor.' }

export const DIMENSIONES = [
  { id: 'gob', nombre: 'Gobierno y organización' },
  { id: 'rol', nombre: 'Equipos y roles' },
  { id: 'tec', nombre: 'Tecnología y arquitectura' },
  { id: 'con', nombre: 'Conocimiento, procesos y datos' },
  { id: 'obs', nombre: 'Observabilidad y trazabilidad' },
  { id: 'seg', nombre: 'Seguridad, riesgo y cumplimiento' },
  { id: 'cos', nombre: 'Costos y valor' },
]

/** Casos de uso en producción de la industria elegida. */
export function casosEnProduccion(respuestas) {
  if (respuestas.p4 === 'Otra') return ESTADO_OTRA[respuestas.p85]?.enProduccion ?? 0
  const seccion = ENCUESTA.secciones.find((s) => s.grupo === 'casos' && s.condicion.valor === respuestas.p4)
  return (seccion?.preguntas ?? []).filter((p) => p.estadoCaso && respuestas[p.id] === 'En producción').length
}
// Casos en producción → nivel máximo alcanzable.
const nivelMaximo = (n) => (n === 0 ? 1 : n === 1 ? 2 : 5)

// Ayudantes para escribir las reglas de cumplimiento.
const es = (id, texto) => (r) => r[id] === texto
const incluye = (id, ...prefijos) => (r) => Array.isArray(r[id]) && prefijos.every((p) => r[id].some((t) => t.startsWith(p)))
const algunoDe = (...reglas) => (r) => reglas.some((f) => f(r))
const si = (id) => es(id, 'Sí')

// Posición de la respuesta en la lista de opciones (0 = primera), o -1. Las
// escaleras de opciones del Form van de menor a mayor madurez, así que "desde la
// opción N" quiere decir "esa respuesta o una más madura".
const OPCIONES = Object.fromEntries(
  todasLasPreguntas().filter((p) => p.opciones).map((p) => [p.id, p.opciones.map((o) => o.texto)]))
const desde = (id, indice) => (r) => (OPCIONES[id]?.indexOf(r[id]) ?? -1) >= indice

// Algún caso de uso identificado (en evaluación, piloto o producción).
const hayCasosIdentificados = (r) =>
  Object.entries(r).some(([k, v]) => /^p\d+$/.test(k) && ['En evaluación', 'En piloto', 'En producción'].includes(v)) ||
  (typeof r.p41 === 'string' && r.p41.trim().length > 0) ||
  (r.p85 !== undefined && r.p85 !== 'Ninguno en piloto ni en producción')

export const ITEMS = [
  // Nivel 1 · Exploración
  { id: 'N1-GOB-01', nivel: 1, dim: 'gob', capacidad: 'Política de uso de IA', preguntas: ['p86'], cumple: si('p86'),
    porQue: 'Es la regla mínima para que la exploración no exponga a la empresa.' },
  { id: 'N1-ROL-01', nivel: 1, dim: 'rol', capacidad: 'Referente de IA', preguntas: ['p45'], cumple: desde('p45', 1),
    porQue: 'Alguien tiene que concentrar el aprendizaje y evitar esfuerzos duplicados.' },
  { id: 'N1-CON-01', nivel: 1, dim: 'con', capacidad: 'Casos de uso identificados', preguntas: ['casos'], cumple: hayCasosIdentificados,
    porQue: 'Para que el primer agente resuelva un problema real, y no sea solo una demostración tecnológica.' },
  { id: 'N1-SEG-01', nivel: 1, dim: 'seg', capacidad: 'Lineamientos de uso de datos para IA', preguntas: ['p69'], cumple: si('p69'),
    porQue: 'Los datos personales y confidenciales necesitan reglas antes de la primera prueba.' },
  { id: 'N1-COS-01', nivel: 1, dim: 'cos', capacidad: 'Estimación de costo y beneficio', preguntas: ['p76'],
    cumple: algunoDe(si('p76'), es('p76', 'Se estimó solo para algunos casos')),
    porQue: 'Sin una hipótesis de valor no se puede justificar el paso a producción.' },

  // Nivel 2 · Primeros agentes
  { id: 'N2-TEC-01', nivel: 2, dim: 'tec', capacidad: 'Integración con las fuentes internas', preguntas: ['p57'], cumple: desde('p57', 1),
    porQue: 'Las copias manuales de información quedan desactualizadas y rompen la confianza en las respuestas.' },
  { id: 'N2-CON-01', nivel: 2, dim: 'con', capacidad: 'Conocimiento de cada agente con responsable', preguntas: ['p88'], cumple: si('p88'),
    porQue: 'La calidad de un agente depende de la calidad y vigencia de lo que consulta.' },
  { id: 'N2-OBS-01', nivel: 2, dim: 'obs', capacidad: 'Registro de interacciones', preguntas: ['p61'], cumple: si('p61'),
    porQue: 'Sin registro no se pueden analizar errores ni reclamos.' },
  { id: 'N2-OBS-02', nivel: 2, dim: 'obs', capacidad: 'Indicador de calidad por agente', preguntas: ['p63'], cumple: si('p63'),
    porQue: 'Es la base mínima para saber si el agente sirve.' },
  { id: 'N2-SEG-01', nivel: 2, dim: 'seg', capacidad: 'Revisión de seguridad y privacidad', preguntas: ['p68'], cumple: si('p68'),
    porQue: 'El agente expone datos y sistemas a usuarios reales.' },
  { id: 'N2-SEG-02', nivel: 2, dim: 'seg', capacidad: 'Derivación a una persona', preguntas: ['p60'], cumple: es('p60', 'Sí, en todos los casos'),
    porQue: 'Es el control básico ante errores y la principal protección de la experiencia del cliente.' },
  { id: 'N2-COS-01', nivel: 2, dim: 'cos', capacidad: 'Costo mensual por agente', preguntas: ['p72'], cumple: si('p72'),
    porQue: 'Los costos por uso crecen con el volumen y tienen que ser visibles desde el inicio.' },

  // Nivel 3 · Agentes gestionados
  { id: 'N3-GOB-01', nivel: 3, dim: 'gob', capacidad: 'Inventario central de agentes', preguntas: ['p87'], cumple: si('p87'),
    porQue: 'Con varios agentes, lo primero es saber cuántos hay y quién responde por cada uno.' },
  { id: 'N3-GOB-02', nivel: 3, dim: 'gob', capacidad: 'Área que fija lineamientos comunes', preguntas: ['p45', 'p48'],
    cumple: algunoDe(desde('p45', 2), desde('p48', 2)),
    porQue: 'Evita que cada proveedor o área imponga sus propios criterios.' },
  { id: 'N3-ROL-01', nivel: 3, dim: 'rol', capacidad: 'Roles definidos por agente', preguntas: ['p47'],
    cumple: incluye('p47', 'Dueño de agente', 'Responsable técnico', 'Responsable de contenido', 'Referente de riesgos'),
    porQue: 'Ordena quién decide, quién opera y quién controla cada agente.' },
  { id: 'N3-ROL-02', nivel: 3, dim: 'rol', capacidad: 'Capacitación a usuarios y equipos', preguntas: ['p49'], cumple: si('p49'),
    porQue: 'La adopción y el control dependen de que la gente sepa cuándo confiar y cuándo no.' },
  { id: 'N3-TEC-03', nivel: 3, dim: 'tec', capacidad: 'Conectores reutilizables', preguntas: ['p57'], cumple: desde('p57', 3),
    porQue: 'Corta el problema de que cada agente se integre por su cuenta con cada sistema.' },
  { id: 'N3-CON-01', nivel: 3, dim: 'con', capacidad: 'Fuentes de conocimiento comunes con dueño', preguntas: ['p89'], cumple: si('p89'),
    porQue: 'Es el paso previo para dejar de repetir el mismo conocimiento en cada agente.' },
  { id: 'N3-OBS-01', nivel: 3, dim: 'obs', capacidad: 'Tablero común de uso y calidad', preguntas: ['p67'], cumple: si('p67'),
    porQue: 'Permite comparar agentes y decidir con una vista única.' },
  { id: 'N3-OBS-02', nivel: 3, dim: 'obs', capacidad: 'Evaluación periódica de respuestas', preguntas: ['p66'], cumple: si('p66'),
    porQue: 'Detecta degradaciones cuando cambian el modelo, el contenido o el proceso.' },
  { id: 'N3-SEG-02', nivel: 3, dim: 'seg', capacidad: 'Controles comunes de entrada y salida', preguntas: ['p70'], cumple: es('p70', 'Sí, en todos los agentes'),
    porQue: 'Con varios agentes, los controles tienen que ser comunes y no reimplementarse en cada uno.' },
  { id: 'N3-COS-01', nivel: 3, dim: 'cos', capacidad: 'Presupuesto y alertas de consumo', preguntas: ['p77'], cumple: si('p77'),
    porQue: 'Los costos por uso pueden dispararse sin aviso.' },
  { id: 'N3-COS-02', nivel: 3, dim: 'cos', capacidad: 'Valor frente a costo', preguntas: ['p73'], cumple: si('p73'),
    porQue: 'Justifica qué agentes escalar y cuáles retirar.' },

  // Nivel 4 · Agentes coordinados
  { id: 'N4-GOB-01', nivel: 4, dim: 'gob', capacidad: 'Modelo de gobierno formal', preguntas: ['p48'], cumple: desde('p48', 3),
    porQue: 'Coordinar agentes de distintos proveedores requiere una autoridad reconocida por todas las áreas.' },
  { id: 'N4-ROL-01', nivel: 4, dim: 'rol', capacidad: 'Arquitectura agéntica como rol', preguntas: ['p47'], cumple: incluye('p47', 'Equipo de arquitectura agéntica'),
    porQue: 'La interoperabilidad no surge sola: alguien tiene que sostener el estándar.' },
  { id: 'N4-TEC-02', nivel: 4, dim: 'tec', capacidad: 'Comunicación estándar entre agentes', preguntas: ['p58'], cumple: desde('p58', 2),
    porQue: 'Agentes de distintos proveedores se delegan tareas sin integraciones a medida.' },
  { id: 'N4-TEC-04', nivel: 4, dim: 'tec', capacidad: 'Orquestación por intención', preguntas: ['p59'], cumple: si('p59'),
    porQue: 'El cliente obtiene una sola respuesta aunque intervengan varios agentes.' },
  { id: 'N4-TEC-05', nivel: 4, dim: 'tec', capacidad: 'Contexto compartido entre agentes', preguntas: ['p58'], cumple: desde('p58', 1),
    porQue: 'Es la diferencia visible para el cliente entre agentes aislados y coordinados.' },
  { id: 'N4-CON-01', nivel: 4, dim: 'con', capacidad: 'Capa de contexto común', preguntas: ['p90'], cumple: si('p90'),
    porQue: 'Elimina silos y versiones distintas de la misma información.' },
  { id: 'N4-CON-02', nivel: 4, dim: 'con', capacidad: 'Glosario de negocio acordado', preguntas: ['p91'], cumple: si('p91'),
    porQue: 'Sin definiciones comunes, agentes coordinados igual responden distinto.' },
  { id: 'N4-OBS-02', nivel: 4, dim: 'obs', capacidad: 'Respuestas con fuente', preguntas: ['p62'], cumple: si('p62'),
    porQue: 'Es lo que permite auditar y lo que genera confianza en las áreas.' },
  { id: 'N4-SEG-01', nivel: 4, dim: 'seg', capacidad: 'Auditoría central', preguntas: ['p64'], cumple: si('p64'),
    porQue: 'Centralizado se audita; disperso, no.' },
  { id: 'N4-COS-02', nivel: 4, dim: 'cos', capacidad: 'Ruteo que considera el costo', preguntas: ['p74'], cumple: si('p74'),
    porQue: 'No toda consulta necesita el modelo o el canal más caro.' },

  // Nivel 5 · Conocimiento integrado
  { id: 'N5-GOB-01', nivel: 5, dim: 'gob', capacidad: 'Equipo de knowledge engineering', preguntas: ['p81'], cumple: si('p81'),
    porQue: 'Ninguna área existente (datos, procesos, documental) tiene la vista completa por sí sola.' },
  { id: 'N5-GOB-02', nivel: 5, dim: 'gob', capacidad: 'Gobierno del modelo de conocimiento', preguntas: ['p82'], cumple: si('p82'),
    porQue: 'La ontología es un acuerdo entre áreas: necesita reglas para cambiar.' },
  { id: 'N5-ROL-01', nivel: 5, dim: 'rol', capacidad: 'Dueños de fuentes en la ontología', preguntas: ['p83'], cumple: si('p83'),
    porQue: 'El modelo tiene que reflejar lo que saben quienes son dueños de cada fuente.' },
  { id: 'N5-TEC-01', nivel: 5, dim: 'tec', capacidad: 'Capa ontológica en producción', preguntas: ['p78'], cumple: desde('p78', 3),
    porQue: 'Es la pieza que da un significado común a todos los agentes.' },
  { id: 'N5-OBS-02', nivel: 5, dim: 'obs', capacidad: 'Mejora continua a partir de los errores', preguntas: ['p65'], cumple: desde('p65', 1),
    porQue: 'El conocimiento crece con el uso, no solo con proyectos.' },
  { id: 'N5-SEG-01', nivel: 5, dim: 'seg', capacidad: 'Permisos por rol modelados y auditables', preguntas: ['p71'], cumple: si('p71'),
    porQue: 'El permiso deja de ser una regla dispersa en el código de cada agente.' },
  { id: 'N5-COS-01', nivel: 5, dim: 'cos', capacidad: 'Optimización continua de costo y valor (FinOps)', preguntas: ['p75'], cumple: si('p75'),
    porQue: 'En el nivel máximo, el costo se gestiona como una cartera y no agente por agente.' },
]

const DIM = Object.fromEntries(DIMENSIONES.map((d) => [d.id, d.nombre]))

/** Evalúa la matriz con las respuestas. Las preguntas sin responder cuentan como No. */
export function evaluarMatriz(respuestas) {
  const enProduccion = casosEnProduccion(respuestas)
  const maximo = nivelMaximo(enProduccion)
  const evaluados = ITEMS.map((it) => ({ ...it, cumplido: Boolean(it.cumple(respuestas)) }))

  let alcanzado = 0
  const niveles = NIVELES.map((n) => {
    const items = evaluados.filter((it) => it.nivel === n.nivel)
    const si = items.filter((it) => it.cumplido).length
    const pct = Math.round((si / items.length) * 100)
    const porItems = si / items.length >= UMBRAL
    const porAgentes = n.nivel <= maximo
    const cumplido = porItems && porAgentes && alcanzado === n.nivel - 1
    if (cumplido) alcanzado = n.nivel
    return { ...n, items: items.length, si, pct, cumplido, limitadoPorAgentes: porItems && !porAgentes }
  })

  const dimensiones = DIMENSIONES.map((d) => {
    const items = evaluados.filter((it) => it.dim === d.id)
    const porNivel = Object.fromEntries(NIVELES.map((n) => {
      const delNivel = items.filter((it) => it.nivel === n.nivel)
      return [n.nivel, delNivel.length ? { si: delNivel.filter((it) => it.cumplido).length, total: delNivel.length } : null]
    }))
    const si = items.filter((it) => it.cumplido).length
    return { ...d, porNivel, pct: Math.round((si / items.length) * 100) }
  })

  const siguiente = NIVELES.find((n) => n.nivel === alcanzado + 1) ?? null
  const pendientes = siguiente
    ? evaluados.filter((it) => it.nivel === siguiente.nivel && !it.cumplido)
      .map(({ id, capacidad, porQue, dim }) => ({ id, capacidad, porQue, dimension: DIM[dim] }))
    : []
  const fortalezas = evaluados.filter((it) => it.cumplido && it.nivel > alcanzado)
    .map(({ id, capacidad, nivel }) => ({ id, capacidad, nivel }))

  return {
    nivel: alcanzado ? NIVELES[alcanzado - 1] : SIN_NIVEL,
    niveles,
    dimensiones,
    siguiente,
    pendientes,
    fortalezas,
    casosEnProduccion: enProduccion,
    topeAgentes: maximo < 5 && niveles.some((n) => n.limitadoPorAgentes),
    umbral: UMBRAL,
  }
}
