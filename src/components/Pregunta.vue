<script setup>
import { computed } from 'vue'

const props = defineProps({ pregunta: Object, modelValue: [String, Array], error: String })
const emit = defineEmits(['update:modelValue'])

const elegidas = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function alternar(opcion) {
  if (props.pregunta.tipo === 'unica') return emit('update:modelValue', opcion.texto)
  const actual = elegidas.value
  if (actual.includes(opcion.texto)) return emit('update:modelValue', actual.filter((t) => t !== opcion.texto))
  // Una opción exclusiva ("Ninguno", "No tenemos…") desmarca las demás y viceversa.
  const exclusivas = new Set(props.pregunta.opciones.filter((o) => o.exclusiva).map((o) => o.texto))
  emit('update:modelValue', opcion.exclusiva ? [opcion.texto] : [...actual.filter((t) => !exclusivas.has(t)), opcion.texto])
}

const marcada = (o) => (props.pregunta.tipo === 'unica' ? props.modelValue === o.texto : elegidas.value.includes(o.texto))
const compacta = computed(() => props.pregunta.opciones?.every((o) => o.texto.length < 28))
</script>

<template>
  <fieldset class="pregunta" :class="{ conError: error }" :id="pregunta.id">
    <legend>
      <span class="texto">{{ pregunta.texto }}</span>
      <span v-if="pregunta.requerida" class="obligatoria" aria-label="obligatoria">*</span>
    </legend>
    <p v-if="pregunta.ayuda" class="ayuda">{{ pregunta.ayuda }}</p>
    <p v-if="pregunta.tipo === 'multiple' && pregunta.opciones.length > 1" class="ayuda">Podés elegir más de una opción.</p>

    <div v-if="pregunta.opciones" class="opciones" :class="{ compacta }" :role="pregunta.tipo === 'unica' ? 'radiogroup' : 'group'">
      <button
        v-for="o in pregunta.opciones" :key="o.texto" type="button" class="opcion"
        :class="{ marcada: marcada(o), multiple: pregunta.tipo === 'multiple' }"
        :role="pregunta.tipo === 'unica' ? 'radio' : 'checkbox'" :aria-checked="marcada(o)"
        @click="alternar(o)"
      >
        <span class="marca" aria-hidden="true"></span>
        <span>{{ o.texto }}</span>
      </button>
    </div>

    <textarea
      v-else-if="pregunta.tipo === 'textoLargo'" rows="4" :value="modelValue"
      placeholder="Escribí tu respuesta" @input="emit('update:modelValue', $event.target.value)"
    ></textarea>
    <input
      v-else :type="pregunta.tipo === 'email' ? 'email' : 'text'" :value="modelValue"
      :placeholder="pregunta.tipo === 'email' ? 'nombre@empresa.com' : 'Escribí tu respuesta'"
      :autocomplete="pregunta.tipo === 'email' ? 'email' : 'off'"
      @input="emit('update:modelValue', $event.target.value)"
    />

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.pregunta { border: 0; margin: 0; padding: 26px 28px; background: var(--tarjeta); border-radius: var(--radio); border: 1px solid var(--borde); }
.pregunta.conError { border-color: var(--rojo); }
legend { float: left; width: 100%; padding: 0; font-size: 17px; font-weight: 600; line-height: 1.4; }
legend + * { clear: both; }
.obligatoria { color: var(--rojo); margin-left: 4px; }
.ayuda { margin: 8px 0 0; font-size: 14px; color: var(--tinta-3); }
.opciones { display: grid; gap: 10px; margin-top: 22px; }
.opciones.compacta { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
.opcion {
  display: flex; align-items: flex-start; gap: 12px; text-align: left;
  padding: 13px 16px; border-radius: 10px; border: 1px solid var(--borde); background: #fbfaf8;
  font: inherit; font-size: 15px; color: var(--tinta); cursor: pointer; transition: border-color .12s, background .12s;
}
.opcion:hover { border-color: #f3b57a; background: #fff; }
.opcion.marcada { border-color: var(--naranja); background: #fff4ea; }
.marca { flex: none; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; border: 2px solid #c6c3bd; position: relative; }
.multiple .marca { border-radius: 5px; }
.marcada .marca { border-color: var(--naranja); background: var(--naranja); box-shadow: inset 0 0 0 3px #fff4ea; }
.multiple.marcada .marca { box-shadow: none; }
.multiple.marcada .marca::after { content: ''; position: absolute; left: 4px; top: 0; width: 5px; height: 10px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
input, textarea {
  width: 100%; margin-top: 22px; padding: 13px 16px; border-radius: 10px; border: 1px solid var(--borde);
  font: inherit; font-size: 15px; background: #fbfaf8; resize: vertical;
}
input:focus, textarea:focus { outline: none; border-color: var(--naranja); background: #fff; }
.error { margin: 10px 0 0; color: var(--rojo); font-size: 14px; font-weight: 600; }
</style>
