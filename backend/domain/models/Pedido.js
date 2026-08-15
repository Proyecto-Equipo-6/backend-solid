/**
 * Modelo de Dominio: Pedido
 * Representa un pedido generado por un cliente a partir de su carrito.
 * RN-041: la generación es una transacción ACID.
 * RN-044: monto mínimo de $200.000.
 * RN-045: el pedido se crea con estado PENDIENTE.
 * RN-047: no se puede dividir el carrito ni hacer pedidos parciales.
 */
class Pedido {
  constructor({
    id_pedido = null,
    id_usuario,
    id_metodo_pago,
    direccion_entrega,
    total,
    estado = 'PENDIENTE',
    observaciones = null,
    motivo_cancelacion = null,
    fecha_pedido = null,
    fecha_actualizacion = null,
  } = {}) {
    this.id_pedido = id_pedido;
    this.id_usuario = id_usuario;
    this.id_metodo_pago = id_metodo_pago;
    this.direccion_entrega = direccion_entrega;
    this.total = total;
    this.estado = estado;
    this.observaciones = observaciones;
    this.motivo_cancelacion = motivo_cancelacion;
    this.fecha_pedido = fecha_pedido;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  // RN-044: monto mínimo para generar el pedido
  cumpleMontoMinimo() {
    return Number(this.total) >= 200000;
  }

  // RN-045: el pedido nace en PENDIENTE
  esPendiente() {
    return this.estado === 'PENDIENTE';
  }

  // RN-047: el pedido refleja exactamente el carrito confirmado
  esValido() {
    return Boolean(
      this.id_usuario &&
      this.id_metodo_pago &&
      this.direccion_entrega &&
      this.cumpleMontoMinimo()
    );
  }
}

module.exports = Pedido;