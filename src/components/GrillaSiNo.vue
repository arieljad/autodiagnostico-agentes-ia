<script setup>
// Varias preguntas con las mismas opciones (Sí / No / No sé) en una sola grilla:
// una fila por pregunta y una columna por opción.
const props = defineProps({ preguntas: Array, respuestas: Object, errores: Object })
const emit = defineEmits(['responder'])
const opciones = props.preguntas[0].opciones.map((o) => o.texto)
const corta = (t) => (t.startsWith('No sé') ? 'No sé' : t)
</script>

<template>
  <div class="grilla" role="group">
    <div class="encabezado" aria-hidden="true">
      <span></span>
      <div class="opciones"><span v-for="o in opciones" :key="o" class="col">{{ corta(o) }}</span></div>
    </div>
    <div
      v-for="p in preguntas" :id="p.id" :key="p.id" class="fila" :class="{ conError: errores[p.id] }"
    >
      <div :id="`${p.id}-texto`" class="texto">
        {{ p.texto }}<span v-if="p.requerida" class="obligatoria" aria-label="obligatoria">*</span>
        <small v-if="p.ayuda">{{ p.ayuda }}</small>
        <small v-if="errores[p.id]" class="error" role="alert">{{ errores[p.id] }}</small>
      </div>
      <div class="opciones" role="radiogroup" :aria-labelledby="`${p.id}-texto`">
        <button
          v-for="o in opciones" :key="o" type="button" role="radio" class="opcion"
          :class="{ marcada: respuestas[p.id] === o }" :aria-checked="respuestas[p.id] === o" :aria-label="o"
          @click="emit('responder', p.id, o)"
        >
          <span class="marca" aria-hidden="true"></span>
          <span class="etiqueta-movil">{{ corta(o) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grilla { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 10px 24px 8px; }
.encabezado, .fila { display: grid; grid-template-columns: 1fr 210px; align-items: center; gap: 16px; }
.encabezado { padding: 10px 0; border-bottom: 1px solid var(--borde); }
.col { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--tinta-3); }
.fila { padding: 16px 0; border-bottom: 1px solid #f0eee9; }
.fila:last-child { border-bottom: 0; }
.fila.conError .texto { color: var(--rojo); }
.texto { font-size: 16px; font-weight: 600; line-height: 1.4; }
.texto small { display: block; font-weight: 400; font-size: 13px; color: var(--tinta-3); margin-top: 4px; }
.texto small.error { color: var(--rojo); font-weight: 600; }
.obligatoria { color: var(--rojo); margin-left: 4px; }
.opciones { display: grid; grid-template-columns: repeat(3, 70px); justify-items: center; }
.opcion { display: grid; place-items: center; width: 44px; height: 44px; border: 0; background: transparent; cursor: pointer; border-radius: 50%; }
.opcion:hover { background: #fff4ea; }
.marca { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #c6c3bd; }
.marcada .marca { border-color: var(--naranja); background: var(--naranja); box-shadow: inset 0 0 0 3px #fff; }
.etiqueta-movil { display: none; }
@media (max-width: 640px) {
  .encabezado { display: none; }
  .fila { grid-template-columns: 1fr; gap: 10px; }
  .opciones { grid-template-columns: repeat(3, 1fr); gap: 8px; justify-items: stretch; }
  .opcion { width: auto; height: auto; border-radius: 10px; border: 1px solid var(--borde); padding: 10px; display: flex; gap: 8px; justify-content: center; }
  .marcada { border-color: var(--naranja); background: #fff4ea; }
  .etiqueta-movil { display: inline; font-size: 14px; }
}
</style>
