class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  /**
   * Ejecuta la actualización del estado de un pedido.
   * @param {number} pedidoId
   * @param {string} nuevoEstado
   * @param {string} estadoAnterior - Estado esperado para validar concurrencia.
   * @param {object} datosAdicionales - Puede contener { foto, observacion }.
   * @returns {Promise<Pedido>}
   */
  async ejecutar(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    // Delegamos toda la lógica al repositorio, que ya implementa:
    // - Validación de máquina de estados (transiciones permitidas)
    // - Validación de foto obligatoria para ENTREGADO
    // - Validación de observación obligatoria para NO_ENTREGADO
    // - Simulación de concurrencia comparando estadoAnterior
    return await this.pedidoRepo.actualizarEstado(
      pedidoId,
      nuevoEstado,
      estadoAnterior,
      datosAdicionales
    );
  }
}

module.exports = ActualizarEstadoPedidoUseCase;