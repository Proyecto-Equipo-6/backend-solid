/**
 * Modelo de Dominio: Pedido
 * Usa exactamente las columnas de la tabla pedidos de MySQL.
 * Incluye campos extendidos clienteNombre y clienteTelefono por conveniencia.
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