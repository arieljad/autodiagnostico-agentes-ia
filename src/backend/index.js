import 'dotenv/config'
import { crearApp } from './app.js'
import { crearAlmacen } from './almacenamiento.js'

const PORT = process.env.PORT || 3001
const almacen = await crearAlmacen()
crearApp(almacen).listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT} (almacenamiento: ${almacen.tipo})`)
})
