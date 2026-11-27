<script setup>
import { useRouter } from 'vue-router'
import { ENCUESTA } from '../encuesta/definicion.js'
import { DIMENSIONES } from '../encuesta/matriz.js'
import { useEncuestaStore } from '../stores/encuesta.js'
import LogoParadigma from '../components/LogoParadigma.vue'

const router = useRouter()
const store = useEncuestaStore()
const hayBorrador = Object.keys(store.respuestas).length > 0
const dimensiones = DIMENSIONES

function empezar(nueva) {
  if (nueva) store.reiniciar()
  router.push({ name: 'encuesta' })
}
</script>

<template>
  <main class="hero">
    <div class="halo halo-a" aria-hidden="true"></div>
    <div class="halo halo-b" aria-hidden="true"></div>
    <div class="contenedor contenido">
      <LogoParadigma claro :alto="34" class="logo-hero" />
      <span class="etiqueta">Autodiagnóstico · 10 minutos</span>
      <h1>¿Qué tan madura es tu organización en <em>agentes de IA</em>?</h1>
      <p class="bajada">{{ ENCUESTA.descripcion }}</p>

      <div class="acciones">
        <button class="boton" @click="empezar(!hayBorrador)">
          {{ hayBorrador ? 'Continuar donde dejé' : 'Comenzar el diagnóstico' }} <span aria-hidden="true">→</span>
        </button>
        <button v-if="hayBorrador" class="boton secundario claro" @click="empezar(true)">Empezar de nuevo</button>
      </div>

      <ul class="beneficios">
        <li><strong>Resultado inmediato</strong><span>Tu nivel en una escala de 5, de la exploración al conocimiento integrado.</span></li>
        <li><strong>Próximos pasos</strong><span>Las capacidades que te faltan para llegar al siguiente nivel.</span></li>
        <li><strong>Revisión con especialistas</strong><span>Agendá una reunión para ver cómo te posicionás frente a tu industria.</span></li>
      </ul>

      <div class="dimensiones">
        <span v-for="d in dimensiones" :key="d.nombre" class="chip">{{ d.nombre }}</span>
      </div>

      <p class="privacidad">{{ ENCUESTA.privacidad }}</p>
    </div>
  </main>
</template>

<style scoped>
.hero {
  position: relative; overflow: hidden; min-height: 100vh;
  background: var(--oscuro); color: var(--sobre-oscuro); display: flex; align-items: center;
  padding: 72px 0;
}
.halo { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .45; }
.halo-a { width: 520px; height: 520px; right: -140px; top: -160px; background: var(--naranja); }
.halo-b { width: 360px; height: 360px; left: -160px; bottom: -160px; background: var(--rojo); }
.contenido { position: relative; }
.logo-hero { display: flex; width: fit-content; margin-bottom: 40px; }
h1 { font-size: clamp(36px, 6vw, 64px); max-width: 820px; margin: 16px 0 20px; font-weight: 800; letter-spacing: -.02em; }
h1 em { font-style: normal; color: var(--naranja); }
.bajada { font-size: 18px; color: var(--sobre-oscuro-2); max-width: 640px; margin: 0 0 32px; }
.acciones { display: flex; gap: 12px; flex-wrap: wrap; }
.boton.secundario.claro { color: var(--sobre-oscuro); border-color: rgb(255 255 255 / .3); }
.boton.secundario.claro:hover { background: rgb(255 255 255 / .08); }
.beneficios {
  list-style: none; padding: 0; margin: 48px 0 28px;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; max-width: 820px;
}
.beneficios li {
  display: flex; flex-direction: column; gap: 6px; padding: 18px 20px;
  border-radius: var(--radio); background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .1);
  backdrop-filter: blur(6px);
}
.beneficios span { color: var(--sobre-oscuro-2); font-size: 14px; }
.dimensiones { display: flex; flex-wrap: wrap; gap: 8px; max-width: 820px; }
.chip { font-size: 13px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .18); color: var(--sobre-oscuro); }
.privacidad { margin-top: 28px; font-size: 13px; color: var(--sobre-oscuro-3); max-width: 640px; }
</style>
