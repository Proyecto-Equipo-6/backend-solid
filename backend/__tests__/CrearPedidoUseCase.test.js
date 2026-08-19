const CrearPedidoUseCase = require('../application/CrearPedidoUseCase');
const InMemoryCarritoRepository = require('../infraestructure/repositories/in-memory/InMemoryCarritoRepository');
const InMemoryPedidoRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepository');

const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

const PRODUCTO = {
  id: 1,
  titulo: 'Juego Utensilios Pro',
  imagen: null,
  precio: 250000,
  stock: 100,
  garantia: '6 meses',
};

function crearCarritoConProducto(producto, cantidad) {
  const repositorio = new InMemoryCarritoRepository();
  repositorio.agregarProducto(CLIENTE.id_usuario, producto, cantidad);
  return repositorio;
}

describe('CrearPedidoUseCase', () => {
  it('genera un pedido PENDIENTE con el total del carrito (RN-042, RN-045)', async () => {
    const carritoRepository = crearCarritoConProducto(PRODUCTO, 1);
    const pedidoRepository = new InMemoryPedidoRepository();
    const casoUso = new CrearPedidoUseCase(carritoRepository, pedidoRepository);

    const resultado = await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10 # 5-20, Medellín' });

    expect(resultado.pedido.estado).toBe('PENDIENTE');
    expect(resultado.pedido.total).toBe(250000);
    expect(resultado.pedido.id_pedido).toBe(1);
    expect(pedidoRepository.pedidos).toHaveLength(1);
  });

  it('rechaza pedido sin dirección de entrega', async () => {
    const carritoRepository = crearCarritoConProducto(PRODUCTO, 1);
    const casoUso = new CrearPedidoUseCase(carritoRepository, new InMemoryPedidoRepository());

    const error = await casoUso.execute(CLIENTE, {}).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('dirección');
  });

  it('rechaza pedido con carrito vacío (RN-047)', async () => {
    const carritoRepository = new InMemoryCarritoRepository();
    const casoUso = new CrearPedidoUseCase(carritoRepository, new InMemoryPedidoRepository());

    const error = await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10' }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('vacío');
  });

  it('rechaza pedido que no cumple el monto mínimo de $200.000 (RN-044)', async () => {
    const carritoRepository = crearCarritoConProducto({ ...PRODUCTO, precio: 150000 }, 1);
    const casoUso = new CrearPedidoUseCase(carritoRepository, new InMemoryPedidoRepository());

    const error = await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10' }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('$200.000');
  });

  it('rechaza pedido si el stock no alcanza (RN-041)', async () => {
    const carritoRepository = crearCarritoConProducto({ ...PRODUCTO, stock: 1 }, 5);
    const casoUso = new CrearPedidoUseCase(carritoRepository, new InMemoryPedidoRepository());

    const error = await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10' }).catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toContain('No hay unidades suficientes');
  });

  it('requiere sesión iniciada (RN-037)', async () => {
    const carritoRepository = crearCarritoConProducto(PRODUCTO, 1);
    const casoUso = new CrearPedidoUseCase(carritoRepository, new InMemoryPedidoRepository());

    const error = await casoUso.execute(null, { direccionEntrega: 'Calle 10' }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('iniciar sesión');
  });
<<<<<<< Updated upstream
=======

  it('usa Efectivo / Contraentrega por defecto (id_metodo_pago = 1)', async () => {
    const carritoRepository = crearCarritoConProducto(PRODUCTO, 1);
    const pedidoRepository = new InMemoryPedidoRepository();
    const casoUso = new CrearPedidoUseCase(carritoRepository, pedidoRepository);

    await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10' });

    expect(pedidoRepository.pedidos[0].id_metodo_pago).toBe(1);
  });

  it('el pedido refleja exactamente los productos y cantidades del carrito (CP-CU-012-08)', async () => {
  const carritoRepository = crearCarritoConProducto(PRODUCTO, 2); // 2 unidades
  const pedidoRepository = new InMemoryPedidoRepository();
  const casoUso = new CrearPedidoUseCase(carritoRepository, pedidoRepository);

  await casoUso.execute(CLIENTE, { direccionEntrega: 'Calle 10' });

  // El pedido se guardó en el repositorio con sus items
  const pedidoGuardado = pedidoRepository.pedidos[0];

  expect(pedidoGuardado).toMatchObject({
    id_pedido: 1,
    estado: 'PENDIENTE',
    total: 500000, // 250000 * 2
  });

  expect(pedidoGuardado.items).toHaveLength(1);
  expect(pedidoGuardado.items[0]).toMatchObject({
    idProducto: 1,
    cantidad: 2,
    precio: 250000,
    subtotal: 500000,
  });
  });
>>>>>>> Stashed changes
});