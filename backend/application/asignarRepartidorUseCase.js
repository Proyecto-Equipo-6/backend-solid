class AsignarRepartidorUseCase {
  constructor(pedidoRepo, repartidorRepo) {
    this.pedidoRepo = pedidoRepo;
    this.repartidorRepo = repartidorRepo;
  }

  async ejecutar(id_pedido, id_usuario_repartidor) {
    const pedido = await this.pedidoRepo.obtenerPedidoPorId(id_pedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    // CU-019: Solo pedidos CONFIRMADO pueden asignarse
    if (pedido.estado !== 'CONFIRMADO') {
      throw new Error('El pedido no está en estado Confirmado');
    }

    if (pedido.id_repartidor !== null && pedido.id_repartidor !== undefined) {
      throw new Error('El pedido ya fue asignado');
    }

    // Validar disponibilidad del repartidor
    const disponible = await this.repartidorRepo.estaDisponible(id_usuario_repartidor);
    if (!disponible) {
      throw new Error('El repartidor no está disponible');
    }

    const pedidosHoy = await this.pedidoRepo.contarPedidosDelDia(id_usuario_repartidor);
    if (pedidosHoy >= 3) {
      throw new Error('El repartidor ha alcanzado el límite de pedidos diarios');
    }

    // Asignar y marcar ocupado
    const pedidoAsignado = await this.pedidoRepo.actualizarPedido(id_pedido, {
      id_repartidor: id_usuario_repartidor,
      estado: 'ASIGNADO'
    });

    await this.repartidorRepo.marcarOcupado(id_usuario_repartidor);

    return pedidoAsignado;
  }
}

module.exports = AsignarRepartidorUseCase;