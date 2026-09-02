/**
 * RNF-009 — Operación continua (24 horas).
 *
 * Ejecuta un soak test durante RNF_SOAK_MINUTOS (default 0.5) verificando que
 * el sistema mantiene integridad transaccional y una tasa de fallos < 0.1%.
 *
 * Para la corrida oficial de 24 horas:
 *   RNF_SOAK_MINUTOS=1440 npx jest tests/RNF/RNF-009-operacion-continua.test.js
 */
jest.setTimeout(86400000);

const { backendDisponible, dbDisponible, obtenerPool, cerrarPool, peticionJson } = require('./helpers/live');

const DURACION_MS = (Number(process.env.RNF_SOAK_MINUTOS) || 0.5) * 60 * 1000;
const INTERVALO_MS = 3000;
const TASA_FALLOS_MAXIMA = 0.001;

describe('RNF-009 Operación continua', () => {
  test('CP-RNF-009-01: operación durante la ventana definida con fallos < 0.1% e integridad transaccional', async () => {
    const [backendActivo, dbActiva] = await Promise.all([backendDisponible(), dbDisponible()]);
    if (!backendActivo || !dbActiva) {
      console.log('[RNF-009] Backend/BD no disponibles, test omitido.');
      return;
    }

    const pool = obtenerPool();
    const fin = Date.now() + DURACION_MS;
    let iteraciones = 0;
    let fallos = 0;
    let conteoProductosAnterior = null;

    try {
      console.log(`[RNF-009] Iniciando soak de ${DURACION_MS / 60000} min...`);

      while (Date.now() < fin) {
        iteraciones += 1;

        const [api, db] = await Promise.all([
          peticionJson('/api/v1/productos/publico'),
          pool.execute('SELECT COUNT(*) AS total FROM productos').then(([filas]) => Number(filas[0].total)),
        ]);

        const okApi = Boolean(api && api.ok);
        const okDb = db >= 0;
        const integro = conteoProductosAnterior === null || db === conteoProductosAnterior;

        if (!okApi || !okDb || !integro) fallos += 1;
        conteoProductosAnterior = db;

        await new Promise((r) => setTimeout(r, INTERVALO_MS));
      }
    } finally {
      await cerrarPool();
    }

    const tasaFallos = iteraciones ? fallos / iteraciones : 1;
    const porcentaje = (tasaFallos * 100).toFixed(4);

    console.log(
      `[RNF-009] Soak ${DURACION_MS / 60000} min: ${iteraciones} iteraciones, ` +
        `${fallos} fallos, tasa de fallos=${porcentaje}%`
    );

    expect(iteraciones).toBeGreaterThan(0);
    expect(tasaFallos).toBeLessThan(TASA_FALLOS_MAXIMA);
  });
});