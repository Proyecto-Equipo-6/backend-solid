const InMemoryPedidoRepartidorRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const ActualizarEstadoPedidoUseCase = require('../application/actualizarEstadoPedidoUseCase.js');
const Pedido = require('../domain/models/Pedido.js');

const crearPedido = (estado = 'ASIGNADO') => new Pedido({
  id_pedido: 1,
  id_usuario: 10,
  id_repartidor: 10,
  id_metodo_pago: 1,
  direccion_entrega: 'Calle 123',
  total: 50000,
  estado,
  comprobante_url: null,
  observaciones: null,
  motivo_cancelacion: null,
  fecha_pedido: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
  clienteNombre: 'María',
  clienteTelefono: '3001234567',
  caracteristicasLogistica: 'Frágil'
});

describe('ActualizarEstadoPedidoUseCase', () => {
  test('Flujo feliz 1: ASIGNADO -> EN_CAMINO', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('ASIGNADO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(1, 'EN_CAMINO', 'ASIGNADO');

    expect(pedidoActualizado.estado).toBe('EN_CAMINO');
  });

  test('Flujo feliz 2: EN_CAMINO -> ENTREGADO con foto', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_CAMINO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(1, 'ENTREGADO', 'EN_CAMINO', { foto: 'base64-foto' });

    expect(pedidoActualizado.estado).toBe('ENTREGADO');
  });

  test('Flujo de excepción 1: ENTREGADO sin foto debe fallar', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_CAMINO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'ENTREGADO', 'EN_CAMINO')
    ).rejects.toThrow('La foto es obligatoria para confirmar la entrega');
  });

  test('Flujo de excepción 2: NO_ENTREGADO sin observación debe fallar', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_CAMINO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'NO_ENTREGADO', 'EN_CAMINO')
    ).rejects.toThrow('La observación es obligatoria para marcar No Entregado');
  });

  test('CP-CU-017-08: No permite modificar un pedido finalizado', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('ENTREGADO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'EN_CAMINO', 'ENTREGADO')
    ).rejects.toThrow('Transición inválida');
  });

  test('Flujo exitoso: EN_CAMINO -> NO_ENTREGADO con observación', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_CAMINO')]);
  const useCase = new ActualizarEstadoPedidoUseCase(repo);

  const pedidoActualizado = await useCase.ejecutar(1, 'NO_ENTREGADO', 'EN_CAMINO', {
    observacion: 'Cliente no responde'
  });

  expect(pedidoActualizado.estado).toBe('NO_ENTREGADO');
});
});