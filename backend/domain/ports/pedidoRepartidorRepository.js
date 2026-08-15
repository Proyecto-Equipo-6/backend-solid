class PedidoRepartidorRepository {
  /**
   * Obtiene los pedidos asignados a un repartidor para el día actual.
   * Devuelve solo pedidos en estado ASIGNADO, ordenados por fecha/hora de asignación ascendente.
   * @param {number} repartidorId
   * @returns {Promise<Pedido[]>}
   */
  async obtenerPedidosDelDia(repartidorId) {
    throw new Error('Método obtenerPedidosDelDia no implementado');
  }

  /**
   * Obtiene el detalle de un pedido específico para el repartidor.
   * No incluye productos del pedido.
   * @param {number} pedidoId
   * @returns {Promise<Pedido|null>}
   */
  async obtenerDetallePedido(pedidoId) {
    throw new Error('Método obtenerDetallePedido no implementado');
  }

  /**
   * Actualiza el estado de un pedido siguiendo la máquina de estados.
   * @param {number} pedidoId
   * @param {string} nuevoEstado
   * @param {object} datosAdicionales - { foto, observacion }
   * @returns {Promise<Pedido>}
   */
  async actualizarEstado(pedidoId, nuevoEstado, datosAdicionales = {}) {
    throw new Error('Método actualizarEstado no implementado');
  }
}

module.exports = PedidoRepartidorRepository;