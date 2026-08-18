/**
 * Modelo de Dominio: Pedido
 * Representa un pedido generado por un cliente a partir de su carrito.
 * RN-041: la generación es una transacción ACID.
 * RN-044: monto mínimo de $200.000.
 * RN-045: el pedido se crea con estado PENDIENTE.
 * RN-047: no se puede dividir el carrito ni hacer pedidos parciales.
 * Incluye campos extendidos clienteNombre, clienteTelefono y caracteristicasLogistica
 * para el flujo de repartidor (Aleja).
 * Incluye la máquina de estados del flujo de repartidor (RN-065 a RN-070).
 */
const { TransicionEstadoInvalidaError } = require('../errors/pedidoErrors');

// Estados relevantes para el flujo del repartidor (RN-058 a RN-076).
const ESTADOS_PEDIDO = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
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
const DIAGRAMA_SEGUIMIENTO = Object.freeze([
  ESTADOS_PEDIDO.ASIGNADO,
  ESTADOS_PEDIDO.EN_CAMINO,
  ESTADOS_PEDIDO.ENTREGADO,
]);

class Pedido {
  constructor({
    id_pedido = null,
    id_usuario = null,
    id_repartidor = null,
    id_metodo_pago = null,
    direccion_entrega = '',
    total = 0,
    estado = 'PENDIENTE',
    comprobante_url = null,
    observaciones = null,
    motivo_cancelacion = null,
    fecha_pedido = new Date().toISOString(),
    fecha_actualizacion = null,
    clienteNombre = '',
    clienteTelefono = '',
    caracteristicasLogistica = 'Ninguna'
  } = {}) {
    this.id_pedido = id_pedido;
    this.id_usuario = id_usuario;
    this.id_repartidor = id_repartidor;
    this.id_metodo_pago = id_metodo_pago;
    this.direccion_entrega = direccion_entrega;
    this.total = total;
    this.estado = estado;
    this.comprobante_url = comprobante_url;
    this.observaciones = observaciones;
    this.motivo_cancelacion = motivo_cancelacion;
    this.fecha_pedido = fecha_pedido;
    this.fecha_actualizacion = fecha_actualizacion;
    this.clienteNombre = clienteNombre;
    this.clienteTelefono = clienteTelefono;
    this.caracteristicasLogistica = caracteristicasLogistica;
  }

  // RN-044: monto mínimo para generar el pedido
  cumpleMontoMinimo() {
    return Number(this.total) >= 200000;
  }
}

module.exports = Pedido;
module.exports.ESTADOS_PEDIDO = ESTADOS_PEDIDO;
module.exports.TRANSICIONES_VALIDAS = TRANSICIONES_VALIDAS;
module.exports.DIAGRAMA_SEGUIMIENTO = DIAGRAMA_SEGUIMIENTO;