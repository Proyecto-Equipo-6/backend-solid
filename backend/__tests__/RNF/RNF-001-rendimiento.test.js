/**
 * RNF-001 — Rendimiento.
 *
 * Requiere el backend levantado (http://localhost:3000) y la BD sembrada con
 * el Seed.sql (usuarios de prueba). Si el backend no responde, los tests se
 * omiten automáticamente.
 */
jest.setTimeout(180000);

const { backendDisponible, dbDisponible, obtenerPool, cerrarPool, peticionJson, getBackendBaseUrl } = require('./helpers/live');
const { ejecutarCarga } = require('./helpers/loadHarness');

const LIMITE_P95_MS = 5000;

const USUARIO_CLIENTE = { email: 'juan@email.com', password: 'Admin123' };
const USUARIO_ADMIN = { email: 'admin@remate.com', password: 'Admin123' };

const FLUJOS_PRINCIPALES = [
  { path: '/api/v1/productos/publico' },
  { path: '/api/v1/productos/1' },
  { path: '/api/v1/auth/login', metodo: 'POST', datos: USUARIO_CLIENTE },
];

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

describe('RNF-001 Rendimiento', () => {
  test('CP-RNF-001-01: los flujos principales no superan 5 segundos bajo carga normal', async () => {
    if (!backendActivo) {
      console.log('[RNF-001-01] Backend no disponible, test omitido.');
      return;
    }

    const resultado = await ejecutarCarga({
      usuarios: 10,
      iteraciones: 3,
      peticiones: FLUJOS_PRINCIPALES,
    });

    console.log(`[RNF-001-01] Carga normal -> ${JSON.stringify(resultado)}`);
    expect(resultado.tasaFallos).toBeLessThan(0.1);
    expect(resultado.p95Ms).toBeLessThanOrEqual(LIMITE_P95_MS);
  });

  test('CP-RNF-001-01: la generación de pedido end-to-end no supera 5 segundos', async () => {
    if (!backendActivo) {
      console.log('[RNF-001-01b] Backend no disponible, test omitido.');
      return;
    }

    const login = await peticionJson('/api/v1/auth/login', {
      metodo: 'POST',
      datos: USUARIO_CLIENTE,
    });
    if (!login?.ok) {
      console.log('[RNF-001-01b] No se pudo autenticar como Cliente, test omitido.');
      return;
    }
    const token = login.body.token;
    const encabezados = { Authorization: `Bearer ${token}` };

    const carrito = await peticionJson('/api/v1/carrito', { encabezados });
    const items = Array.isArray(carrito?.body?.items) ? carrito.body.items : [];
    for (const item of items) {
      await peticionJson(`/api/v1/carrito/${item.idProducto ?? item.id_producto}`, {
        metodo: 'DELETE',
        encabezados,
      });
    }

    const agregado = await peticionJson('/api/v1/carrito', {
      metodo: 'POST',
      encabezados,
      datos: { productoId: 1, cantidad: 1 },
    });
    if (!agregado?.ok) {
      console.log(`[RNF-001-01b] No se pudo preparar el carrito (${agregado?.body?.error}). Test omitido.`);
      return;
    }

    const carrito2 = await peticionJson('/api/v1/carrito', { encabezados });
    const total = Number(carrito2?.body?.total) || 0;
    if (total < 200000) {
      console.log('[RNF-001-01b] Carrito no alcanza el monto mínimo de $200.000. Test omitido.');
      return;
    }

    const inicio = Date.now();
    const pedido = await peticionJson('/api/v1/pedidos', {
      metodo: 'POST',
      encabezados,
      datos: { direccionEntrega: 'Carrera 7 # 45-10, Medellín' },
    });
    const duracion = Date.now() - inicio;

    console.log(`[RNF-001-01b] Generación de pedido: ${duracion}ms (total carrito $${total}, HTTP ${pedido?.status})`);
    expect(pedido?.ok).toBe(true);
    expect(duracion).toBeLessThanOrEqual(LIMITE_P95_MS);
  });

  test('CP-RNF-001-02: la confirmación de entrega con subida de evidencias a Cloudinary no supera 5s', async () => {
    if (!backendActivo) {
      console.log('[RNF-001-02] Backend no disponible, test omitido.');
      return;
    }

    const login = await peticionJson('/api/v1/auth/login', {
      metodo: 'POST',
      datos: USUARIO_ADMIN,
    });
    if (!login?.ok) {
      console.log('[RNF-001-02] No se pudo autenticar como Admin, test omitido.');
      return;
    }

    const token = login.body.token;
    const encabezados = { Authorization: `Bearer ${token}` };

    const lista = await peticionJson('/api/v1/admin/pedidos', { encabezados });
    const pedidos = Array.isArray(lista?.body?.data) ? lista.body.data : [];
    const elegible = pedidos.find((p) =>
      ['EN_CAMINO', 'ASIGNADO', 'CONFIRMADO'].includes(p.estado)
    );

    if (!elegible) {
      console.log('[RNF-001-02] Sin pedido elegible para entregar (estado EN_CAMINO/ASIGNADO/CONFIRMADO). Test omitido.');
      return;
    }

    const idPedido = elegible.id_pedido ?? elegible.id;
    const estadoOriginal = elegible.estado;
    const formulario = new FormData();
    formulario.append(
      'fotoEvidencia',
      new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==', 'base64')], {
        type: 'image/png',
      }),
      'evidencia-rnf.png'
    );

    const inicio = Date.now();
    const respuesta = await fetch(`${getBackendBaseUrl()}/api/v1/admin/pedidos/${idPedido}/entregar`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formulario,
    });
    const duracion = Date.now() - inicio;

    if (dbActiva && estadoOriginal) {
      await pool
        .execute('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estadoOriginal, idPedido])
        .catch(() => null);
    }

    console.log(`[RNF-001-02] Entrega pedido ${idPedido}: ${duracion}ms (HTTP ${respuesta.status})`);
    expect(respuesta.ok).toBe(true);
    expect(duracion).toBeLessThanOrEqual(LIMITE_P95_MS);
  });

  test('CP-RNF-001-03: comportamiento estable bajo estrés con carga normal de usuarios', async () => {
    if (!backendActivo) {
      console.log('[RNF-001-03] Backend no disponible, test omitido.');
      return;
    }

    const resultado = await ejecutarCarga({
      usuarios: 40,
      iteraciones: 5,
      peticiones: [
        { path: '/api/v1/productos/publico' },
        { path: '/api/v1/productos/1' },
      ],
    });

    console.log(`[RNF-001-03] Estrés carga normal -> ${JSON.stringify(resultado)}`);
    expect(resultado.tasaFallos).toBeLessThan(0.05);
    expect(resultado.p95Ms).toBeLessThanOrEqual(LIMITE_P95_MS);
  });
});