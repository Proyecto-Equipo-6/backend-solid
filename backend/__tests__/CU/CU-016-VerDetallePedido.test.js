const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerDetallePedidoUseCase = require('../../application/verDetallePedidoUseCase.js');
const { crearPedido } = require('./helpers/pedidos');

describe('CU-016: Ver detalles pedido', () => {
  test('Flujo feliz, el repartidor asignado ve todos los detalles excepto productos', async () => {
    const pedido = crearPedido({ id_pedido: 1, id_repartidor: 10 });
    const repo = new InMemoryPedidoRepartidorRepository([pedido]);
    const useCase = new VerDetallePedidoUseCase(repo);

    const detalle = await useCase.ejecutar(1, 10);

    expect(detalle.id_pedido).toBe(1);
    expect(detalle.clienteNombre).toBe('María');
    expect(detalle.clienteTelefono).toBe('3001234567');
    expect(detalle.estado).toBe('ASIGNADO');
    expect(detalle.caracteristicasLogistica).toBe('Frágil');
    expect(detalle.diagramaSeguimiento).toEqual(['ASIGNADO', 'EN_CAMINO', 'ENTREGADO']);
    expect(detalle).not.toHaveProperty('productos');
  });

  test('Flujo de seguridad, otro repartidor no puede ver los datos', async () => {
    const pedido = crearPedido({ id_pedido: 1, id_repartidor: 10 });
    const repo = new InMemoryPedidoRepartidorRepository([pedido]);
    const useCase = new VerDetallePedidoUseCase(repo);

    await expect(useCase.ejecutar(1, 20)).rejects.toThrow('Acceso denegado');
  });

  test('Error al cargar los detalles del pedido', async () => {
  const repoFalso = {
    obtenerDetallePedido: jest.fn().mockRejectedValue(new Error('Fallo de conexión'))
  };

  const useCase = new VerDetallePedidoUseCase(repoFalso);

  await expect(useCase.ejecutar(1, 10)).rejects.toThrow('No se pudieron cargar los detalles del pedido');
});

  test('Pedido cancelado no está disponible', async () => {
    const pedido = crearPedido({ id_pedido: 1, id_repartidor: 10, estado: 'CANCELADO' });
  const repo = new InMemoryPedidoRepartidorRepository([pedido]);
  const useCase = new VerDetallePedidoUseCase(repo);

  await expect(useCase.ejecutar(1, 10)).rejects.toThrow('El pedido ya no está disponible');
  });
});