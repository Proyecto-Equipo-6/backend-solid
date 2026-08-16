const {
  PedidoNoEncontradoError,
  EvidenciaFotograficaRequeridaError,
  ObservacionRequeridaError,
} = require('../domain/errors/pedidoErrors');
const { ESTADOS_PEDIDO } = require('../domain/models/Pedido');

/**
 * CU-017 · Actualizar estado del pedido (repartidor)
 * Mueve el pedido por el flujo Asignado -> En camino -> Entregado,
 * o lo registra como "No entregado" cuando ocurre una excepción de entrega
 * (RN-065 a RN-070).
 */
class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const pedido = await this.pedidoRepo.obtenerPedidoPorId(pedidoId);

    // FE-001/PC-002: no existe o no está asignado a este repartidor.
    if (!pedido) {
      throw new PedidoNoEncontradoError('El pedido ya no está disponible.');
    }

    // RN-065/RN-070: valida la transición contra la máquina de estados del dominio.
    pedido.validarTransicionA(nuevoEstado);

    // RN-066/FA-001: la foto es obligatoria para marcar "Entregado".
    if (nuevoEstado === ESTADOS_PEDIDO.ENTREGADO && !datosAdicionales.foto) {
      throw new EvidenciaFotograficaRequeridaError();
    }

    // RN-067: la observación es obligatoria para marcar "No entregado".
    if (nuevoEstado === ESTADOS_PEDIDO.NO_ENTREGADO && !datosAdicionales.observacion) {
      throw new ObservacionRequeridaError();
    }

    // El repositorio valida concurrencia con el estado anterior.
    return await this.pedidoRepo.actualizarEstadoPedido(
      pedidoId,
      nuevoEstado,
      estadoAnterior,
      datosAdicionales
    );
  }
}

module.exports = ActualizarEstadoPedidoUseCase;