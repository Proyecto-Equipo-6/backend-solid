/**
 * Caso de Uso: DesasignarRepartidorUseCase
 * Permite al administrador quitar el repartidor asignado a un pedido
 * (CU-019 FA / corrección de asignación), liberando al repartidor.
 */
class DesasignarRepartidorUseCase {
  constructor(pedidoRepo, repartidorRepo) {
    this.pedidoRepo = pedidoRepo;
    this.repartidorRepo = repartidorRepo;
  }

  async ejecutar(id_pedido) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    if (pedido.id_repartidor === null || pedido.id_repartidor === undefined) {
      throw new Error('El pedido no tiene repartidor asignado');
    }

    if (!['ASIGNADO', 'CONFIRMADO'].includes(pedido.estado)) {
      throw new Error('No se puede desasignar un pedido en este estado');
    }

    if (pedido.id_repartidor !== null && pedido.id_repartidor !== undefined) {
      await this.repartidorRepo.marcarDisponible(pedido.id_repartidor);
    }

    const pedidoActualizado = await this.pedidoRepo.actualizarPedido(id_pedido, {
      id_repartidor: null,
      estado: 'CONFIRMADO',
    });

    return pedidoActualizado;
  }
}

module.exports = DesasignarRepartidorUseCase;