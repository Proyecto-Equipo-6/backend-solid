class ActualizarEstadoPedidoAdminUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(id_pedido, nuevoEstado) {
    const pedido = await this.pedidoRepo.obtenerPedidoPorId(id_pedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Máquina de estados completa para administrador
    const transicionesValidas = {
      'PENDIENTE': ['CONFIRMADO', 'CANCELADO'],
      'CONFIRMADO': ['ASIGNADO', 'CANCELADO'],
      'ASIGNADO': ['EN_CAMINO', 'CANCELADO'],
      'EN_CAMINO': ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'],
      'NO_ENTREGADO': ['CANCELADO'],
      'ENTREGADO': [],
      'CANCELADO': []
    };

    const estadosPermitidos = transicionesValidas[pedido.estado] || [];

    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error('No se pudo actualizar el estado del pedido. Transición inválida.');
    }

    return await this.pedidoRepo.actualizarPedido(id_pedido, {
      estado: nuevoEstado
    });
  }
}

module.exports = ActualizarEstadoPedidoAdminUseCase;