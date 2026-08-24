// Caso de uso para admin marcar pedido como ENTREGADO con comprobante fotográfico
const { EvidenciaFotograficaRequeridaError } = require('../domain/errors/pedidoErrors');

class EntregarPedidoAdminUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(id_pedido, fotoEvidencia, observacion = null) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(id_pedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Validar que el pedido esté en un estado válido para entregar
    const estadosPermitidosParaEntregar = ['EN_CAMINO', 'ASIGNADO', 'CONFIRMADO'];
    if (!estadosPermitidosParaEntregar.includes(pedido.estado)) {
      throw new Error(`No se puede entregar un pedido en estado ${pedido.estado}. Debe estar EN_CAMINO, ASIGNADO o CONFIRMADO.`);
    }

    // La foto es obligatoria para ENTREGADO
    if (!fotoEvidencia) {
      throw new EvidenciaFotograficaRequeridaError();
    }

    return await this.pedidoRepo.actualizarEstado(
      id_pedido,
      'ENTREGADO',
      pedido.estado,
      { foto: fotoEvidencia, observacion }
    );
  }
}

module.exports = EntregarPedidoAdminUseCase;