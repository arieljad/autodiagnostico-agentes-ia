import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { seccionesVisibles } from '../encuesta/definicion.js'

const CLAVE = 'autodiagnostico-agentes-ia:borrador'

// Estado de la encuesta en curso. Se guarda en localStorage para que nadie
// pierda lo respondido si recarga o vuelve más tarde.
export const useEncuestaStore = defineStore('encuesta', () => {
  const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
  const respuestas = ref(guardado?.respuestas ?? {})
  const paso = ref(guardado?.paso ?? 0)

  const secciones = computed(() => seccionesVisibles(respuestas.value))
  const seccionActual = computed(() => secciones.value[Math.min(paso.value, secciones.value.length - 1)])
  const progreso = computed(() => Math.round((paso.value / secciones.value.length) * 100))

  watch([respuestas, paso], () => localStorage.setItem(CLAVE, JSON.stringify({ respuestas: respuestas.value, paso: paso.value })), { deep: true })

  function reiniciar() {
    respuestas.value = {}
    paso.value = 0
    localStorage.removeItem(CLAVE)
  }

  async function enviar() {
    const resp = await fetch('/api/respuestas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respuestas: respuestas.value }),
    })
    const datos = await resp.json().catch(() => ({}))
    if (!resp.ok) throw Object.assign(new Error(datos.error ?? 'No se pudo enviar la encuesta.'), { errores: datos.errores })
    return datos
  }

  return { respuestas, paso, secciones, seccionActual, progreso, reiniciar, enviar }
})
