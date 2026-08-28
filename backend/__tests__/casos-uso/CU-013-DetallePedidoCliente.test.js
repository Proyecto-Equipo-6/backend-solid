const ObtenerDetallePedidoClienteUseCase = require('../../application/ObtenerDetallePedidoClienteUseCase');
const InMemoryPedidoRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepository');
const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository');

describe('CU-013 Ver detalle pedido cliente (ObtenerDetallePedidoClienteUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  function crearRepositorios() {
    const pedidoRepo = new InMemoryPedidoRepository();
    pedidoRepo.pedidos.push({
      id_pedido: 1,
      id_usuario: 2,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 123',
      total: 250000,
      estado: 'PENDIENTE',
      observaciones: null,
      motivo_cancelacion: null,
      fecha_pedido: '2026-08-10T10:00:00',
    });
    pedidoRepo.pedidos.push({
      id_pedido: 2,
      id_usuario: 99,
      id_metodo_pago: 1,
      direccion_entrega: 'Carrera 45',
      total: 50000,
      estado: 'PENDIENTE',
      observaciones: null,
      motivo_cancelacion: null,
      fecha_pedido: '2026-08-12T10:00:00',
    });

    const detallesRepo = new InMemoryPedidoRepartidorRepository();
    detallesRepo.agregarDetallePedido({
      id_pedido: 1,
      id_producto: 10,
      cantidad: 2,
      precio_unitario: 50000,
      subtotal: 100000,
      producto_nombre: 'Televisor 43"',
      imagen_url: 'https://cloudinary.com/tv.jpg',
    });

    return { pedidoRepo, detallesRepo };
  }

  it('CP-CU-013-09: devuelve el detalle del pedido propio con sus productos e imagen', async () => {
    const { pedidoRepo, detallesRepo } = crearRepositorios();
    const casoUso = new ObtenerDetallePedidoClienteUseCase(pedidoRepo, detallesRepo);

    const resultado = await casoUso.execute(CLIENTE, 1);

    expect(resultado.id_pedido).toBe(1);
    expect(resultado.direccion_entrega).toBe('Calle 123');
    expect(resultado.productos).toHaveLength(1);
    expect(resultado.productos[0]).toMatchObject({
      id_producto: 10,
      cantidad: 2,
      imagen_url: 'https://cloudinary.com/tv.jpg',
    });
  });

  it('CP-CU-013-10: lanza ErrorNoEncontrado si el pedido no existe', async () => {
    const { pedidoRepo, detallesRepo } = crearRepositorios();
    const casoUso = new ObtenerDetallePedidoClienteUseCase(pedidoRepo, detallesRepo);

    await expect(casoUso.execute(CLIENTE, 999)).rejects.toThrow('Pedido no encontrado');
  });

  it('CP-CU-013-11: aislamiento por usuario, no ve pedidos ajenos (RN-049)', async () => {
    const { pedidoRepo, detallesRepo } = crearRepositorios();
    const casoUso = new ObtenerDetallePedidoClienteUseCase(pedidoRepo, detallesRepo);

    await expect(casoUso.execute(CLIENTE, 2)).rejects.toThrow('Pedido no encontrado');
  });
});