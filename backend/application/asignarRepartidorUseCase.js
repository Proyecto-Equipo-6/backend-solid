class AsignarRepartidorUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(id_pedido, id_usuario_repartidor) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    // CU-019: Solo pedidos CONFIRMADO pueden asignarse
    if (pedido.estado !== 'CONFIRMADO') {
      throw new Error('El pedido no está en estado Confirmado');
    }

    if (pedido.id_repartidor !== null && pedido.id_repartidor !== undefined) {
      throw new Error('El pedido ya fue asignado');
    }

    const pedidosHoy = await this.pedidoRepo.contarPedidosDelDia(id_usuario_repartidor);
    if (pedidosHoy >= 3) {
      throw new Error('El repartidor ha alcanzado el límite de pedidos diarios');
    }

    return await this.pedidoRepo.actualizarPedido(id_pedido, {
      id_repartidor: id_usuario_repartidor,
      estado: 'ASIGNADO'
    });
  }
}

module.exports = AsignarRepartidorUseCase;