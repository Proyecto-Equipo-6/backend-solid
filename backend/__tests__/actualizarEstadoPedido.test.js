import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import ActualizarEstadoPedidoUseCase from '../application/actualizarEstadoPedidoUseCase.js';
import Pedido from '../domain/models/Pedido.js';

// Helper para crear pedidos con el estado indicado
const crearPedido = (estado = 'ASIGNADO') => new Pedido({
  idPedido: 1,
  idUsuario: 10, // id_usuario del repartidor
  idMetodoPago: 1,
  direccion: 'Calle 123',
  estado,
  clienteNombre: 'María',
  clienteTelefono: '3001234567',
  caracteristicasLogistica: 'Frágil',
  fechaAsignacion: new Date().toISOString(),
  fechaActualizacion: new Date().toISOString()
});

describe('ActualizarEstadoPedidoUseCase', () => {
  test('Flujo feliz 1: ASIGNADO -> EN_CAMINO', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('ASIGNADO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(
      1,
      'EN_CAMINO',
      'ASIGNADO'
    );

    expect(pedidoActualizado.estado).toBe('EN_CAMINO');
  });

  test('Flujo feliz 2: EN_CAMINO -> ENTREGADO con foto', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido('EN_CAMINO')]);
    const useCase = new ActualizarEstadoPedidoUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(
      1,
      'ENTREGADO',
      'EN_CAMINO',
      { foto: 'base64-de-la-foto' }
    );

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
});