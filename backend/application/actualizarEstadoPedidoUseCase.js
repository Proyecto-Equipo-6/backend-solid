class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    this.validarTransicion(pedido, nuevoEstado);

    if (nuevoEstado === 'ENTREGADO') {
      this.validarFoto(datosAdicionales.foto);
    }

    if (nuevoEstado === 'NO_ENTREGADO') {
      this.validarObservacion(datosAdicionales.observacion);
    }

    return await this.pedidoRepo.actualizarEstado(
      pedidoId,
      nuevoEstado,
      estadoAnterior,
      datosAdicionales
    );
  }

  validarTransicion(pedido, nuevoEstado) {
    const transicionesValidas = {
      'ASIGNADO': ['EN_CAMINO'],
      'EN_CAMINO': ['ENTREGADO', 'NO_ENTREGADO']
    };

    const estadosPermitidos = transicionesValidas[pedido.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Transición inválida de ${pedido.estado} a ${nuevoEstado}`);
    }
  }

  validarFoto(foto) {
    if (!foto) {
      throw new Error('La foto es obligatoria para confirmar la entrega');
    }

    // Si viene la URL de Cloudinary (string) ya fue validada por el middleware.
    if (typeof foto !== 'object') {
      return;
    }

    const formato = (foto.formato || foto.mimetype || '').toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(formato)) {
      throw new Error('La foto debe ser en formato JPG o PNG');
    }

    const tamano = foto.tamano ?? foto.size;
    const tamanoMaximo = 3 * 1024 * 1024;
    if (tamano === undefined || tamano > tamanoMaximo) {
      throw new Error('La foto no debe superar los 3MB');
    }
  }

  validarObservacion(observacion) {
    if (!observacion || observacion.trim() === '') {
      throw new Error('La observación es obligatoria para marcar No Entregado');
    }
  }
}

module.exports = ActualizarEstadoPedidoUseCase;