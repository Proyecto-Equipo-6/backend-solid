/**
 * RNF-007 — Rendimiento bajo alta concurrencia y catálogo extenso.
 *
 * Verifica que el rendimiento no se degrade más del 20% respecto al tiempo
 * base bajo 200 usuarios concurrentes. Requiere backend + BD. Si no están
 * disponibles, el test se omite.
 *
 * El criterio menciona 5 000 productos: el test reporta el tamaño real del
 * catálogo y advierte si es menor (evidencia parcial).
 */
jest.setTimeout(300000);

const { backendDisponible, dbDisponible, obtenerPool, cerrarPool } = require('./helpers/live');
const { ejecutarCarga, degradacion } = require('./helpers/loadHarness');

const LIMITE_DEGRADACION_PCT = 20;
const CATALOGO_EXTENSO = 5000;
const RAMPAS = [
  { usuarios: 20 },
  { usuarios: 50 },
  { usuarios: 100 },
  { usuarios: 150 },
  { usuarios: 200 },
];

let backendActivo = false;
let dbActiva = false;

beforeAll(async () => {
  [backendActivo, dbActiva] = await Promise.all([backendDisponible(), dbDisponible()]);
});

afterAll(async () => {
  if (dbActiva) await cerrarPool();
});

describe('RNF-007 Rendimiento con alta concurrencia y catálogo extenso', () => {
  test('CP-RNF-007-01: sin degradación mayor al 20% con crecimiento progresivo hasta 200 usuarios', async () => {
    if (!backendActivo) {
      console.log('[RNF-007] Backend no disponible, test omitido.');
      return;
    }

    if (process.env.RNF_LOAD !== '1') {
      console.log(
        '[RNF-007] Escenario de carga pesada deshabilitado. Ejecuta con RNF_LOAD=1 ' +
          '(requiere catálogo de 5 000 productos y un entorno preparado).'
      );
      return;
    }

    let cantidadProductos = null;
    if (dbActiva) {
      const pool = obtenerPool();
      const [filas] = await pool.execute('SELECT COUNT(*) AS total FROM productos');
      cantidadProductos = Number(filas[0].total);
    }

    const base = await ejecutarCarga({
      usuarios: 5,
      iteraciones: 3,
      peticiones: [{ path: '/api/v1/productos/publico' }],
    });

    const etapas = [];
    for (const rampa of RAMPAS) {
      const carga = await ejecutarCarga({
        usuarios: rampa.usuarios,
        iteraciones: 3,
        peticiones: [{ path: '/api/v1/productos/publico' }],
      });
      etapas.push({
        usuarios: rampa.usuarios,
        p95Ms: carga.p95Ms,
        promedioMs: carga.promedioMs,
        tasaFallos: carga.tasaFallos,
        degradacionP95: degradacion(carga.p95Ms, base.p95Ms),
        degradacionPromedio: degradacion(carga.promedioMs, base.promedioMs),
      });
    }

    const etapaFinal = etapas[etapas.length - 1];
    const advertencia =
      cantidadProductos !== null && cantidadProductos < CATALOGO_EXTENSO
        ? `Catálogo actual: ${cantidadProductos} productos (< ${CATALOGO_EXTENSO}). Evidencia parcial del escenario.`
        : `Catálogo actual: ${cantidadProductos} productos.`;

    console.log(`[RNF-007] Base p95=${base.p95Ms}ms | ${advertencia}`);
    console.log(
      '[RNF-007] Rampa progresiva -> ' +
        etapas
          .map(
            (e) =>
              `${e.usuarios}u: p95=${e.p95Ms}ms (${e.degradacionP95.toFixed(2)}%), ` +
              `prom=${e.promedioMs}ms (${e.degradacionPromedio.toFixed(2)}%), fallos=${(e.tasaFallos * 100).toFixed(2)}%`
          )
          .join(' | ')
    );

    expect(etapaFinal.tasaFallos).toBeLessThan(0.05);
    expect(etapaFinal.degradacionP95).toBeLessThanOrEqual(LIMITE_DEGRADACION_PCT);
    expect(etapaFinal.degradacionPromedio).toBeLessThanOrEqual(LIMITE_DEGRADACION_PCT);
  });
});