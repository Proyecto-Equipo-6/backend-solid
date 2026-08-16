import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import ActualizarEstadoPedidoUseCase from '../application/actualizarEstadoPedidoUseCase.js';
import Pedido from '../domain/models/Pedido.js';

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
  fecha_actualizacion: new Date().toISOString()
});

describe('ActualizarEstadoPedidoUseCase', () => {
  test('Flujo feliz 1: ASIGNADO -> EN_RUTA', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('ASIGNADO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(1, 'EN_RUTA', 'ASIGNADO');

    expect(pedidoActualizado.estado).toBe('EN_RUTA');
  });

  test('Flujo feliz 2: EN_RUTA -> ENTREGADO con foto', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_RUTA')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(1, 'ENTREGADO', 'EN_RUTA', { foto: 'base64-foto' });

    expect(pedidoActualizado.estado).toBe('ENTREGADO');
  });

  test('Flujo de excepción 1: ENTREGADO sin foto debe fallar', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_RUTA')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'ENTREGADO', 'EN_RUTA')
    ).rejects.toThrow('La foto es obligatoria para confirmar la entrega');
  });

  test('Flujo de excepción 2: NO_ENTREGADO sin observación debe fallar', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_RUTA')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'NO_ENTREGADO', 'EN_RUTA')
    ).rejects.toThrow('La observación es obligatoria para marcar No Entregado');
  });
});

test('CP-CU-017-08: No permite modificar un pedido finalizado', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([crearPedido('ENTREGADO')]);
  const useCase = new ActualizarEstadoPedidoUseCase(repo);

  // Intentar cambiar de ENTREGADO a EN_RUTA (estado anterior ENTREGADO)
  await expect(
    useCase.ejecutar(1, 'EN_RUTA', 'ENTREGADO')
  ).rejects.toThrow('Transición inválida');
});