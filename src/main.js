import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './style.css'

// Tema de prueba: ?tema=oscuro (se recuerda en el navegador; ?tema=claro vuelve al claro).
const tema = new URLSearchParams(location.search).get('tema') ?? localStorage.getItem('tema')
if (tema) localStorage.setItem('tema', tema)
if (tema === 'oscuro') document.documentElement.dataset.tema = 'oscuro'

createApp(App).use(createPinia()).use(router).mount('#app')
