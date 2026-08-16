/**
 * Modelo de Dominio: Pedido
 * Representa un pedido generado por un cliente a partir de su carrito.
 * RN-041: la generación es una transacción ACID.
 * RN-044: monto mínimo de $200.000.
 * RN-045: el pedido se crea con estado PENDIENTE.
 * RN-047: no se puede dividir el carrito ni hacer pedidos parciales.
 * Incluye campos extendidos clienteNombre, clienteTelefono y caracteristicasLogistica
 * para el flujo de repartidor (Aleja).
 */
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

  esAsignado() {
    return this.estado === 'ASIGNADO';
  }

  puedeActualizar() {
    return ['ASIGNADO', 'EN_RUTA'].includes(this.estado);
  }

  esFinalizado() {
    return ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'].includes(this.estado);
  }
}

module.exports = Pedido;