class ObtenerDetallePedidoAdminUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(id_pedido) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const detalles = await this.pedidoRepo.obtenerDetallesPorPedido(id_pedido);

    return {
      id_pedido: pedido.id_pedido,
      cliente: {
        nombre: pedido.clienteNombre || 'Cliente no especificado',
        telefono: pedido.clienteTelefono || 'No registrado'
      },
      direccion_entrega: pedido.direccion_entrega,
      total: pedido.total,
      estado: pedido.estado,
      comprobante_url: pedido.comprobante_url,
      productos: detalles.map(d => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal
      }))
    };
  }
}

module.exports = ObtenerDetallePedidoAdminUseCase;