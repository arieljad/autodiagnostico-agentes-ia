// Definición de la encuesta "Autodiagnóstico de madurez en agentes de IA".
// La comparten el front (para mostrarla) y el backend (para validar y puntuar).
//
// Origen: Microsoft Form original (84 preguntas) reorganizado según la "Matriz de
// madurez en agentes de IA - v3". Cambios respecto del Form:
// - Se quitaron las preguntas 42-44 (conocimiento previo) y se reemplazaron por
//   una introducción al alcance.
// - Se sumaron preguntas de la matriz que el Form no cubría (`numero: null`):
//   p85 (casos en producción, industria "Otra"), p86 (política de uso de IA),
//   p87 (inventario de agentes), p88-p91 (conocimiento y contexto) y
//   p92 (consentimiento) y p93 (otra área del líder).
// - Orden: primero el contexto (alcance, industria, casos de uso), después las
//   dimensiones de lo básico a lo avanzado, y al final los datos de contacto.
// - Punto de control (como en el Excel): si no hay casos de uso en piloto ni en
//   producción, se saltean las secciones que preguntan por agentes en operación.
//
// Tipos de pregunta: 'email' | 'texto' | 'textoLargo' | 'unica' | 'multiple'
// - `numero`: número de la pregunta en el Form original (null si es nueva).
// - `grilla`: preguntas Sí / No / No sé consecutivas se muestran juntas en una grilla.
// - `exclusiva` en una opción de 'multiple': al elegirla se desmarcan las demás.
// - `condicion` en una sección o pregunta: solo se muestra si se cumple (ver cumpleCondicion).
// - La madurez se calcula en matriz.js, que mapea respuestas a los ítems de la matriz v3.

const ESTADOS = ['En evaluación', 'En piloto', 'En producción', 'No evaluado']
const estadoCaso = (id, numero, texto) => ({ id, numero, tipo: 'unica', texto, opciones: ESTADOS.map((t) => ({ texto: t })), estadoCaso: true })

const SI_NO = ['Sí', 'No', 'No sé / No tengo el dato']
const siNo = (id, numero, texto, extra = {}) =>
  ({ id, numero, tipo: 'unica', requerida: true, texto, opciones: SI_NO.map((t) => ({ texto: t })), grilla: true, ...extra })
const opcionesDe = (...textos) => textos.map((texto) => ({ texto }))

// Las preguntas 79 y 80 (tecnología y dominios de la capa ontológica) solo
// aplican si la organización ya consideró una capa ontológica (pregunta 78).
const SIN_ONTOLOGIA = 'No, aún no se consideró'
const CON_ONTOLOGIA = { pregunta: 'p78', distintoDe: SIN_ONTOLOGIA }

// Las preguntas 46 (área del líder) y 47 (roles definidos) solo aplican si hay
// un liderazgo del desarrollo de agentes (pregunta 45).
const SIN_LIDERAZGO = 'No tenemos un liderazgo, cada agente fue construido por el área que lo impulsó'
const CON_LIDERAZGO = { pregunta: 'p45', distintoDe: SIN_LIDERAZGO }

// Punto de control: solo con agentes en piloto o en producción.
const CON_AGENTES = { conAgentes: true }

export const INDUSTRIAS = [
  'Servicios financieros',
  'Seguros',
  'Retail y Consumo Masivo',
  'Industria, Agroindustria y Manufactura',
  'Energía y Servicios Públicos',
  'Salud',
  'Telecomunicaciones y Medios',
  'Otra',
]

// Industria "Otra": los casos son texto libre, así que se pregunta el estado aparte.
export const ESTADO_OTRA = {
  'Ninguno en piloto ni en producción': { conAgentes: false, enProduccion: 0 },
  'Solo en piloto': { conAgentes: true, enProduccion: 0 },
  'Uno en producción': { conAgentes: true, enProduccion: 1 },
  'Dos o más en producción': { conAgentes: true, enProduccion: 2 },
}

const DESCRIPCION_CASOS =
  'Indicá en qué estado está cada caso de uso. Si todavía no tenés casos en piloto ni en producción, la encuesta se acorta: solo vamos a preguntarte por las bases.'

const casosDeUso = (industria, titulo, numeroInicial, casos, otrosLargo = false) => ({
  id: `casos-${numeroInicial}`,
  titulo: `Casos de uso de agentes · ${titulo}`,
  descripcion: DESCRIPCION_CASOS,
  condicion: { pregunta: 'p4', valor: industria },
  grupo: 'casos',
  preguntas: [
    ...casos.map((texto, i) => estadoCaso(`p${numeroInicial + i}`, numeroInicial + i, texto)),
    {
      id: `p${numeroInicial + casos.length}`,
      numero: numeroInicial + casos.length,
      tipo: otrosLargo ? 'textoLargo' : 'texto',
      texto: 'Otros casos de uso de agentes (describí y señalá su estado)',
    },
  ],
})

export const ENCUESTA = {
  titulo: 'Autodiagnóstico de madurez en agentes de IA',
  descripcion:
    'Este cuestionario evalúa el nivel de madurez de tu organización en la adopción y el gobierno de agentes de Inteligencia Artificial: gobierno y equipos, conocimiento y contexto, tecnología, observabilidad, seguridad, costos y conocimiento integrado.',
  privacidad:
    'La información se usa exclusivamente para generar indicadores y tendencias sectoriales de manera agregada y anónima, garantizando la confidencialidad de los datos de cada organización.',
  secciones: [
    // 1 · Contexto
    {
      id: 'alcance',
      titulo: 'Alcance del diagnóstico · La capa agéntica',
      descripcion:
        'Antes de empezar, alineamos qué vamos a evaluar. Este diagnóstico no mide el uso de la IA en general: se enfoca en la **capa agéntica** de tu organización.',
      intro: {
        // Párrafos; el texto entre ** ** se muestra resaltado.
        definicion: [
          'Un **agente de IA** combina modelos de lenguaje, acceso a datos y capacidad de acción para ejecutar tareas orientadas a un objetivo de negocio.',
          'La **capa agéntica** es el entorno donde múltiples agentes colaboran, comparten contexto y operan bajo mecanismos de gobierno, seguridad, auditoría y monitoreo que permiten controlar resultados, riesgos y costos.',
        ],
        enAlcance: [
          'Asistentes configurados con instrucciones propias y conectados a documentos o sistemas de la empresa',
          'Agentes que ejecutan tareas o transacciones, con o sin aprobación humana',
          'Orquestación y colaboración entre agentes, y su derivación a personas',
          'Cómo se gobiernan, observan, aseguran y miden estos agentes',
        ],
        fueraDeAlcance: [
          'El uso individual de ChatGPT, Copilot o Gemini para redactar, resumir o consultar',
          'Chatbots tradicionales con árboles de opciones o reglas fijas',
          'Modelos de IA o analítica que no actúan sobre procesos ni sistemas',
        ],
        cierre:
          'Respondé pensando en los agentes que tu organización ya tiene en piloto o en producción. Si todavía no hay ninguno, contestá según cómo está preparada la organización para incorporarlos.',
      },
      preguntas: [
        { id: 'p4', numero: 4, tipo: 'unica', texto: '¿A qué industria pertenece la empresa?', requerida: true,
          opciones: INDUSTRIAS.map((texto) => ({ texto })) },
        { id: 'p3', numero: 3, tipo: 'unica', texto: '¿En qué área de la organización trabajás?',
          ayuda: 'Elegí la que mejor describa tu rol. Nos ayuda a interpretar las respuestas según la perspectiva de cada área.',
          opciones: opcionesDe(
            'Dirección general / Gerencia',
            'Negocio / Operaciones',
            'Tecnología / Sistemas',
            'Datos y Analítica',
            'Procesos / Transformación digital',
            'Seguridad, Riesgo y Cumplimiento',
            'Otra') },
      ],
    },

    // 2 · Casos de uso (punto de partida y punto de control)
    casosDeUso('Servicios financieros', 'Servicios financieros', 5, [
      'Atención al cliente: consultas de cuentas, saldos, movimientos y tarjetas',
      'Reclamos y desconocimientos de consumos',
      'Denuncias de fraude',
      'Alta de clientes y servicios',
      'Cobranzas y recupero de mora',
    ], true),
    casosDeUso('Seguros', 'Seguros', 11, [
      'Atención al cliente: consultas de pólizas y coberturas',
      'Denuncia y seguimiento de siniestros',
      'Cotización, venta y emisión de pólizas',
      'Renovaciones, retención y cobranza de primas',
    ], true),
    casosDeUso('Retail y Consumo Masivo', 'Retail y Consumo Masivo', 16, [
      'Ventas: asistente de compra y recomendación de productos',
      'Posventa: seguimiento de pedidos y entregas',
      'Reclamos, cambios y devoluciones',
      'Gestión de stock y reposición',
    ]),
    casosDeUso('Industria, Agroindustria y Manufactura', 'Industria, Agroindustria y Manufactura', 21, [
      'Mantenimiento en planta: asistencia técnica, diagnóstico de fallas y consulta de equipos',
      'Control de calidad: detección de desvíos y registro de incidencias en producción',
      'Cadena de suministro: seguimiento de proveedores, órdenes de compra y reposición de insumos',
      'Seguridad e higiene: consulta de protocolos operativos, permisos de trabajo y reporte de incidentes',
    ]),
    casosDeUso('Energía y Servicios Públicos', 'Energía y Utilities', 26, [
      'Atención al cliente: consultas de facturación, reclamos y seguimiento de cortes o fallas de servicio',
      'Asistencia para técnicos: procedimientos de seguridad, mantenimiento y permisos',
      'Análisis de alertas, mantenimiento predictivo y gestión de incidencias',
      'Consulta de regulaciones del sector, auditorías y reportes',
    ]),
    casosDeUso('Salud', 'Salud', 31, [
      'Atención al paciente: gestión de turnos, derivaciones y respuestas a preguntas frecuentes',
      'Posatención: recordatorios de medicación, controles y acompañamiento al paciente',
      'Validación de trámites, reintegros y consultas sobre planes médicos',
      'Asistencia en documentación, resúmenes de consultas administrativas e historias clínicas',
    ]),
    casosDeUso('Telecomunicaciones y Medios', 'Telecomunicaciones y Medios', 36, [
      'Atención al cliente y soporte: resolución de fallas de servicio y conectividad, consultas de facturación y reclamos',
      'Retención, suscripciones y ventas: recomendación de planes o contenidos, gestión de bajas y ofertas personalizadas',
      'Producción, contenidos y pauta publicitaria: curación, resumen, adaptación de formatos, moderación de audiencias o gestión de campañas',
      'Operaciones técnicas y emisión: monitoreo de red/señal, análisis de alertas e incidencias en campo o en transmisión',
    ]),
    {
      id: 'casos-41',
      titulo: 'Casos de uso de agentes · Otra industria',
      descripcion: DESCRIPCION_CASOS,
      condicion: { pregunta: 'p4', valor: 'Otra' },
      grupo: 'casos',
      preguntas: [
        { id: 'p41', numero: 41, tipo: 'textoLargo',
          texto: 'Describí los casos de uso de agentes que tienen y su estado (ej. reclamos, seguimiento de logística, consulta de tickets)' },
        { id: 'p85', numero: null, tipo: 'unica', requerida: true, texto: '¿Cuántos de esos casos están en piloto o en producción?',
          opciones: Object.keys(ESTADO_OTRA).map((texto) => ({ texto })) },
      ],
    },

    // 3 · Gobierno y equipos
    {
      id: 'gobierno',
      dimension: true,
      titulo: 'Gobierno y equipos',
      descripcion: 'Quién lidera los agentes, con qué reglas y con qué roles: las bases para que la adopción no dependa de cada área por separado.',
      preguntas: [
        { id: 'p45', numero: 45, tipo: 'unica', requerida: true, texto: 'A nivel organizacional, ¿quién lidera el desarrollo de los agentes?',
          opciones: opcionesDe(
            SIN_LIDERAZGO,
            'Tenemos un líder y todo nuevo desarrollo es coordinado por esta persona',
            'Tenemos un área de gobierno de desarrollo de agentes') },
        { id: 'p46', numero: 46, tipo: 'unica', condicion: CON_LIDERAZGO, texto: '¿A qué área pertenece el líder o grupo encargado?',
          opciones: opcionesDe('Tecnología / Sistemas (CIO, CTO)', 'Datos y analítica (CDO)', 'Transformación digital / Innovación',
            'Centro de excelencia de IA', 'Arquitectura empresarial', 'Otra área') },
        { id: 'p93', numero: null, tipo: 'texto', condicion: { pregunta: 'p46', valor: 'Otra área' }, texto: '¿Cuál?',
          ayuda: 'Por ejemplo: Operaciones, Atención al cliente, Riesgos.' },
        { id: 'p47', numero: 47, tipo: 'multiple', requerida: true, condicion: CON_LIDERAZGO,
          texto: 'Además del líder o área de desarrollo, ¿cuáles de estos roles están formalmente definidos para gestionar las iniciativas de IA?',
          opciones: [
            { texto: 'No tenemos formalmente definidos los roles para el gobierno de agentes', exclusiva: true },
            { texto: 'Dueño de agente: define el objetivo de negocio, asegura la adopción y mide los resultados del agente' },
            { texto: 'Responsable técnico: mantenimiento, integraciones y soporte operativo de la herramienta' },
            { texto: 'Responsable de contenido: asegura que los documentos e información que consume el agente estén actualizados y sean correctos' },
            { texto: 'Referente de riesgos: evalúa la seguridad, la privacidad de los datos y el cumplimiento normativo o ético' },
            { texto: 'Equipo de arquitectura agéntica: define las reglas tecnológicas, los estándares y cómo se conectan los agentes entre sí' },
          ] },
        siNo('p86', null, '¿Hay una política publicada de uso aceptable de IA generativa?'),
        siNo('p69', 69, '¿Hay lineamientos sobre qué datos y fuentes de conocimiento pueden usarse con IA?',
          { ayuda: 'Por ejemplo: datos confidenciales, datos privados de clientes, datos de uso interno.' }),
        { id: 'p76', numero: 76, tipo: 'unica', requerida: true, texto: '¿Se estimó el costo y el beneficio de los casos de uso seleccionados?',
          opciones: opcionesDe('Sí', 'Se estimó solo para algunos casos', 'No', 'No sé / No tengo el dato') },
        siNo('p87', null, '¿Hay un inventario central y actualizado de todos los agentes (dueño, alcance, proveedor, estado)?', { condicion: CON_AGENTES }),
        siNo('p49', 49, '¿Los equipos que trabajan con agentes reciben capacitaciones recurrentes sobre su uso, sus límites y cómo escalar?',
          { condicion: CON_AGENTES }),
        { id: 'p48', numero: 48, tipo: 'unica', requerida: true, texto: '¿Cómo se toman las decisiones sobre los agentes de IA?',
          opciones: opcionesDe(
            'No hay una instancia formal, cada área decide por su cuenta',
            'Hay reuniones periódicas entre las áreas involucradas, pero sin alcance formal ni actas',
            'Hay un comité con alcance definido y actas de sus decisiones',
            'Hay un comité con alcance definido, actas y políticas publicadas que aplican a toda la organización') },
      ],
    },

    // 4 · Conocimiento y contexto
    {
      id: 'conocimiento',
      dimension: true,
      titulo: 'Conocimiento y contexto',
      descripcion: 'De dónde sacan los agentes lo que saben y quién lo mantiene al día: la base de una capa de contexto común.',
      preguntas: [
        siNo('p88', null, '¿El conocimiento que usa cada agente (documentos, preguntas frecuentes, datos) está identificado y tiene un responsable de mantenerlo actualizado?',
          { condicion: CON_AGENTES }),
        siNo('p89', null, '¿Están identificadas las fuentes de conocimiento comunes (procesos, normativas, documentos, datos transaccionales), cada una con su dueño?'),
        siNo('p91', null, '¿Las definiciones de negocio clave (cliente, producto, reclamo, etc.) están acordadas entre áreas en un glosario común?'),
        siNo('p90', null, '¿Hay una capa de contexto común a la que acceden todos los agentes, en lugar de que cada uno copie el conocimiento?',
          { condicion: CON_AGENTES }),
      ],
    },

    // 5 · Tecnología y arquitectura (desde acá, solo con agentes en piloto o producción)
    {
      id: 'tecnologia',
      dimension: true,
      condicion: CON_AGENTES,
      titulo: 'Tecnología y arquitectura',
      descripcion: 'Cómo actúan los agentes, cómo se conectan a las fuentes de la empresa y cómo colaboran entre sí.',
      preguntas: [
        { id: 'p56', numero: 56, tipo: 'unica', requerida: true, texto: 'El agente más avanzado, ¿qué nivel de acción tiene actualmente?',
          opciones: opcionesDe(
            'Solo consulta: responde preguntas, busca información o redacta textos, sin modificar nada en otros sistemas',
            'Acciones con aprobación humana: prepara una tarea o transacción, pero una persona la confirma antes de ejecutarse',
            'Transacciones simples: ejecuta acciones puntuales de forma autónoma en un sistema (ej. crear un ticket, agendar una reunión o actualizar un registro)',
            'Procesos completos: resuelve flujos complejos interactuando con varios sistemas sin intervención humana (ej. validar un reclamo, emitir un reintegro)') },
        { id: 'p57', numero: 57, tipo: 'unica', requerida: true,
          texto: '¿Cómo se implementan y gestionan las conexiones entre los agentes de IA y las fuentes de conocimiento internas?',
          opciones: opcionesDe(
            'No hay conexiones con fuentes internas; los agentes usan solo información pública o provista por el usuario',
            'Cada agente implementa sus propias integraciones, desarrolladas específicamente para cada caso de uso',
            'Hay conectores reutilizables para algunas fuentes, pero su gestión y reutilización no están estandarizadas',
            'La organización tiene conectores y servicios de acceso a datos estandarizados, reutilizados por varios agentes',
            'Hay un catálogo centralizado de conectores y herramientas (ej. servidores MCP) que los agentes pueden descubrir, consumir y gobernar de forma consistente') },
        { id: 'p58', numero: 58, tipo: 'unica', requerida: true, texto: 'Al incluir un nuevo agente, ¿evaluaron la forma de compartir información entre distintos agentes?',
          opciones: opcionesDe(
            'No, el contexto de conversación no se comparte',
            'La información se comparte, pero con procesos manuales o desarrollos propios',
            'Sí, ya usamos protocolos abiertos como A2A') },
        siNo('p59', 59, '¿Hay un orquestador o puerta de entrada que deriva cada consulta según la intención y no según el canal?'),
      ],
    },

    // 6 · Operación: observabilidad y seguridad
    {
      id: 'operacion',
      dimension: true,
      condicion: CON_AGENTES,
      titulo: 'Operación: observabilidad y seguridad',
      descripcion: 'Cómo se controla lo que hacen los agentes en el día a día: registro, calidad, auditoría y controles de seguridad.',
      preguntas: [
        siNo('p61', 61, '¿Se registran las conversaciones o interacciones de cada agente?'),
        siNo('p63', 63, '¿Se mide al menos un indicador de calidad por agente (resolución, satisfacción, derivación a humano)?'),
        siNo('p68', 68, '¿Cada agente pasa una revisión de seguridad y privacidad antes de salir a producción?'),
        siNo('p66', 66, '¿Las respuestas de los agentes se evalúan periódicamente con un conjunto de casos de prueba?'),
        siNo('p67', 67, '¿Hay un tablero común de uso y calidad de todos los agentes?'),
        siNo('p62', 62, '¿Las respuestas de los agentes indican la fuente en la que se basan?'),
        siNo('p64', 64, '¿Hay una auditoría central de quién preguntó, qué se consultó y qué se respondió, para todos los agentes?'),
        siNo('p71', 71, '¿Lo que puede ver cada rol está modelado y es auditable?'),
        { id: 'p60', numero: 60, tipo: 'unica', requerida: true, texto: '¿Los agentes pueden derivar a una persona cuando no pueden resolver o el usuario lo pide?',
          opciones: opcionesDe('Sí, en todos los casos', 'Sí, en algunos agentes', 'No, en ninguno de los agentes') },
        { id: 'p70', numero: 70, tipo: 'unica', requerida: true,
          texto: '¿Hay controles comunes sobre lo que entra y sale de los agentes (datos personales, contenido inadecuado, inyección de instrucciones)?',
          opciones: opcionesDe('Sí, en todos los agentes', 'Sí, en algunos agentes', 'No') },
        { id: 'p65', numero: 65, tipo: 'unica', requerida: true, texto: '¿Cómo se gestionan las preguntas sin respuesta y los errores detectados para mejorar la IA?',
          opciones: opcionesDe(
            'Los errores se corrigen de manera espontánea, generalmente por el usuario responsable del agente, sin un proceso establecido',
            'Hay una rutina formal donde un equipo analiza los registros de fallos y actualiza el conocimiento de la IA',
            'El sistema identifica, clasifica y envía automáticamente los fallos o vacíos de información al equipo responsable') },
      ],
    },

    // 7 · Costos y valor
    {
      id: 'costos',
      dimension: true,
      condicion: CON_AGENTES,
      titulo: 'Costos y valor',
      descripcion: 'Si la organización conoce cuánto le cuestan sus agentes y si mide el valor que generan.',
      preguntas: [
        siNo('p72', 72, '¿Se conoce el costo mensual de cada agente (licencias, consumo de modelos, canal)?'),
        siNo('p77', 77, '¿Cada agente tiene un presupuesto asignado de consumo de tokens y alertas cuando el consumo se desvía?'),
        siNo('p73', 73, '¿Se mide el valor generado por cada agente (ahorro, resolución, ventas) frente a su costo?'),
        siNo('p74', 74, '¿Pueden cambiar de agente según la relación costo-beneficio, teniendo en cuenta el canal, el tipo de consulta o el cliente?'),
        siNo('p75', 75, '¿Hay una práctica de optimización continua de costo y valor de la IA (FinOps), con decisiones por dominio basadas en métricas?'),
      ],
    },

    // 8 · Capa ontológica
    {
      id: 'ontologia',
      dimension: true,
      condicion: CON_AGENTES,
      titulo: 'Capa ontológica y conocimiento integrado',
      descripcion:
        'Una capa ontológica funciona como un "diccionario central" de la empresa: conoce los datos, pero también los procesos, normativas, formularios y la documentación formal, y da a todos los agentes un significado común y explicable.',
      preguntas: [
        { id: 'p78', numero: 78, tipo: 'unica', requerida: true,
          texto: '¿Hay una capa ontológica (por ejemplo, un grafo de conocimiento) en producción que consultan los agentes?',
          opciones: opcionesDe(
            SIN_ONTOLOGIA,
            'Se está evaluando o diseñando conceptualmente, pero no hay desarrollos técnicos',
            'Se está construyendo la estructura de conocimiento, pero aún no está operativa',
            'Sí, la capa está activa y los agentes la consultan regularmente') },
        { id: 'p79', numero: 79, tipo: 'unica', condicion: CON_ONTOLOGIA,
          texto: '¿Con qué tecnología está implementada (o se está implementando) la capa ontológica?',
          opciones: opcionesDe('Neo4j', 'Google Spanner Graph', 'Amazon Neptune', 'Azure Cosmos DB (Gremlin)', 'Palantir Foundry Ontology', 'Ontotext GraphDB',
            'Stardog', 'TigerGraph', 'Protégé (modelado)', 'Snowflake Business Ontology', 'Databricks', 'Desarrollo propio') },
        { id: 'p80', numero: 80, tipo: 'texto', requerida: true, condicion: CON_ONTOLOGIA, texto: '¿Sobre qué dominios del negocio hace foco esta capa ontológica?',
          ayuda: 'Por ejemplo: Recursos Humanos, Atención al Cliente, Legales, Operaciones, Ventas.' },
        { id: 'p81', numero: 81, tipo: 'unica', requerida: true,
          texto: '¿Cuentan con un equipo dedicado a Knowledge Engineering (especialistas que organizan, conectan y estructuran la información de la empresa para que la IA la entienda)?',
          opciones: opcionesDe('Sí', 'Estamos evaluando su incorporación', 'No') },
        siNo('p82', 82, '¿Hay un proceso para acordar, versionar y aprobar las definiciones del modelo de conocimiento?'),
        siNo('p83', 83, '¿Los dueños de procesos, normativas y datos participan formalmente en el mantenimiento de la ontología?'),
      ],
    },

    // 9 · Tu stack (informativo y opcional)
    {
      id: 'stack',
      condicion: CON_AGENTES,
      titulo: 'Tu stack de IA',
      descripcion: 'Opcional. No cambia tu nivel, pero nos ayuda a preparar la reunión.',
      preguntas: [
        { id: 'p50', numero: 50, tipo: 'unica', texto: '¿Cuál es la modalidad principal en producción?',
          opciones: opcionesDe(
            'Servicios públicos en internet (ej. OpenAI, Gemini, Claude)',
            'Espacio privado en nube para la empresa (ej. tenant dedicado de OpenAI)',
            'Local en servidores físicos de la empresa (ej. Ollama, DeepSeek, Qwen)',
            'Incorporada dentro de un software adquirido (ej. Agentforce de Salesforce, Joule de SAP)') },
        { id: 'p51', numero: 51, tipo: 'unica', texto: '¿Cuál es el motivo principal de esa elección?',
          opciones: opcionesDe('Privacidad o regulación de datos', 'Calidad de los modelos', 'Costo', 'Latencia', 'Integración con proveedores actuales') },
        { id: 'p52', numero: 52, tipo: 'multiple', texto: '¿Qué herramientas, entornos de IA o frameworks de desarrollo usan?',
          opciones: opcionesDe('Microsoft Copilot Studio / Foundry', 'Google Vertex AI / Agent Builder (ADK) / Gemini Enterprise', 'Amazon Bedrock AgentCore',
            'IBM watsonx Orchestrate', 'UiPath', 'n8n', 'LangGraph / LangChain', 'CrewAI') },
        { id: 'p53', numero: 53, tipo: 'multiple', texto: '¿Qué motores de IA pública usan habitualmente?',
          opciones: opcionesDe('Claude (Anthropic)', 'GPT (OpenAI)', 'Gemini (Google)') },
        { id: 'p54', numero: 54, tipo: 'multiple',
          texto: '¿Qué modelos abiertos de IA, instalados en infraestructura propia o red privada, usan habitualmente?',
          opciones: [...opcionesDe('Llama (Meta)', 'DeepSeek', 'Qwen (Alibaba)', 'Mistral', 'Gemma (Google)', 'gpt-oss (OpenAI)'),
            { texto: 'Ninguno', exclusiva: true }] },
        { id: 'p55', numero: 55, tipo: 'multiple', texto: '¿Qué motores de IA incluidos en plataformas de proveedor usan?',
          opciones: [...opcionesDe('Agentforce (Salesforce)', 'Joule (SAP)', 'Genesys Cloud AI (Genesys)', 'AI Agents / Now Assist (ServiceNow)',
            'Oracle AI Agent Studio (Oracle Fusion Cloud Applications)'), { texto: 'Ninguno', exclusiva: true }] },
      ],
    },

    // 10 · Contacto
    {
      id: 'contacto',
      titulo: 'Último paso: tus datos',
      descripcion: 'Para enviarte el diagnóstico y coordinar la reunión en la que lo revisamos juntos.',
      preguntas: [
        { id: 'p1', numero: 1, tipo: 'email', texto: 'Correo electrónico', requerida: true },
        { id: 'p2', numero: 2, tipo: 'texto', texto: 'Empresa / Organización',
          ayuda: 'Solo se usa para entender el segmento y comparar resultados entre organizaciones del mismo tipo.' },
        { id: 'p84', numero: 84, tipo: 'textoLargo', texto: 'Comentarios, evidencias o aclaraciones sobre las respuestas (opcional)' },
        { id: 'p92', numero: null, tipo: 'multiple', requerida: true, texto: 'Consentimiento',
          opciones: [{ texto: 'Acepto que Paradigma use estos datos para contactarme y, de forma agregada y anónima, para indicadores sectoriales.' }] },
      ],
    },
  ],
}

/** ¿La organización tiene casos de uso de agentes en piloto o en producción? (punto de control) */
export function tieneAgentes(respuestas) {
  if (respuestas.p4 === 'Otra') return Boolean(ESTADO_OTRA[respuestas.p85]?.conAgentes)
  const seccion = ENCUESTA.secciones.find((s) => s.grupo === 'casos' && s.condicion.valor === respuestas.p4)
  return Boolean(seccion?.preguntas.some((p) => p.estadoCaso && ['En piloto', 'En producción'].includes(respuestas[p.id])))
}

/**
 * Evalúa una condición de sección o de pregunta:
 * - { pregunta, valor }: la respuesta tiene que ser ese valor.
 * - { pregunta, distintoDe }: la pregunta tiene que estar respondida con otro valor.
 * - { conAgentes: true }: hay casos de uso en piloto o en producción.
 */
export function cumpleCondicion(condicion, respuestas) {
  if (!condicion) return true
  if (condicion.conAgentes) return tieneAgentes(respuestas)
  const v = respuestas[condicion.pregunta]
  if ('valor' in condicion) return v === condicion.valor
  if ('distintoDe' in condicion) return v !== undefined && v !== null && v !== '' && v !== condicion.distintoDe
  return true
}

/**
 * Secciones visibles según las respuestas (ramificación por industria y punto de
 * control), cada una con solo sus preguntas visibles.
 */
export function seccionesVisibles(respuestas) {
  return ENCUESTA.secciones
    .filter((s) => cumpleCondicion(s.condicion, respuestas))
    .map((s) => ({ ...s, preguntas: s.preguntas.filter((p) => cumpleCondicion(p.condicion, respuestas)) }))
}

export function todasLasPreguntas() {
  return ENCUESTA.secciones.flatMap((s) => s.preguntas.map((p) => ({ ...p, seccion: s })))
}
