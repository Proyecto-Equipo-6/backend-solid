class PedidoRepartidorRepository {
  /**
   * Obtiene los pedidos asignados a un repartidor para el día actual.
   * Devuelve solo pedidos en estado ASIGNADO, ordenados por fecha/hora de asignación ascendente.
   * @param {number} repartidorId
   * @returns {Promise<Pedido[]>}
   */
  async obtenerPedidosAsignadosDelDia(repartidorId) {
    throw new Error('Método obtenerPedidosAsignadosDelDia no implementado');
  }

  /**
   * Obtiene el detalle de un pedido específico para el repartidor.
   * No incluye productos del pedido.
   * @param {number} pedidoId
   * @returns {Promise<Pedido|null>}
   */
  async obtenerPedidoPorId(pedidoId) {
    throw new Error('Método obtenerPedidoPorId no implementado');
  }

  /**
   * Actualiza el estado de un pedido siguiendo la máquina de estados.
   * @param {number} pedidoId
   * @param {string} nuevoEstado
   * @param {string} estadoAnterior - estado esperado para validar concurrencia
   * @param {object} datosAdicionales - { foto, observacion }
   * @returns {Promise<Pedido>}
   */
  async actualizarEstadoPedido(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    throw new Error('Método actualizarEstadoPedido no implementado');
  }

  /**
   * CU-018 · Obtiene el historial de pedidos finalizados del repartidor.
   * Solo estados ENTREGADO, NO_ENTREGADO o CANCELADO (RN-071/RN-072/RN-075).
   * @param {number} repartidorId
   * @param {object} filtros - { filtroEstado }
   * @returns {Promise<Array<{ id_pedido, fechaEntregaReal, estado, direccion_entrega }>>}
   */
  async obtenerHistorialPedidos(repartidorId, filtros = {}) {
    throw new Error('Método obtenerHistorialPedidos no implementado');
  }

  /**
   * CU-018 · Cuenta los pedidos finalizados del repartidor en el mes y la semana actuales.
   * @param {number} repartidorId
   * @returns {Promise<{ totalMes: number, totalSemana: number }>}
   */
  async contarPedidosDelPeriodo(repartidorId) {
    throw new Error('Método contarPedidosDelPeriodo no implementado');
  }
}

module.exports = PedidoRepartidorRepository;