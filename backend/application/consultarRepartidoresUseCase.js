class ConsultarRepartidoresUseCase {
  constructor(repartidorRepo, pedidoRepo) {
    this.repartidorRepo = repartidorRepo;
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar({ termino = '', estado = '' } = {}) {
    let repartidores = await this.repartidorRepo.findAll();

    // Filtro por estado
    if (estado === 'Activo') {
      repartidores = repartidores.filter(r => r.estado === 'DISPONIBLE' || r.estado === 'OCUPADO');
    } else if (estado === 'Inactivo') {
      repartidores = repartidores.filter(r => r.estado === 'INACTIVO');
    }

    // Búsqueda por ID o nombre
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
          telefono: repartidor.telefono,
          email: repartidor.email,
          estado: repartidor.estado,
          pedidos_hoy: pedidosHoy,
          pedidos_semana: periodo.totalSemana,
          pedidos_mes: periodo.totalMes
        });
      } catch (error) {
        console.error(`Error obteniendo métricas del repartidor ${repartidor.id_usuario}:`, error.message);
        resultado.push({
          id_repartidor: repartidor.id_usuario,
          nombre: `${repartidor.nombre} ${repartidor.apellidos}`.trim(),
          telefono: repartidor.telefono,
          email: repartidor.email,
          estado: repartidor.estado,
          pedidos_hoy: '-',
          pedidos_semana: '-',
          pedidos_mes: '-'
        });
      }
    }

    return resultado;
  }
}

module.exports = ConsultarRepartidoresUseCase;