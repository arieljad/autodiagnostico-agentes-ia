// Guarda las respuestas en Postgres si hay DATABASE_URL; si no, en un archivo
// JSON local (data/respuestas.json), útil para desarrollo sin base de datos.
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ARCHIVO = path.resolve(process.env.DATA_FILE ?? 'data/respuestas.json')

function crearAlmacenArchivo() {
  let cola = Promise.resolve()
  const leer = async () => {
    try {
      return JSON.parse(await readFile(ARCHIVO, 'utf8'))
    } catch (e) {
      if (e.code === 'ENOENT') return []
      throw e
    }
  }
  return {
    tipo: 'archivo',
    async iniciar() {
      await mkdir(path.dirname(ARCHIVO), { recursive: true })
    },
    guardar(registro) {
      // Serializa las escrituras para no perder respuestas concurrentes.
      cola = cola.then(async () => {
        const todos = await leer()
        todos.push(registro)
        await mkdir(path.dirname(ARCHIVO), { recursive: true })
        await writeFile(ARCHIVO, JSON.stringify(todos, null, 2))
      })
      return cola
    },
    async obtener(id) {
      return (await leer()).find((r) => r.id === id) ?? null
    },
    async listar() {
      return leer()
    },
  }
}

async function crearAlmacenPostgres() {
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  })
  const fila = (r) => r && { id: r.id, creado: r.creado, email: r.email, empresa: r.empresa, industria: r.industria, respuestas: r.respuestas, resultado: r.resultado }
  return {
    tipo: 'postgres',
    async iniciar() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS encuesta_respuestas (
          id         uuid PRIMARY KEY,
          creado     timestamptz NOT NULL DEFAULT now(),
          email      text NOT NULL,
          empresa    text,
          industria  text,
          respuestas jsonb NOT NULL,
          resultado  jsonb NOT NULL
        )`)
    },
    async guardar(r) {
      await pool.query(
        'INSERT INTO encuesta_respuestas (id, creado, email, empresa, industria, respuestas, resultado) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [r.id, r.creado, r.email, r.empresa, r.industria, r.respuestas, r.resultado],
      )
    },
    async obtener(id) {
      const { rows } = await pool.query('SELECT * FROM encuesta_respuestas WHERE id = $1', [id])
      return fila(rows[0])
    },
    async listar() {
      const { rows } = await pool.query('SELECT * FROM encuesta_respuestas ORDER BY creado')
      return rows.map(fila)
    },
  }
}

export async function crearAlmacen() {
  const almacen = process.env.DATABASE_URL ? await crearAlmacenPostgres() : crearAlmacenArchivo()
  await almacen.iniciar()
  return almacen
}

export const nuevoId = () => randomUUID()
