class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Llamamos al repositorio con el estado anterior para validar concurrencia
    return await this.pedidoRepo.actualizarEstado(
      pedidoId,
      nuevoEstado,
      estadoAnterior,
      datosAdicionales
    );
  }
}

module.exports = ActualizarEstadoPedidoUseCase;