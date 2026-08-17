class CancelarPedidoAdminUseCase {
  constructor(pedidoRepo, productoRepo, repartidorRepo) {
    this.pedidoRepo = pedidoRepo;
    this.productoRepo = productoRepo;
    this.repartidorRepo = repartidorRepo;
  }

  async ejecutar(id_pedido, motivo_cancelacion, { observaciones = '', reintegrar_stock = true } = {}) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (['ENTREGADO', 'CANCELADO'].includes(pedido.estado)) {
      throw new Error('No se puede cancelar un pedido en este estado');
    }

    if (pedido.estado === 'EN_CAMINO') {
      throw new Error('No se puede cancelar un pedido en este estado');
    }

    if (!motivo_cancelacion) {
      throw new Error('Toda cancelación debe registrar un motivo');
    }

    if (motivo_cancelacion === 'Otro' && (!observaciones || observaciones.trim() === '')) {
      throw new Error('Debe especificar el motivo en la observación');
    }

    if (reintegrar_stock === true) {
      const detalles = await this.pedidoRepo.obtenerDetallesPorPedido(id_pedido);
      for (const detalle of detalles) {
        await this.productoRepo.reintegrarInventario(detalle.id_producto, detalle.cantidad);
      }
    }

    if (pedido.id_repartidor !== null && pedido.id_repartidor !== undefined) {
      await this.repartidorRepo.marcarDisponible(pedido.id_repartidor);
    }

    return await this.pedidoRepo.actualizarPedido(id_pedido, {
      estado: 'CANCELADO',
      motivo_cancelacion,
      observaciones: observaciones || null
    });
  }
}

module.exports = CancelarPedidoAdminUseCase;