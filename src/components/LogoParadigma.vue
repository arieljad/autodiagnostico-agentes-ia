<script setup>
// Logo de Paradigma. `claro` usa la versión con letras blancas, para fondos oscuros
// (también con el tema oscuro, donde todo el fondo es oscuro).
import { computed } from 'vue'
const props = defineProps({ claro: Boolean, alto: { type: Number, default: 28 } })
const blanco = computed(() => props.claro || document.documentElement.dataset.tema === 'oscuro')
</script>

<template>
  <a href="https://www.paradigma.com" target="_blank" rel="noopener" class="logo" aria-label="Paradigma">
    <img :src="blanco ? '/logo-paradigma-blanco.svg' : '/logo-paradigma.svg'" alt="Paradigma" :style="{ height: `${alto}px` }" />
  </a>
</template>

<style scoped>
.logo { display: inline-flex; line-height: 0; }
.logo img { width: auto; display: block; }
</style>
