/**
 * Puerto PedidoRepartidorRepository
 * Define las operaciones que el módulo repartidor necesita del repositorio.
 */
class PedidoRepartidorRepository {
  async obtenerPedidosDelDia(repartidorId) {
    throw new Error('Método obtenerPedidosDelDia no implementado');
  }

  async obtenerDetallePedido(pedidoId) {
    throw new Error('Método obtenerDetallePedido no implementado');
  }

  async actualizarEstado(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    throw new Error('Método actualizarEstado no implementado');
  }

  async obtenerTodos(filtros = {}) {
    throw new Error('Método obtenerTodos no implementado');
  }

  async contarPedidosDelDia(repartidorId) {
    throw new Error('Método contarPedidosDelDia no implementado');
  }

  async actualizarPedido(idPedido, cambios) {
    throw new Error('Método actualizarPedido no implementado');
  }

  async obtenerDetallesPorPedido(id_pedido) {
    throw new Error('Método obtenerDetallesPorPedido no implementado');
  }

  async obtenerHistorialPedidos(repartidorId, filtros = {}) {
    throw new Error('Método obtenerHistorialPedidos no implementado');
  }

  async contarPedidosDelPeriodo(repartidorId) {
    throw new Error('Método contarPedidosDelPeriodo no implementado');
  }

  async contarPedidosDeHoyParaMetrica(repartidorId) {
    throw new Error('Método contarPedidosDeHoyParaMetrica no implementado');
  }
}

module.exports = PedidoRepartidorRepository;