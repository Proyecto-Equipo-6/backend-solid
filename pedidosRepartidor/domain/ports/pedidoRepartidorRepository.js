/**
 * Port: PedidoRepartidorRepository
 * Contrato que cualquier adaptador de persistencia (Prisma, memoria, etc.)
 * debe implementar para que los casos de uso funcionen sin conocer la BD.
 * (Principio de Inversión de Dependencias - DIP)
 */
export class PedidoRepartidorRepository {
  /**
   * CU-015: pedidos asignados al repartidor para el día actual, ordenados
   * por fecha de asignación ascendente (RN-060).
   * @returns {Promise<Pedido[]>}
   */
  async obtenerPedidosAsignadosDelDia(_repartidorId, _fecha) {
    throw new Error('Método "obtenerPedidosAsignadosDelDia" no implementado.');
  }

  /**
   * CU-016: detalle ampliado de un pedido puntual.
   * @returns {Promise<Pedido|null>}
   */
  async obtenerPedidoPorId(_idPedido) {
    throw new Error('Método "obtenerPedidoPorId" no implementado.');
  }

  /**
   * CU-017: persiste el cambio de estado y guarda el registro de seguimiento.
   * `datos` puede incluir fotoEvidenciaUrl u observacion según el caso.
   * @returns {Promise<Pedido>}
   */
  async actualizarEstadoPedido(_idPedido, _estadoNuevo, _datos) {
    throw new Error('Método "actualizarEstadoPedido" no implementado.');
  }

  /**
   * CU-018: pedidos ya finalizados (Entregado / No entregado / Cancelado)
   * asociados al repartidor, con filtros opcionales.
   * @returns {Promise<Pedido[]>}
   */
  async obtenerHistorialPedidos(_repartidorId, _filtros) {
    throw new Error('Método "obtenerHistorialPedidos" no implementado.');
  }

  /**
   * CU-018: conteos para las métricas de "Total mes" / "Total semana" (RN-073).
   * @returns {Promise<{ totalMes: number, totalSemana: number }>}
   */
  async contarPedidosDelPeriodo(_repartidorId) {
    throw new Error('Método "contarPedidosDelPeriodo" no implementado.');
  }
}
