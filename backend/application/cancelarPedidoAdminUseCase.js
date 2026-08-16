class CancelarPedidoAdminUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(id_pedido, motivo_cancelacion, observaciones = '') {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    // CU-020: Bloquear cancelación en estados EN_CAMINO o ENTREGADO
    if (['EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(pedido.estado)) {
      throw new Error('No se puede cancelar un pedido en este estado');
    }

    // CU-020: Motivo obligatorio
    if (!motivo_cancelacion) {
      throw new Error('Toda cancelación debe registrar un motivo');
    }

    // CU-020 / FE-001: Observación obligatoria si el motivo es "Otro"
    if (motivo_cancelacion === 'Otro' && (!observaciones || observaciones.trim() === '')) {
      throw new Error('Debe especificar el motivo en la observación');
    }

    return await this.pedidoRepo.actualizarPedido(id_pedido, {
      estado: 'CANCELADO',
      motivo_cancelacion,
      observaciones: observaciones || null
    });
  }
}

module.exports = CancelarPedidoAdminUseCase;