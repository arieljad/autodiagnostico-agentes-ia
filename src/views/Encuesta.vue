<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Pregunta from '../components/Pregunta.vue'
import GrillaSiNo from '../components/GrillaSiNo.vue'
import LogoParadigma from '../components/LogoParadigma.vue'
import { useEncuestaStore } from '../stores/encuesta.js'
import { validarSeccion } from '../encuesta/puntaje.js'

const store = useEncuestaStore()
const router = useRouter()
const errores = ref({})
const enviando = ref(false)
const errorEnvio = ref('')

// Divide un texto en tramos normales y resaltados (los que van entre ** **).
const partes = (texto) => texto.split(/\*\*(.+?)\*\*/).map((t, i) => ({ texto: t, fuerte: i % 2 === 1 })).filter((t) => t.texto)

const seccion = computed(() => store.seccionActual)
const total = computed(() => store.secciones.length)
const esUltima = computed(() => store.paso >= total.value - 1)

// Agrupa preguntas Sí/No consecutivas (`grilla`) en una sola grilla; si hay una
// sola, se muestra como pregunta normal.
const bloques = computed(() => {
  const salida = []
  for (const p of seccion.value.preguntas) {
    const ultimo = salida.at(-1)
    if (p.grilla && ultimo?.grilla) ultimo.preguntas.push(p)
    else if (p.grilla) salida.push({ grilla: true, clave: p.id, preguntas: [p] })
    else salida.push({ grilla: false, clave: p.id, pregunta: p })
  }
  return salida.map((b) => (b.grilla && b.preguntas.length === 1 ? { grilla: false, clave: b.clave, pregunta: b.preguntas[0] } : b))
})

watch(() => store.paso, () => { errores.value = {} })

async function mostrarPrimerError() {
  await nextTick()
  const id = Object.keys(errores.value)[0]
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function siguiente() {
  errores.value = validarSeccion(seccion.value, store.respuestas)
  if (Object.keys(errores.value).length) return mostrarPrimerError()
  if (!esUltima.value) {
    store.paso++
    return window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  enviando.value = true
  errorEnvio.value = ''
  try {
    const { id } = await store.enviar()
    store.reiniciar()
    router.push({ name: 'resultado', params: { id } })
  } catch (e) {
    errorEnvio.value = e.message
  } finally {
    enviando.value = false
  }
}

function anterior() {
  if (store.paso > 0) store.paso--
  else router.push({ name: 'inicio' })
}
</script>

<template>
  <div class="pagina">
    <header class="barra">
      <div class="contenedor fila">
        <div class="izquierda">
          <LogoParadigma :alto="24" />
          <span class="separador" aria-hidden="true"></span>
          <RouterLink to="/" class="marca">Autodiagnóstico <strong>Agentes de IA</strong></RouterLink>
        </div>
        <span class="paso">Paso {{ store.paso + 1 }} de {{ total }}</span>
      </div>
      <div class="progreso" role="progressbar" :aria-valuenow="store.progreso" aria-valuemin="0" aria-valuemax="100">
        <div :style="{ width: `${((store.paso + 1) / total) * 100}%` }"></div>
      </div>
    </header>

    <main class="contenedor cuerpo">
      <Transition name="deslizar" mode="out-in">
        <section :key="seccion.id">
          <span class="etiqueta">{{ seccion.dimension ? 'Dimensión' : seccion.id === 'contacto' ? 'Para terminar' : 'Contexto' }}</span>
          <h1>{{ seccion.titulo }}</h1>
          <p v-if="seccion.descripcion" class="descripcion">
            <template v-for="(t, i) in partes(seccion.descripcion)" :key="i"><strong v-if="t.fuerte">{{ t.texto }}</strong><template v-else>{{ t.texto }}</template></template>
          </p>

          <div v-if="seccion.intro" class="intro">
            <div class="definicion">
              <span class="etiqueta">¿Qué entendemos por agente de IA?</span>
              <p v-for="parrafo in seccion.intro.definicion" :key="parrafo">
                <template v-for="(t, i) in partes(parrafo)" :key="i"><strong v-if="t.fuerte">{{ t.texto }}</strong><template v-else>{{ t.texto }}</template></template>
              </p>
            </div>
            <div class="alcances">
              <div class="alcance dentro">
                <h2>Lo que evaluamos</h2>
                <ul><li v-for="t in seccion.intro.enAlcance" :key="t">{{ t }}</li></ul>
              </div>
              <div class="alcance fuera">
                <h2>Lo que queda afuera</h2>
                <ul><li v-for="t in seccion.intro.fueraDeAlcance" :key="t">{{ t }}</li></ul>
              </div>
            </div>
            <p class="cierre">{{ seccion.intro.cierre }}</p>
          </div>

          <div v-if="seccion.preguntas.length" class="preguntas">
            <template v-for="b in bloques" :key="b.clave">
              <GrillaSiNo
                v-if="b.grilla" :preguntas="b.preguntas" :respuestas="store.respuestas" :errores="errores"
                @responder="(id, valor) => (store.respuestas[id] = valor)"
              />
              <Pregunta v-else :pregunta="b.pregunta" :error="errores[b.pregunta.id]" v-model="store.respuestas[b.pregunta.id]" />
            </template>
          </div>
        </section>
      </Transition>

      <p v-if="errorEnvio" class="error-envio" role="alert">{{ errorEnvio }}</p>

      <nav class="navegacion">
        <button class="boton secundario" type="button" @click="anterior">← Anterior</button>
        <button class="boton" type="button" :disabled="enviando" @click="siguiente">
          {{ esUltima ? (enviando ? 'Calculando…' : 'Ver mi resultado') : 'Siguiente' }} <span aria-hidden="true">→</span>
        </button>
      </nav>
    </main>
  </div>
</template>

<style scoped>
.barra { position: sticky; top: 0; z-index: 5; background: rgb(246 245 242 / .92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--borde); }
.fila { display: flex; justify-content: space-between; align-items: center; height: 60px; }
.izquierda { display: flex; align-items: center; gap: 14px; }
.separador { width: 1px; height: 22px; background: var(--borde); }
@media (max-width: 520px) { .separador, .marca { display: none; } }
.marca { text-decoration: none; color: var(--tinta-2); font-size: 15px; }
.marca strong { color: var(--tinta); }
.paso { font-size: 14px; color: var(--tinta-3); font-variant-numeric: tabular-nums; }
.progreso { height: 4px; background: var(--borde); }
.progreso div { height: 100%; background: linear-gradient(90deg, var(--rojo), var(--naranja)); transition: width .35s ease; }
.cuerpo { max-width: 780px; padding: 44px 0 80px; }
h1 { font-size: clamp(28px, 4vw, 38px); margin: 10px 0 12px; letter-spacing: -.01em; }
.descripcion { color: var(--tinta-2); margin: 0 0 8px; font-size: 16px; }
.preguntas { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; }
.intro { display: flex; flex-direction: column; gap: 16px; margin-top: 28px; }
.definicion { background: var(--oscuro); color: #fff; border-radius: var(--radio); padding: 26px 28px; }
.definicion p { margin: 10px 0 0; font-size: 17px; color: #dfe1e8; }
.definicion p + p { margin-top: 12px; }
.definicion strong { color: var(--naranja); font-weight: 700; }
.descripcion strong { color: var(--tinta); font-weight: 700; }
.alcances { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.alcance { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 22px 24px; }
.alcance h2 { font-size: 16px; margin-bottom: 14px; }
.alcance ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.alcance li { position: relative; padding-left: 28px; font-size: 15px; color: var(--tinta-2); line-height: 1.45; }
.alcance li::before {
  position: absolute; left: 0; top: 1px; width: 18px; height: 18px; border-radius: 50%;
  display: grid; place-items: center; font-size: 11px; font-weight: 800; color: #fff;
}
.dentro { border-top: 3px solid var(--naranja); }
.dentro li::before { content: '✓'; background: var(--naranja); }
.fuera li::before { content: '–'; background: #b9b6af; }
.cierre { margin: 4px 0 0; padding: 16px 20px; border-radius: 10px; background: #fff4ea; color: var(--tinta); font-size: 15px; }
@media (max-width: 640px) { .alcances { grid-template-columns: 1fr; } }
.navegacion { display: flex; justify-content: space-between; margin-top: 32px; }
.error-envio { color: var(--rojo); font-weight: 600; margin-top: 24px; }
.deslizar-enter-active, .deslizar-leave-active { transition: opacity .2s ease, transform .2s ease; }
.deslizar-enter-from { opacity: 0; transform: translateX(16px); }
.deslizar-leave-to { opacity: 0; transform: translateX(-16px); }
</style>
