const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: ObtenerDetallePedidoClienteUseCase
 * Consulta el detalle completo de un pedido del cliente autenticado,
 * incluyendo sus productos con imagen (CU-013 / HU-005.4).
 * RN-037/RN-039: el pedido debe pertenecer al cliente que lo consulta.
 */
class ObtenerDetallePedidoClienteUseCase {
  constructor(pedidoRepository, pedidoRepartidorRepository) {
    this.pedidoRepository = pedidoRepository;
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
  }

  async execute(usuario, idPedido) {
    const pedido = await this.pedidoRepository.obtenerPedidoPorId(idPedido);
    if (!pedido || pedido.id_usuario !== usuario.id_usuario) {
      throw new ErrorNoEncontrado('Pedido no encontrado');
    }

    const detalles = await this.pedidoRepartidorRepository.obtenerDetallesPorPedido(idPedido);

    return {
      id_pedido: pedido.id_pedido,
      id_metodo_pago: pedido.id_metodo_pago,
      direccion_entrega: pedido.direccion_entrega,
      total: pedido.total,
      estado: pedido.estado,
      observaciones: pedido.observaciones,
      motivo_cancelacion: pedido.motivo_cancelacion,
      fecha_pedido: pedido.fecha_pedido,
      productos: detalles.map((d) => ({
        id_producto: d.id_producto,
        nombre: d.producto_nombre || `Producto #${d.id_producto}`,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
        imagen_url: d.imagen_url,
      })),
    };
  }
}

module.exports = ObtenerDetallePedidoClienteUseCase;