import { createRouter, createWebHistory } from 'vue-router'
import Inicio from '../views/Inicio.vue'
import Encuesta from '../views/Encuesta.vue'
import Resultado from '../views/Resultado.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'inicio', component: Inicio },
    { path: '/encuesta', name: 'encuesta', component: Encuesta },
    { path: '/resultado/:id', name: 'resultado', component: Resultado, props: true },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
