const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const ActualizarEstadoPedidoUseCase = require('../../application/actualizarEstadoPedidoUseCase.js');
const { crearPedido } = require('../helpers/pedidos');

function crearUseCase(estado) {
  const repo = new InMemoryPedidoRepartidorRepository([crearPedido({ estado })]);
  return new ActualizarEstadoPedidoUseCase(repo);
}

describe('ActualizarEstadoPedidoUseCase', () => {
  test('Flujo feliz 1: ASIGNADO -> EN_CAMINO', async () => {
    const useCase = crearUseCase('ASIGNADO');

    const pedidoActualizado = await useCase.ejecutar(1, 'EN_CAMINO', 'ASIGNADO');

    expect(pedidoActualizado.estado).toBe('EN_CAMINO');
  });

  test('Flujo feliz 2: EN_CAMINO -> ENTREGADO con foto válida', async () => {
    const useCase = crearUseCase('EN_CAMINO');

    const pedidoActualizado = await useCase.ejecutar(1, 'ENTREGADO', 'EN_CAMINO', {
      foto: { formato: 'jpg', tamano: 102400 }
    });

    expect(pedidoActualizado.estado).toBe('ENTREGADO');
    expect(pedidoActualizado.comprobante_url).toContain('evidencia_1');
  });

  test('Flujo de excepción 1: ENTREGADO sin foto debe fallar', async () => {
    const useCase = crearUseCase('EN_CAMINO');

    await expect(
      useCase.ejecutar(1, 'ENTREGADO', 'EN_CAMINO')
    ).rejects.toThrow('La foto es obligatoria para confirmar la entrega');
  });

  test('Flujo de excepción 2: NO_ENTREGADO sin observación debe fallar', async () => {
    const useCase = crearUseCase('EN_CAMINO');

    await expect(
      useCase.ejecutar(1, 'NO_ENTREGADO', 'EN_CAMINO')
    ).rejects.toThrow('La observación es obligatoria para marcar No Entregado');
  });

  test('No permite modificar un pedido finalizado', async () => {
    const useCase = crearUseCase('ENTREGADO');

    await expect(
      useCase.ejecutar(1, 'EN_CAMINO', 'ENTREGADO')
    ).rejects.toThrow('Transición inválida');
  });

  test('Flujo exitoso: EN_CAMINO -> NO_ENTREGADO con observación', async () => {
    const useCase = crearUseCase('EN_CAMINO');

    const pedidoActualizado = await useCase.ejecutar(1, 'NO_ENTREGADO', 'EN_CAMINO', {
      observacion: 'Cliente no responde'
    });

    expect(pedidoActualizado.estado).toBe('NO_ENTREGADO');
  });
});