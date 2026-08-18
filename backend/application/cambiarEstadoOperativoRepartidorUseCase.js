class CambiarEstadoOperativoRepartidorUseCase {
  constructor(repartidorRepo, pedidoRepo) {
    this.repartidorRepo = repartidorRepo;
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(idRepartidor, nuevoEstado) {
    const repartidor = await this.repartidorRepo.buscarPorId(idRepartidor);
    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    if (!['DISPONIBLE', 'INACTIVO'].includes(nuevoEstado)) {
      throw new Error('Estado no válido');
    }

    // CP-HU-010.2-01: Cambio a Disponible desde Inactivo
    if (nuevoEstado === 'DISPONIBLE') {
      if (repartidor.estado === 'OCUPADO') {
        throw new Error('No se puede cambiar a Disponible mientras el repartidor está ocupado');
      }
      // Si está INACTIVO o ya DISPONIBLE, se actualiza/retorna
      return await this.repartidorRepo.actualizar(idRepartidor, { estado: 'DISPONIBLE' });
    }

    // CP-HU-010.2-02: Bloqueo de cambio a Inactivo si tiene pedidos EN_CAMINO
    if (nuevoEstado === 'INACTIVO') {
      const pedidosEnCamino = await this.pedidoRepo.contarPedidosEnCamino(idRepartidor);
      if (pedidosEnCamino > 0) {
        throw new Error('No se puede inactivar un repartidor con entregas pendientes sin finalizar');
      }
      return await this.repartidorRepo.actualizar(idRepartidor, { estado: 'INACTIVO' });
    }
  }
}

module.exports = CambiarEstadoOperativoRepartidorUseCase;