const PedidoRepository = require('../../../domain/ports/PedidoRepository');

/**
 * Adaptador de Infraestructura: InMemoryPedidoRepository
 * Implementación en memoria para pruebas funcionales sin base de datos.
 * Simula la transacción ACID de creación de pedido (RN-041).
 */
class InMemoryPedidoRepository extends PedidoRepository {
  constructor() {
    super();
    this.pedidos = [];
    this._siguienteId = 1;
  }

  async crearPedidoConTransaccion({ idUsuario, idMetodoPago, direccionEntrega, observaciones, items, total }) {
    const idPedido = this._siguienteId++;
    const pedido = {
      id_pedido: idPedido,
      id_usuario: idUsuario,
      id_metodo_pago: idMetodoPago,
      direccion_entrega: direccionEntrega,
      total,
      estado: 'PENDIENTE',
      observaciones: observaciones || null,
      motivo_cancelacion: null,
      fecha_pedido: new Date().toISOString(),
      items: items.map((item) => ({ ...item })),
    };
    this.pedidos.push(pedido);
    return { id_pedido: idPedido, fecha_pedido: pedido.fecha_pedido };
  }

  async obtenerPedidosPorUsuario(idUsuario) {
    return this.pedidos
      .filter((pedido) => pedido.id_usuario === idUsuario)
      .map(({ items, ...resto }) => resto);
  }

  async obtenerPedidoPorId(idPedido) {
    return this.pedidos.find((pedido) => pedido.id_pedido === idPedido) || null;
  }

  async cancelarPedido(idPedido, motivo) {
    const pedido = this.pedidos.find((p) => p.id_pedido === idPedido);
    if (!pedido || !['PENDIENTE', 'ASIGNADO'].includes(pedido.estado)) return false;
    pedido.estado = 'CANCELADO';
    pedido.motivo_cancelacion = motivo;
    return true;
  }
}

module.exports = InMemoryPedidoRepository;