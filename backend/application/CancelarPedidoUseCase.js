const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: CancelarPedidoUseCase
 * Permite al cliente cancelar un pedido en estado PENDIENTE (CU-014 / RF-005.5).
 * PC-001: sesión válida. PC-002: el pedido pertenece al usuario.
 * PC-003: solo PENDIENTE es cancelable por el cliente.
 * FA-001: el motivo es obligatorio.
 * FE-001: "No se puede cancelar un pedido que ya no está PENDIENTE".
 * RN-012.4: CANCELADO es estado terminal (inmutable).
 * Nota: la restitución de stock la gestiona el administrador (RN-012.2),
 * no este caso de uso.
 */
class CancelarPedidoUseCase {
  constructor(pedidoRepository) {
    this.pedidoRepository = pedidoRepository;
  }

  async execute(usuario, { idPedido, motivo }) {
    if (!usuario?.id_usuario) {
      throw new ErrorValidacion('Debes iniciar sesión para cancelar un pedido');
    }

    if (!idPedido) {
      throw new ErrorValidacion('Debes indicar el pedido a cancelar');
    }

    // FA-001: motivo obligatorio
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      throw new ErrorValidacion('Debes indicar el motivo de la cancelación');
    }

    // PC-002: el pedido debe pertenecer al usuario autenticado
    const pedido = await this.pedidoRepository.obtenerPedidoPorId(idPedido);
    if (!pedido) {
      throw new ErrorNoEncontrado('Pedido no encontrado');
    }
    if (pedido.id_usuario !== usuario.id_usuario) {
      throw new ErrorNoEncontrado('Pedido no encontrado');
    }

    // PC-003 / FE-001: solo PENDIENTE es cancelable por el cliente
    if (pedido.estado !== 'PENDIENTE') {
      throw new ErrorValidacion('No se puede cancelar un pedido que ya no está PENDIENTE');
    }

    const cancelado = await this.pedidoRepository.cancelarPedido(idPedido, usuario.id_usuario, motivo.trim());
    if (!cancelado) {
      throw new ErrorValidacion('No se pudo cancelar el pedido. Intente nuevamente');
    }

    // FP-008: notificación al administrador (se registra en repository/evento)
    return {
      mensaje: 'Pedido cancelado exitosamente',
      pedido: {
        id_pedido: idPedido,
        estado: 'CANCELADO',
        motivo_cancelacion: motivo.trim(),
      },
    };
  }
}

module.exports = CancelarPedidoUseCase;