/**
 * Harness de pruebas de carga/rendimiento para los tests RNF.
 *
 * Genera `usuarios` trabajadores concurrentes que ejecutan `iteraciones`
 * rondas sobre una lista de peticiones y resume latencias y fallos.
 */
const { getBackendBaseUrl, peticionJson } = require('./live');

/**
 * Resumen estadístico de las peticiones ejecutadas.
 */
function resumir(tiempos, total, fallos) {
  const ordenados = [...tiempos].sort((a, b) => a - b);
  const p95 = ordenados[Math.floor(ordenados.length * 0.95)] || 0;
  const p99 = ordenados[Math.floor(ordenados.length * 0.99)] || 0;
  return {
    total,
    fallos,
    tasaFallos: total ? fallos / total : 0,
    promedioMs: tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0,
    p95Ms: p95,
    p99Ms: p99,
    maximoMs: Math.max(0, ...tiempos),
  };
}

/**
 * Ejecuta una carga concurrente contra el backend.
 *
 * @param {Object} opciones
 * @param {number} opciones.usuarios        - trabajadores concurrentes
 * @param {number} opciones.iteraciones     - rondas por trabajador
 * @param {Array<{path:string, metodo?:string, datos?:Object}>} opciones.peticiones
 * @param {string} [opciones.baseUrl]
 * @param {Object} [opciones.encabezados]
 * @param {number} [opciones.esperaMs]      - pausa entre peticiones (ms)
 * @returns {Promise<Object>} resumen de latencias y fallos
 */
async function ejecutarCarga({
  usuarios = 1,
  iteraciones = 1,
  peticiones = [],
  encabezados = {},
  esperaMs = 0,
}) {
  const baseUrl = getBackendBaseUrl();
  const tiempos = [];
  let fallos = 0;
  let total = 0;

  const trabajador = async () => {
    for (let i = 0; i < iteraciones; i++) {
      for (const peticion of peticiones) {
        const inicio = Date.now();
        const resultado = await peticionJson(peticion.path, {
          metodo: peticion.metodo || 'GET',
          datos: peticion.datos,
          encabezados,
        });
        const duracion = Date.now() - inicio;
        if (!resultado || !resultado.ok) fallos += 1;
        total += 1;
        tiempos.push(duracion);
        if (esperaMs > 0) {
          await new Promise((r) => setTimeout(r, esperaMs));
        }
      }
    }
  };

  await Promise.all(Array.from({ length: usuarios }, () => trabajador()));

  return resumir(tiempos, total, fallos);
}

/**
 * Calcula la degradación porcentual entre dos métricas.
 * @param {number} carga   - métrica bajo carga (p95, promedio)
 * @param {number} base    - métrica base
 * @returns {number} porcentaje de degradación (0 = sin cambio)
 */
function degradacion(carga, base) {
  if (!base) return 0;
  return ((carga - base) / base) * 100;
}

module.exports = { ejecutarCarga, resumir, degradacion };