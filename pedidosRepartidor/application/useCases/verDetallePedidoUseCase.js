import { DIAGRAMA_SEGUIMIENTO, ESTADOS_PEDIDO } from '../../domain/models/pedido.js';
import { PedidoNoEncontradoError } from '../../domain/errors/pedidoErrors.js';

/**
 * CU-016 · Ver detalles pedido
 * Objetivo: mostrar nombre del cliente, teléfono, estado de seguimiento y
 * características de logística/manipulación del pedido activo o de uno en cola
 * (RN-062 a RN-064). Nunca se muestran los productos del pedido (RN-062).
 */
export class VerDetallePedidoUseCase {
  constructor(pedidoRepartidorRepository) {
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
  }

  async execute({ idPedido, repartidorId }) {
    const pedido = await this.pedidoRepartidorRepository.obtenerPedidoPorId(idPedido);

    // FE-002: el pedido fue cancelado o ya no existe.
    if (!pedido) {
      throw new PedidoNoEncontradoError('El pedido ya no está disponible.');
    }

    // PC-002/RN-063: el detalle solo es visible para el repartidor al que fue asignado.
    if (!pedido.perteneceA(repartidorId)) {
      throw new PedidoNoEncontradoError('El pedido ya no está disponible.');
    }

    // FA-001: si el pedido seleccionado está en cola (no es el activo/"En camino"),
    // se muestra la misma vista pero sin habilitar la actualización de estado.
    const puedeActualizarEstado = pedido.estado === ESTADOS_PEDIDO.ASIGNADO
      || pedido.estado === ESTADOS_PEDIDO.EN_CAMINO;

    return {
      idPedido: pedido.idPedido,
      cliente: {
        nombre: pedido.cliente?.nombre ?? 'Desconocido',
        telefono: pedido.cliente?.telefono ?? '',
      },
      estado: pedido.estado,
      // RN-062: solo se informa si existen características de logística/manipulación,
      // nunca el detalle de los productos que componen el pedido.
      caracteristicasLogistica: pedido.caracteristicasLogistica,
      // RN-064: diagrama de seguimiento siempre en el mismo orden.
      diagramaSeguimiento: DIAGRAMA_SEGUIMIENTO,
      puedeActualizarEstado,
    };
  }
}
