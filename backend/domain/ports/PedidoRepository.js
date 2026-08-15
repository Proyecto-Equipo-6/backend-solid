/**
 * Port: PedidoRepository
 * Define el contrato que cualquier adaptador de persistencia de pedidos
 * debe implementar (Principio de Inversión de Dependencias - DIP).
 */
class PedidoRepository {
  async crearPedidoConTransaccion({ idUsuario, idMetodoPago, direccionEntrega, observaciones, items, total }) {
    throw new Error("Método 'crearPedidoConTransaccion' no implementado");
  }

  async obtenerPedidosPorUsuario(idUsuario) {
    throw new Error("Método 'obtenerPedidosPorUsuario' no implementado");
  }

  async obtenerPedidoPorId(idPedido) {
    throw new Error("Método 'obtenerPedidoPorId' no implementado");
  }

  async cancelarPedido(idPedido, idUsuario, motivo) {
    throw new Error("Método 'cancelarPedido' no implementado");
  }
}

module.exports = PedidoRepository;