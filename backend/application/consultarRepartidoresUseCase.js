class ConsultarRepartidoresUseCase {
  constructor(repartidorRepo, pedidoRepo) {
    this.repartidorRepo = repartidorRepo;
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar({ termino = '', estado = 'Activo' } = {}) {
    let repartidores = await this.repartidorRepo.findAll();

    // FP-005 / FA-002: filtro por estado.
    // Por defecto se muestran solo activos (DISPONIBLE u OCUPADO).
    // Deriva estado operativo real antes de filtrar
    repartidores = await this.derivarEstadoOperativo(repartidores);

    if (estado === 'Activo') {
      repartidores = repartidores.filter(
        r => r.estado === 'DISPONIBLE' || r.estado === 'OCUPADO'
      );
    } else if (estado === 'Inactivo') {
      repartidores = repartidores.filter(r => r.estado === 'INACTIVO');
    } else if (estado === 'Todos') {
      // No se filtra, se dejan todos.
    }

    // FA-001: búsqueda por ID o nombre
    if (termino && termino.trim() !== '') {
      const t = termino.trim().toLowerCase();
      repartidores = repartidores.filter(r =>
        String(r.id_usuario).includes(t) ||
        (r.nombre || '').toLowerCase().includes(t) ||
        (r.apellidos || '').toLowerCase().includes(t)
      );
    }

    const resultado = [];

    for (const repartidor of repartidores) {
      try {
        const pedidosHoy = await this.pedidoRepo.contarPedidosDeHoyParaMetrica(repartidor.id_usuario);
        const periodo = await this.pedidoRepo.contarPedidosDelPeriodo(repartidor.id_usuario);

        resultado.push({
          id_repartidor: repartidor.id_usuario,
          nombre: `${repartidor.nombre} ${repartidor.apellidos}`.trim(),
          nombre_apellido: repartidor.nombre_apellido || `${repartidor.nombre} ${repartidor.apellidos}`.trim(),
          telefono: repartidor.telefono,
          email: repartidor.email,
          direccion: repartidor.direccion,
          estado: repartidor.estado,
          pedidos_hoy: pedidosHoy,
          pedidos_semana: periodo.totalSemana,
          pedidos_mes: periodo.totalMes
        });
      } catch (error) {
        // FE-004: métricas en "-"
        resultado.push({
          id_repartidor: repartidor.id_usuario,
          nombre: `${repartidor.nombre} ${repartidor.apellidos}`.trim(),
          nombre_apellido: repartidor.nombre_apellido || `${repartidor.nombre} ${repartidor.apellidos}`.trim(),
          telefono: repartidor.telefono,
          email: repartidor.email,
          direccion: repartidor.direccion,
          estado: repartidor.estado,
          pedidos_hoy: '-',
          pedidos_semana: '-',
          pedidos_mes: '-'
        });
      }
    }

    return resultado;
  }

  // Deriva el estado operativo real: si la cuenta está activa pero el repartidor
  // tiene pedidos en curso hoy, el estado es OCUPADO (no INACTIVO).
  async derivarEstadoOperativo(repartidores) {
    const derivados = [];
    for (const repartidor of repartidores) {
      if (repartidor.estado === 'INACTIVO') {
        derivados.push(repartidor);
        continue;
      }
      const pedidosHoy = await this.contarPedidosDelDia(repartidor.id_usuario);
      derivados.push({ ...repartidor, estado: pedidosHoy > 0 ? 'OCUPADO' : 'DISPONIBLE' });
    }
    return derivados;
  }

  async contarPedidosDelDia(repartidorId) {
    if (typeof this.pedidoRepo.contarPedidosDelDia !== 'function') {
      return 0;
    }
    try {
      return await this.pedidoRepo.contarPedidosDelDia(repartidorId);
    } catch (error) {
      console.error(`Error contando pedidos del repartidor ${repartidorId}:`, error.message);
      return 0;
    }
  }
}

module.exports = ConsultarRepartidoresUseCase;