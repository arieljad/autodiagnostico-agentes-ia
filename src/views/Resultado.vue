<script setup>
import { computed, onMounted, ref } from 'vue'
import LogoParadigma from '../components/LogoParadigma.vue'

const props = defineProps({ id: String })
const datos = ref(null)
const error = ref('')

onMounted(async () => {
  const resp = await fetch(`/api/respuestas/${props.id}/resultado`)
  if (!resp.ok) return (error.value = 'No encontramos este diagnóstico.')
  datos.value = await resp.json()
})

const r = computed(() => datos.value?.resultado)
// Puntaje ponderado de 0 a 5 (los diagnósticos guardados antes del puntaje usan el nivel).
const puntaje = computed(() => r.value?.puntaje ?? r.value?.nivel.nivel ?? 0)
const puntajeTexto = computed(() => puntaje.value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
const proximo = computed(() => r.value?.niveles.find((n) => n.nivel === r.value.nivel.nivel + 1) ?? null)

// Link para agendar (Microsoft Bookings, Calendly, etc.). Si no está configurado,
// abre un correo con el asunto ya armado.
const agenda = computed(() => {
  if (import.meta.env.VITE_AGENDA_URL) return import.meta.env.VITE_AGENDA_URL
  const asunto = `Reunión · Autodiagnóstico de agentes de IA${datos.value?.empresa ? ` · ${datos.value.empresa}` : ''}`
  const cuerpo = `Hola, completé el autodiagnóstico (puntaje ${puntajeTexto.value} de 5 · nivel ${r.value?.nivel.nivel} · ${r.value?.nivel.nombre}) y me gustaría agendar una reunión para conocer el informe completo.\n\n${location.href}`
  return `mailto:contacto@paradigma.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
})

// Anillo con un segmento por nivel.
const SEGMENTOS = 5
const RADIO = 72
const circ = 2 * Math.PI * RADIO
const largo = circ / SEGMENTOS - 6
// Parte llena del segmento i (1 a 5) según el puntaje.
const lleno = (i) => Math.min(Math.max(puntaje.value - (i - 1), 0), 1) * largo

// Contenido de muestra para la vista previa difuminada: es genérico a propósito,
// el informe real no se envía al navegador.
const MUESTRA_CARDS = [
  ['Gobierno y organización', 'Capacidad para el próximo nivel', 'Por qué importa en tu etapa y cómo empezar a trabajarla.'],
  ['Tecnología y arquitectura', 'Capacidad para el próximo nivel', 'Por qué importa en tu etapa y cómo empezar a trabajarla.'],
  ['Observabilidad y trazabilidad', 'Capacidad para el próximo nivel', 'Por qué importa en tu etapa y cómo empezar a trabajarla.'],
]
const MUESTRA_MATRIZ = [
  ['si', 'si', 'parcial', 'no', 'no'], ['si', 'parcial', 'parcial', 'no', 'no'], ['si', 'si', 'no', 'parcial', 'no'],
  ['si', 'parcial', 'no', 'no', 'no'], ['si', 'si', 'parcial', 'no', 'parcial'],
  ['parcial', 'si', 'no', 'no', 'no'], ['si', 'parcial', 'parcial', 'parcial', 'no'],
]
const INCLUYE = [
  'Cómo te comparás con el promedio de tu industria y de organizaciones de tu tamaño',
  'Tu cumplimiento en cada dimensión: gobierno, equipos, tecnología, conocimiento, observabilidad, seguridad y costos',
  'Las capacidades que te faltan para el próximo nivel y por dónde empezar',
  'Iniciativas concretas para fortalecer tu capa agéntica, alineadas con los objetivos estratégicos de tu empresa',
]
</script>

<template>
  <main v-if="error" class="contenedor vacio">
    <LogoParadigma :alto="30" />
    <h1>{{ error }}</h1>
    <RouterLink to="/" class="boton">Volver al inicio</RouterLink>
  </main>

  <main v-else-if="r" class="resultado">
    <section class="cabecera">
      <div class="contenedor"><LogoParadigma claro :alto="30" class="logo-cabecera" /></div>
      <div class="contenedor grilla">
        <div>
          <span class="etiqueta">Tu diagnóstico{{ datos.empresa ? ` · ${datos.empresa}` : '' }}</span>
          <h1 v-if="r.nivel.nivel">Nivel {{ r.nivel.nivel }} · <em>{{ r.nivel.nombre }}</em></h1>
          <h1 v-else><em>{{ r.nivel.nombre }}</em></h1>
          <p>{{ r.nivel.descripcion }}</p>
          <p v-if="proximo" class="proximo">Próximo nivel: <strong>{{ proximo.nombre }}</strong></p>
          <p v-if="r.topeAgentes" class="aviso">
            Tus respuestas cumplen capacidades de niveles más altos, pero el nivel también depende de cuántos casos de uso
            tenés en producción ({{ r.casosEnProduccion === 0 ? 'ninguno' : r.casosEnProduccion === 1 ? 'uno' : r.casosEnProduccion }}).
          </p>
          <a class="boton" :href="agenda" target="_blank" rel="noopener">Agendar una reunión →</a>
        </div>
        <div class="anillo" :aria-label="`Puntaje ${puntajeTexto} de 5`">
          <svg viewBox="0 0 180 180">
            <template v-for="i in SEGMENTOS" :key="i">
              <circle
                class="seg-off" cx="90" cy="90" :r="RADIO"
                :stroke-dasharray="`${largo} ${circ - largo}`" :stroke-dashoffset="-(i - 1) * (circ / SEGMENTOS)"
              />
              <circle
                v-if="lleno(i) > 0" class="seg-on" cx="90" cy="90" :r="RADIO"
                :stroke-dasharray="`${lleno(i)} ${circ - lleno(i)}`" :stroke-dashoffset="-(i - 1) * (circ / SEGMENTOS)"
              />
            </template>
          </svg>
          <div class="numero"><strong>{{ puntajeTexto }}</strong><span>de 5</span></div>
        </div>
      </div>
    </section>

    <section class="contenedor cuerpo">
      <h2 class="subtitulo">Tu escalera de madurez</h2>
      <p class="nota">
        Cada nivel suma a tu puntaje según cuántas de sus capacidades cumplís. Los niveles son acumulativos: uno
        nunca suma más que el anterior.
      </p>
      <ol class="escalera">
        <li v-for="n in r.niveles" :key="n.nivel" :class="{ alcanzado: n.cumplido }">
          <span class="esc-num">{{ n.nivel }}</span>
          <h3>{{ n.nombre }}</h3>
          <div class="barra"><div :style="{ width: `${n.pct}%` }"></div></div>
        </li>
      </ol>

      <div class="informe">
        <div class="vista-previa" aria-hidden="true">
          <h2 class="subtitulo">Para llegar al próximo nivel</h2>
          <div class="cards">
            <article v-for="([dim, titulo, texto], i) in MUESTRA_CARDS" :key="i" class="card">
              <span class="dim">{{ dim }}</span>
              <h3>{{ titulo }}</h3>
              <p>{{ texto }}</p>
            </article>
          </div>
          <h2 class="subtitulo">Cumplimiento por dimensión y nivel</h2>
          <div class="matriz">
            <div v-for="(fila, i) in MUESTRA_MATRIZ" :key="i" class="fila">
              <span class="etiqueta-fila"></span>
              <span v-for="(c, j) in fila" :key="j" :class="['celda', c]"></span>
            </div>
          </div>
        </div>

        <div class="candado">
          <div class="icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <h2>Llevemos tu diagnóstico un paso más allá</h2>
          <p>
            Si te interesa, agendamos una reunión y preparamos un informe hecho a la medida de tu organización.
            Lo revisamos juntos e incluye:
          </p>
          <ul>
            <li v-for="t in INCLUYE" :key="t">{{ t }}</li>
          </ul>
          <a class="boton" :href="agenda" target="_blank" rel="noopener">Agendar una reunión →</a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.vacio { padding: 120px 0; display: grid; gap: 24px; justify-items: start; }
.cabecera { background: var(--oscuro); color: var(--sobre-oscuro); border-bottom: 1px solid var(--borde-oscuro); padding: 32px 0 56px; }
.logo-cabecera { display: flex; width: fit-content; margin-bottom: 32px; }
.grilla { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: center; }
h1 { font-size: clamp(34px, 5vw, 52px); margin: 12px 0; font-weight: 800; letter-spacing: -.02em; }
h1 em { font-style: normal; color: var(--naranja); }
.cabecera p { color: var(--sobre-oscuro-2); font-size: 17px; max-width: 600px; margin: 0 0 20px; }
.cabecera .proximo { font-size: 15px; color: var(--sobre-oscuro-3); margin-top: -8px; }
.cabecera .proximo strong { color: var(--sobre-oscuro); }
.cabecera .aviso { font-size: 14px; color: #f3c79c; }
.anillo { position: relative; width: 210px; height: 210px; }
.anillo svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.anillo circle { fill: none; stroke-width: 16; }
.seg-off { stroke: rgb(255 255 255 / .1); }
.seg-on { stroke: var(--naranja); }
.numero { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.numero strong { font-size: 56px; line-height: 1; font-variant-numeric: tabular-nums; }
.numero span { color: var(--sobre-oscuro-3); font-size: 14px; }

.cuerpo { padding: 20px 0 80px; }
.subtitulo { font-size: 24px; margin: 40px 0 8px; }
.nota { color: var(--tinta-2); margin: 0 0 18px; font-size: 15px; }

.escalera { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; align-items: end; }
.escalera li {
  display: flex; flex-direction: column; justify-content: flex-end;
  background: var(--tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 16px 16px 20px;
}
.escalera li:nth-child(1) { min-height: 140px; } .escalera li:nth-child(2) { min-height: 160px; } .escalera li:nth-child(3) { min-height: 180px; }
.escalera li:nth-child(4) { min-height: 200px; } .escalera li:nth-child(5) { min-height: 220px; }
.esc-num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--relleno); font-weight: 800; margin-bottom: auto; }
.escalera h3 { font-size: 16px; margin: 14px 0 10px; }
.alcanzado { background: var(--naranja-suave); border-color: var(--naranja-borde); }
.alcanzado .esc-num { background: var(--naranja); color: #fff; }
.barra { height: 8px; border-radius: 999px; background: var(--relleno); overflow: hidden; }
.barra div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--rojo), var(--naranja)); }

/* Informe bloqueado: vista previa difuminada + tarjeta para agendar. */
.informe { position: relative; margin-top: 24px; }
.vista-previa { filter: blur(7px); opacity: .7; pointer-events: none; user-select: none; padding-bottom: 40px; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.card { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 18px 20px; }
.card .dim { font-size: 12px; font-weight: 700; color: var(--naranja); text-transform: uppercase; letter-spacing: .06em; }
.card h3 { font-size: 17px; margin: 6px 0; }
.card p { margin: 0; color: var(--tinta-2); font-size: 15px; }
.matriz { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.fila { display: grid; grid-template-columns: 2fr repeat(5, 1fr); gap: 6px; }
.etiqueta-fila { height: 34px; border-radius: 8px; background: var(--borde-fuerte); }
.celda { height: 34px; border-radius: 8px; }
.celda.si { background: var(--naranja); } .celda.parcial { background: rgb(255 122 0 / .4); } .celda.no { background: var(--relleno); }

.candado {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(560px, 100% - 32px); background: var(--oscuro); color: var(--sobre-oscuro); border: 1px solid var(--borde-oscuro); border-radius: 18px;
  padding: 32px 36px; box-shadow: 0 24px 60px rgb(16 32 56 / .35); text-align: left;
}
.icono { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: rgb(255 122 0 / .16); color: var(--naranja); margin-bottom: 16px; }
.candado h2 { font-size: 26px; margin: 0 0 8px; }
.candado p { color: var(--sobre-oscuro-2); margin: 0 0 12px; }
.candado ul { margin: 0 0 24px; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
.candado li { position: relative; padding-left: 26px; color: var(--sobre-oscuro); font-size: 15px; line-height: 1.45; }
.candado li::before {
  content: '✓'; position: absolute; left: 0; top: 1px; width: 18px; height: 18px; border-radius: 50%;
  display: grid; place-items: center; font-size: 11px; font-weight: 800; background: var(--naranja); color: #fff;
}

@media (max-width: 860px) {
  .grilla { grid-template-columns: 1fr; }
  .anillo { justify-self: start; }
  .escalera { grid-template-columns: 1fr; }
  .escalera li { min-height: 0 !important; }
  .vista-previa { display: none; }
  .candado { position: static; transform: none; width: 100%; margin-top: 8px; }
}
</style>
