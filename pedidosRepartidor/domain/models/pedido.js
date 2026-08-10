import { TransicionEstadoInvalidaError } from '../errors/pedidoErrors.js';

/**
 * Estados relevantes para el flujo del repartidor.
 * Nota: "NO_ENTREGADO" no existe todavía en el enum `pedidos_estado` de Prisma.
 * Ver /db/migrationAddNoEntregado.sql para el ajuste necesario en el schema.
 */
export const ESTADOS_PEDIDO = Object.freeze({
  ASIGNADO: 'ASIGNADO',
  EN_CAMINO: 'EN_CAMINO',
  ENTREGADO: 'ENTREGADO',
  NO_ENTREGADO: 'NO_ENTREGADO',
  CANCELADO: 'CANCELADO',
});

// RN-065: los estados siguen el orden Asignado -> En camino -> Entregado, sin saltos.
// RN-067: desde "En camino" también se puede caer a "No entregado" (excepción de entrega).
const TRANSICIONES_VALIDAS = Object.freeze({
  [ESTADOS_PEDIDO.ASIGNADO]: [ESTADOS_PEDIDO.EN_CAMINO],
  [ESTADOS_PEDIDO.EN_CAMINO]: [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.NO_ENTREGADO],
  // RN-070: una vez "Entregado" o "No entregado", el repartidor ya no puede tocar el estado.
  [ESTADOS_PEDIDO.ENTREGADO]: [],
  [ESTADOS_PEDIDO.NO_ENTREGADO]: [],
  [ESTADOS_PEDIDO.CANCELADO]: [],
});

// RN-064: orden fijo del diagrama de seguimiento mostrado en el detalle (CU-016).
export const DIAGRAMA_SEGUIMIENTO = Object.freeze([
  ESTADOS_PEDIDO.ASIGNADO,
  ESTADOS_PEDIDO.EN_CAMINO,
  ESTADOS_PEDIDO.ENTREGADO,
]);

export class Pedido {
  constructor({
    idPedido,
    repartidorId,
    estado,
    cliente,
    metodoPago,
    direccionEntrega,
    total,
    caracteristicasLogistica,
    fechaAsignacion,
    fechaEntregaReal,
  }) {
    this.idPedido = idPedido;
    this.repartidorId = repartidorId;
    this.estado = estado;
    this.cliente = cliente; // { nombre, telefono }
    this.metodoPago = metodoPago;
    this.direccionEntrega = direccionEntrega;
    this.total = total;
    this.caracteristicasLogistica = caracteristicasLogistica || null; // RN-062
    this.fechaAsignacion = fechaAsignacion;
    this.fechaEntregaReal = fechaEntregaReal;
  }

  // RN-058/RN-059: solo pertenece al dashboard si el admin lo asignó a este repartidor.
  perteneceA(repartidorId) {
    return this.repartidorId === repartidorId;
  }

  // FP-004/RN-060: dentro de los pedidos activos, el más antiguo es el "pedido activo".
  esElActivo(pedidosOrdenados) {
    return pedidosOrdenados[0]?.idPedido === this.idPedido;
  }

  /**
   * Valida (sin persistir) si el pedido puede pasar de su estado actual a `estadoNuevo`.
   * Lanza TransicionEstadoInvalidaError si la transición no está permitida (RN-065/RN-070).
   */
  validarTransicionA(estadoNuevo) {
    const permitidos = TRANSICIONES_VALIDAS[this.estado] || [];
    if (!permitidos.includes(estadoNuevo)) {
      throw new TransicionEstadoInvalidaError(
        `No se puede pasar de "${this.estado}" a "${estadoNuevo}".`
      );
    }
  }
}
