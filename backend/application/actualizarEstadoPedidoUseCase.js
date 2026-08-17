class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Validación de transición de estados (RN-060)
    const transicionesValidas = {
      'ASIGNADO': ['EN_CAMINO'],
      'EN_CAMINO': ['ENTREGADO', 'NO_ENTREGADO']
    };

    const estadosPermitidos = transicionesValidas[pedido.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Transición inválida de ${pedido.estado} a ${nuevoEstado}`);
    }

    // Validación de foto obligatoria para ENTREGADO (RN-061)
    if (nuevoEstado === 'ENTREGADO') {
      const foto = datosAdicionales.foto;
      if (!foto) {
        throw new Error('La foto es obligatoria para confirmar la entrega');
      }

      const formato = (foto.formato || foto.mimetype || '').toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(formato)) {
        throw new Error('La foto debe ser en formato JPG o PNG');
      }

      const tamano = foto.tamano ?? foto.size;
      const tamanoMaximo = 3 * 1024 * 1024; // 3MB
      if (tamano === undefined || tamano > tamanoMaximo) {
        throw new Error('La foto no debe superar los 3MB');
      }
    }

    // Validación de observación obligatoria para NO_ENTREGADO (RN-062)
    if (nuevoEstado === 'NO_ENTREGADO') {
      if (!datosAdicionales.observacion || datosAdicionales.observacion.trim() === '') {
        throw new Error('La observación es obligatoria para marcar No Entregado');
      }
    }

    // Delegar al repositorio la actualización y asignación de comprobante_url
    return await this.pedidoRepo.actualizarEstado(
      pedidoId,
      nuevoEstado,
      estadoAnterior,
      datosAdicionales
    );
  }
}

module.exports = ActualizarEstadoPedidoUseCase;