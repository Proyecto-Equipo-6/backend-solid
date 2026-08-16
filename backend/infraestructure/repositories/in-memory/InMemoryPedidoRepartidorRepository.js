const PedidoRepartidorRepository = require('../../../domain/ports/PedidoRepartidorRepository');
const Pedido = require('../../../domain/models/Pedido');

class InMemoryPedidoRepartidorRepository extends PedidoRepartidorRepository {
  constructor(pedidos = []) {
    super();
    this.pedidos = pedidos.map(p => this._clonar(p));
  }

  _clonar(pedido) {
    return new Pedido({ ...pedido });
  }

  // Métodos para Repartidor

  async obtenerPedidosAsignadosDelDia(repartidorId) {
    const hoy = new Date().toLocaleDateString('en-CA');
    return this.pedidos
      .filter(p => {
        const fechaPedido = new Date(p.fecha_pedido).toLocaleDateString('en-CA');
        return (
          p.id_repartidor === repartidorId &&
          p.estado === 'ASIGNADO' &&
          fechaPedido === hoy
        );
      })
      .sort((a, b) => new Date(a.fecha_pedido) - new Date(b.fecha_pedido))
      .map(p => this._clonar(p));
  }

  async obtenerPedidoPorId(pedidoId) {
    const pedido = this.pedidos.find(p => p.id_pedido === pedidoId);
    return pedido ? this._clonar(pedido) : null;
  }

  async actualizarEstadoPedido(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const index = this.pedidos.findIndex(p => p.id_pedido === pedidoId);
    if (index === -1) throw new Error('Pedido no encontrado');

    const pedido = this.pedidos[index];

    if (pedido.estado !== estadoAnterior) {
      throw new Error('El pedido fue actualizado por otro proceso. Recargue la información.');
    }

    // Máquina de estados real: ASIGNADO → EN_CAMINO → ENTREGADO / NO_ENTREGADO
    const transicionesValidas = {
      'ASIGNADO': ['EN_CAMINO'],
      'EN_CAMINO': ['ENTREGADO', 'NO_ENTREGADO']
    };

    const estadosPermitidos = transicionesValidas[pedido.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Transición inválida de ${pedido.estado} a ${nuevoEstado}`);
    }

    if (nuevoEstado === 'ENTREGADO' && !datosAdicionales.foto) {
      throw new Error('La foto es obligatoria para confirmar la entrega');
    }
    if (nuevoEstado === 'NO_ENTREGADO' && !datosAdicionales.observacion) {
      throw new Error('La observación es obligatoria para marcar No Entregado');
    }

    const pedidoActualizado = this._clonar({
      ...pedido,
      estado: nuevoEstado,
      fecha_actualizacion: new Date().toISOString()
    });
    this.pedidos[index] = pedidoActualizado;
    return this._clonar(pedidoActualizado);
  }

  // Métodos para Administrador

  async obtenerTodos(filtros = {}) {
    let pedidos = this.pedidos.map(p => this._clonar(p));

    if (filtros.estado) {
      pedidos = pedidos.filter(p => p.estado === filtros.estado);
    }

    if (filtros.fechaDesde) {
      const desde = new Date(filtros.fechaDesde);
      pedidos = pedidos.filter(p => new Date(p.fecha_pedido) >= desde);
    }

    if (filtros.fechaHasta) {
      const hasta = new Date(filtros.fechaHasta);
      pedidos = pedidos.filter(p => new Date(p.fecha_pedido) <= hasta);
    }

    if (filtros.cliente) {
      const clienteId = Number(filtros.cliente);
      pedidos = pedidos.filter(p => p.id_usuario === clienteId);
    }

    return pedidos;
  }

  async contarPedidosDelDia(repartidorId) {
    const hoy = new Date().toLocaleDateString('en-CA');
    return this.pedidos.filter(p => {
      const fechaPedido = new Date(p.fecha_pedido).toLocaleDateString('en-CA');
      return (
        p.id_repartidor === repartidorId &&
        fechaPedido === hoy
      );
    }).length;
  }

  async actualizarPedido(idPedido, cambios) {
    const index = this.pedidos.findIndex(p => p.id_pedido === idPedido);
    if (index === -1) throw new Error('Pedido no encontrado');

    const pedidoActualizado = this._clonar({
      ...this.pedidos[index],
      ...cambios,
      id_pedido: idPedido,
      fecha_actualizacion: new Date().toISOString()
    });
    this.pedidos[index] = pedidoActualizado;
    return this._clonar(pedidoActualizado);
  }

  // CU-018 · Historial de pedidos finalizados

  async obtenerHistorialPedidos(repartidorId, filtros = {}) {
    const estadosFinales = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'];
    let pedidos = this.pedidos.filter(p =>
      p.id_repartidor === repartidorId && estadosFinales.includes(p.estado)
    );

    if (filtros.filtroEstado) {
      pedidos = pedidos.filter(p => p.estado === filtros.filtroEstado);
    }

    return pedidos.map(p => ({
      id_pedido: p.id_pedido,
      fechaEntregaReal: p.fecha_actualizacion || p.fecha_pedido,
      estado: p.estado,
      direccion_entrega: p.direccion_entrega,
    }));
  }

  async contarPedidosDelPeriodo(repartidorId) {
    const estadosFinales = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'];
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    // Semana calendario con inicio en lunes (ISO), consistente con
    // WEEKDAY(CURDATE()) del adaptador MySQL (RN-073/RN-076).
    // Ambos inicios se normalizan a medianoche para comparar solo la fecha.
    const diasDesdeLunes = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
    const inicioSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasDesdeLunes);

    const finalizados = this.pedidos.filter(p =>
      p.id_repartidor === repartidorId && estadosFinales.includes(p.estado)
    );

    const totalMes = finalizados.filter(p => {
      const fecha = new Date(p.fecha_actualizacion || p.fecha_pedido);
      const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      return fechaNormalizada >= inicioMes;
    }).length;

    const totalSemana = finalizados.filter(p => {
      const fecha = new Date(p.fecha_actualizacion || p.fecha_pedido);
      const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      return fechaNormalizada >= inicioSemana;
    }).length;

    return { totalMes, totalSemana };
  }
}

module.exports = InMemoryPedidoRepartidorRepository;