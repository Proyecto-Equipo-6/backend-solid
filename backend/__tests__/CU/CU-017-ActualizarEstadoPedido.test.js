const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const ActualizarEstadoPedidoUseCase = require('../../application/actualizarEstadoPedidoUseCase.js');
const { crearPedido } = require('./helpers/pedidos');

function crearUseCase(estado) {
  const repo = new InMemoryPedidoRepartidorRepository([crearPedido({ estado })]);
  return new ActualizarEstadoPedidoUseCase(repo);
}

async function transicion(estadoOrigen, destino, args) {
  const useCase = crearUseCase(estadoOrigen);
  return useCase.ejecutar(1, destino, estadoOrigen, args);
}

async function rechazo(estadoOrigen, destino, msg, args) {
  const useCase = crearUseCase(estadoOrigen);
  await expect(useCase.ejecutar(1, destino, estadoOrigen, args)).rejects.toThrow(msg);
}

describe('ActualizarEstadoPedidoUseCase', () => {
  test('Flujo feliz 1: ASIGNADO -> EN_CAMINO', async () => {
    const pedidoActualizado = await transicion('ASIGNADO', 'EN_CAMINO');
    expect(pedidoActualizado.estado).toBe('EN_CAMINO');
  });

  test('Flujo feliz 2: EN_CAMINO -> ENTREGADO con foto válida', async () => {
    const pedidoActualizado = await transicion('EN_CAMINO', 'ENTREGADO', {
      foto: { formato: 'jpg', tamano: 102400 }
    });
    expect(pedidoActualizado.estado).toBe('ENTREGADO');
    expect(pedidoActualizado.comprobante_url).toContain('evidencia_1');
  });

  test('Flujo de excepción 1: ENTREGADO sin foto debe fallar', async () => {
    await rechazo('EN_CAMINO', 'ENTREGADO', 'La foto es obligatoria para confirmar la entrega');
  });

  test('Flujo de excepción 2: NO_ENTREGADO sin observación debe fallar', async () => {
    await rechazo('EN_CAMINO', 'NO_ENTREGADO', 'La observación es obligatoria para marcar No Entregado');
  });

  test('No permite modificar un pedido finalizado', async () => {
    await rechazo('ENTREGADO', 'EN_CAMINO', 'Transición inválida');
  });

  test('Flujo exitoso: EN_CAMINO -> NO_ENTREGADO con observación', async () => {
    const pedidoActualizado = await transicion('EN_CAMINO', 'NO_ENTREGADO', {
      observacion: 'Cliente no responde'
    });
    expect(pedidoActualizado.estado).toBe('NO_ENTREGADO');
  });
});
