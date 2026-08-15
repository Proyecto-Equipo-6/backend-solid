class Pedido {
  constructor({
    idPedido,
    idUsuario,
    idMetodoPago,
    direccion,
    estado,
    comprobante = null,
    observaciones = null,
    motivoCancelacion = null,
    fechaAsignacion,
    fechaActualizacion = null,
    caracteristicasLogistica = 'Ninguna',
    clienteNombre = '',
    clienteTelefono = ''
  }) {
    this.idPedido = idPedido;
    this.idUsuario = idUsuario;
    this.idMetodoPago = idMetodoPago;
    this.direccion = direccion;
    this.estado = estado;
    this.comprobante = comprobante;
    this.observaciones = observaciones;
    this.motivoCancelacion = motivoCancelacion;
    this.fechaAsignacion = fechaAsignacion;
    this.fechaActualizacion = fechaActualizacion;
    this.caracteristicasLogistica = caracteristicasLogistica;
    this.clienteNombre = clienteNombre;
    this.clienteTelefono = clienteTelefono;
  }

  // RN: Solo pedidos asignados pueden ser vistos
  esAsignado() {
    return this.estado === 'ASIGNADO';
  }

  // RN: Solo pedidos asignados o en camino pueden ser actualizados
  puedeActualizar() {
    return ['ASIGNADO', 'EN_CAMINO'].includes(this.estado);
  }

  // RN: Estados finales
  esFinalizado() {
    return ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'].includes(this.estado);
  }
}

module.exports = Pedido;