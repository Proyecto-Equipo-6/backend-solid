/**
 * Helpers para tests RNF que dependen de servicios vivos
 * (backend Express, frontend Vite, MySQL).
 *
 * Cada guarda verifica disponibilidad y devuelve `false` si el servicio no está
 * levantado, para que los tests puedan saltarse sin romper la suite completa.
 *
 * Variables de entorno opcionales:
 *   RNF_BACKEND_URL   (default http://localhost:3000)
 *   RNF_FRONTEND_URL  (default http://localhost:5173)
 *   RNF_FORZAR_LIVE=1  (falla la guarda si el servicio no responde, para CI)
 */
const http = require('http');
const mysql = require('mysql2/promise');

const BACKEND_URL = (process.env.RNF_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const FRONTEND_URL = (process.env.RNF_FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const FORZAR_LIVE = process.env.RNF_FORZAR_LIVE === '1';

function getBackendBaseUrl() {
  return BACKEND_URL;
}

function getFrontendBaseUrl() {
  return FRONTEND_URL;
}

/**
 * GET simple con timeout. Devuelve null si no se puede conectar.
 */
function getSimple(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve({ status: res.statusCode });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

/**
 * @returns {Promise<boolean>} true si el backend responde.
 */
async function backendDisponible() {
  const respuesta = await getSimple(`${BACKEND_URL}/api/v1/productos/publico`);
  if (respuesta && FORZAR_LIVE) {
    throw new Error('RNF_FORZAR_LIVE=1 pero el backend no respondió');
  }
  return Boolean(respuesta);
}

/**
 * @returns {Promise<boolean>} true si el frontend responde.
 */
async function frontendDisponible() {
  const respuesta = await getSimple(`${FRONTEND_URL}/`);
  if (respuesta && FORZAR_LIVE) {
    throw new Error('RNF_FORZAR_LIVE=1 pero el frontend no respondió');
  }
  return Boolean(respuesta);
}

let poolMemo = null;

/**
 * Devuelve un pool MySQL2 configurado con las variables del backend.
 */
function obtenerPool() {
  if (!poolMemo) {
    poolMemo = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistema_comercial',
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      charset: 'utf8mb4_unicode_ci',
    });
  }
  return poolMemo;
}

/**
 * @returns {Promise<boolean>} true si MySQL responde y el esquema existe.
 */
async function dbDisponible() {
  try {
    const pool = obtenerPool();
    const [filas] = await pool.execute(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    const ok = Number(filas[0]?.total) > 0;
    if (!ok && FORZAR_LIVE) {
      throw new Error('RNF_FORZAR_LIVE=1 pero la base de datos está vacía');
    }
    return ok;
  } catch (error) {
    if (FORZAR_LIVE) throw error;
    return false;
  }
}

/**
 * Ejecuta una petición HTTP contra el backend con JSON y timeout.
 * Devuelve { ok, status, body } o null si falla la conexión.
 */
async function peticionJson(path, { metodo = 'GET', datos, encabezados = {}, timeoutMs = 10000 } = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...encabezados },
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
      signal: controlador.signal,
    });
    const cuerpo = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body: cuerpo };
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Cierra el pool de MySQL para que Jest termine limpiamente.
 */
async function cerrarPool() {
  if (poolMemo) {
    try {
      await poolMemo.end();
    } catch {
      // sin efecto
    }
    poolMemo = null;
  }
}

module.exports = {
  getBackendBaseUrl,
  getFrontendBaseUrl,
  backendDisponible,
  frontendDisponible,
  dbDisponible,
  obtenerPool,
  cerrarPool,
  peticionJson,
};