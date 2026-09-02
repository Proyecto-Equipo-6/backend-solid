/**
 * RNF-002 — Consistencia de datos.
 *
 * CP-RNF-002-01 requiere backend + BD sembrada.
 * CP-RNF-002-02 requiere MySQL. Si los servicios no están disponibles, los
 * tests se omiten automáticamente.
 */
jest.setTimeout(60000);

const { backendDisponible, dbDisponible, obtenerPool, cerrarPool, peticionJson } = require('./helpers/live');

const USUARIO_ADMIN = { email: 'admin@remate.com', password: 'Admin123' };
const USUARIO_REPARTIDOR = { email: 'luis@remate.com', password: 'Admin123' };
const LIMITE_VISIBILIDAD_MS = 2000;

let backendActivo = false;
let dbActiva = false;
let pool = null;

beforeAll(async () => {
  [backendActivo, dbActiva] = await Promise.all([backendDisponible(), dbDisponible()]);
  if (dbActiva) pool = obtenerPool();
});

afterAll(async () => {
  if (dbActiva) await cerrarPool();
});

describe('RNF-002 Consistencia de datos', () => {
  test('CP-RNF-002-01: una modificación confirmada en BD es visible en máximo 2 segundos', async () => {
    if (!backendActivo || !dbActiva) {
      console.log('[RNF-002-01] Backend/BD no disponibles, test omitido.');
      return;
    }

    const login = await peticionJson('/api/v1/auth/login', {
      metodo: 'POST',
      datos: USUARIO_ADMIN,
    });
    if (!login?.ok) {
      console.log('[RNF-002-01] No se pudo autenticar como Admin, test omitido.');
      return;
    }
    const token = login.body.token;
    const encabezados = { Authorization: `Bearer ${token}` };

    const catalogo = await peticionJson('/api/v1/productos/publico');
    const productos = Array.isArray(catalogo?.body?.items) ? catalogo.body.items : [];
    const producto = productos[0];
    if (!producto) {
      console.log('[RNF-002-01] Sin productos en catálogo, test omitido.');
      return;
    }

    const idProducto = producto.id_producto ?? producto.id;
    const estadoAnterior = await peticionJson(`/api/v1/productos/${idProducto}`, { encabezados });
    const stockOriginal = Number(estadoAnterior?.body?.stock ?? producto.stock);
    const stockNuevo = stockOriginal + 1;

    const inicio = Date.now();
    const actualizacion = await peticionJson(`/api/v1/productos/${idProducto}/ajustar-stock`, {
      metodo: 'PUT',
      encabezados,
      datos: { cantidad_nueva: stockNuevo, motivo: 'Prueba RNF-002-01 visibilidad' },
    });
    expect(actualizacion?.ok).toBe(true);

    let visibleMs = null;
    const tope = Date.now() + 5000;
    while (Date.now() < tope) {
      const lectura = await peticionJson(`/api/v1/productos/${idProducto}`, { encabezados });
      if (Number(lectura?.body?.stock) === stockNuevo) {
        visibleMs = Date.now() - inicio;
        break;
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    if (visibleMs === null) {
      console.log(`[RNF-002-01] El cambio no se hizo visible en 5s. Stock: ${stockOriginal} -> ${stockNuevo}.`);
    } else {
      console.log(`[RNF-002-01] Cambio visible en ${visibleMs}ms (stock ${stockOriginal} -> ${stockNuevo}).`);
    }

    await peticionJson(`/api/v1/productos/${idProducto}/ajustar-stock`, {
      metodo: 'PUT',
      encabezados,
      datos: { cantidad_nueva: stockOriginal, motivo: 'Restauración tras prueba RNF-002-01' },
    });

    expect(visibleMs).not.toBeNull();
    expect(visibleMs).toBeLessThanOrEqual(LIMITE_VISIBILIDAD_MS);
  });

  test('CP-RNF-002-02: consistencia bajo escrituras concurrentes (sin pérdida de actualizaciones)', async () => {
    if (!dbActiva) {
      console.log('[RNF-002-02] MySQL no disponible, test omitido.');
      return;
    }

    const nombreTabla = `rnf_concurrente_${Date.now()}`;
    await pool.execute(`CREATE TABLE ${nombreTabla} (id INT PRIMARY KEY, saldo INT)`);
    await pool.execute(`INSERT INTO ${nombreTabla} (id, saldo) VALUES (1, 1000)`);

    const TRANSACCIONES = 20;
    let errorCapturado = null;
    try {
      const trabajadores = Array.from({ length: TRANSACCIONES }, async () => {
        const conexion = await pool.getConnection();
        try {
          await conexion.beginTransaction();
          await conexion.execute(`SELECT saldo FROM ${nombreTabla} WHERE id = 1 FOR UPDATE`);
          await conexion.execute(`UPDATE ${nombreTabla} SET saldo = saldo - 1 WHERE id = 1`);
          await conexion.commit();
        } catch (error) {
          await conexion.rollback();
          throw error;
        } finally {
          conexion.release();
        }
      });

      await Promise.all(trabajadores);
    } catch (error) {
      errorCapturado = error;
    }

    const [filas] = await pool.execute(`SELECT saldo FROM ${nombreTabla} WHERE id = 1`);
    const saldoFinal = Number(filas[0].saldo);
    await pool.execute(`DROP TABLE ${nombreTabla}`);

    if (errorCapturado) throw errorCapturado;

    console.log(`[RNF-002-02] 20 escrituras concurrentes -> saldo final ${saldoFinal} (esperado ${1000 - TRANSACCIONES})`);

    expect(saldoFinal).toBe(1000 - TRANSACCIONES);
  });

  test('CP-RNF-002-03: el nuevo estado de un pedido se propaga a las vistas del cliente y el repartidor en <= 2s', async () => {
    if (!backendActivo || !dbActiva) {
      console.log('[RNF-002-03] Backend/BD no disponibles, test omitido.');
      return;
    }

    const [filas] = await pool.execute(
      `SELECT p.id_pedido, u.email
       FROM pedidos p
       JOIN usuarios u ON u.id_usuario = p.id_usuario
       WHERE p.id_repartidor = 5 AND p.estado = 'ASIGNADO'
       ORDER BY p.id_pedido LIMIT 1`
    );
    const candidato = filas[0];
    if (!candidato) {
      console.log('[RNF-002-03] Sin pedido en estado ASIGNADO para el repartidor de prueba. Test omitido.');
      return;
    }
    const pedidoId = Number(candidato.id_pedido);
    const emailCliente = candidato.email;

    const loginCliente = await peticionJson('/api/v1/auth/login', {
      metodo: 'POST',
      datos: { email: emailCliente, password: 'Admin123' },
    });
    const loginRepartidor = await peticionJson('/api/v1/auth/login', {
      metodo: 'POST',
      datos: USUARIO_REPARTIDOR,
    });
    if (!loginCliente?.ok || !loginRepartidor?.ok) {
      console.log('[RNF-002-03] No se pudo autenticar Cliente/Repartidor, test omitido.');
      return;
    }
    const tokenCliente = loginCliente.body.token;
    const tokenRepartidor = loginRepartidor.body.token;
    const encCliente = { Authorization: `Bearer ${tokenCliente}` };
    const encRepartidor = { Authorization: `Bearer ${tokenRepartidor}` };

    const estadoAnterior = 'ASIGNADO';
    const estadoNuevo = 'EN_CAMINO';
    const cambiarEstado = () =>
      peticionJson(`/api/v1/repartidor/pedidos/${pedidoId}/estado`, {
        metodo: 'PATCH',
        encabezados: encRepartidor,
        datos: { estado: estadoNuevo, estadoAnterior },
      });

    const actualizacion = await cambiarEstado();
    expect(actualizacion?.ok).toBe(true);

    const sondeoSinTope = (fn, verificar, ms) =>
      new Promise((resolver) => {
        const inicio = Date.now();
        const paso = async () => {
          const lectura = await fn();
          if (verificar(lectura)) return resolver(Date.now() - inicio);
          if (Date.now() - inicio > ms) return resolver(null);
          setTimeout(paso, 150);
        };
        paso();
      });

    const msCliente = await sondeoSinTope(
      async () => {
        const lista = await peticionJson('/api/v1/pedidos', { encabezados: encCliente });
        const pedido = (lista?.body?.pedidos || []).find((p) => Number(p.id_pedido) === pedidoId);
        return pedido?.estado;
      },
      (estado) => estado === estadoNuevo,
      5000
    );

    const msRepartidor = await sondeoSinTope(
      async () => {
        const detalle = await peticionJson(
          `/api/v1/repartidor/pedidos/${pedidoId}/detalle`,
          { encabezados: encRepartidor }
        );
        return detalle?.body?.estado;
      },
      (estado) => estado === estadoNuevo,
      5000
    );

    let restaurado = true;
    try {
      await pool.execute('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estadoAnterior, pedidoId]);
    } catch {
      restaurado = false;
    }

    console.log(
      `[RNF-002-03] Pedido ${pedidoId} ${estadoAnterior}->${estadoNuevo} visible en vista Cliente: ${msCliente}ms, ` +
        `vista Repartidor: ${msRepartidor}ms. Restauración por BD: ${restaurado ? 'ok' : 'falló'}.`
    );

    expect(msCliente).not.toBeNull();
    expect(msRepartidor).not.toBeNull();
    expect(msCliente).toBeLessThanOrEqual(LIMITE_VISIBILIDAD_MS);
    expect(msRepartidor).toBeLessThanOrEqual(LIMITE_VISIBILIDAD_MS);
  });
});