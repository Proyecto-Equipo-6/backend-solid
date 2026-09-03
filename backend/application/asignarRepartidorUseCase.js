const { LIMITE_PEDIDOS_DIARIOS_REPARTIDOR } = require('../constants');

class AsignarRepartidorUseCase {
  constructor(pedidoRepo, repartidorRepo) {
    this.pedidoRepo = pedidoRepo;
    this.repartidorRepo = repartidorRepo;
  }

  async ejecutar(id_pedido, id_usuario_repartidor) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    if (pedido.estado !== 'CONFIRMADO' && pedido.estado !== 'ASIGNADO') {
      throw new Error('El pedido no está en estado Confirmado o Asignado');
    }

    if (
      pedido.id_repartidor !== null &&
      pedido.id_repartidor !== undefined &&
      Number(pedido.id_repartidor) !== Number(id_usuario_repartidor)
    ) {
      await this.repartidorRepo.marcarDisponible(pedido.id_repartidor);
    }

    const disponible = await this.repartidorRepo.estaDisponible(id_usuario_repartidor);
    if (!disponible) {
      throw new Error('El repartidor no está disponible');
    }

    const pedidosHoy = await this.pedidoRepo.contarPedidosDelDia(id_usuario_repartidor);
    if (pedidosHoy >= LIMITE_PEDIDOS_DIARIOS_REPARTIDOR) {
      throw new Error('El repartidor ha alcanzado el límite de pedidos diarios');
    }

    const pedidoAsignado = await this.pedidoRepo.actualizarPedido(id_pedido, {
      id_repartidor: id_usuario_repartidor,
      estado: 'ASIGNADO'
    });

    await this.repartidorRepo.marcarOcupado(id_usuario_repartidor);

    return pedidoAsignado;
  }
}

module.exports = AsignarRepartidorUseCase;