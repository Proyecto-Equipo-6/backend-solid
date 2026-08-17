const PedidoRepartidorRepository = require('../../../domain/ports/PedidoRepartidorRepository');
const Pedido = require('../../../domain/models/Pedido');

class InMemoryPedidoRepartidorRepository extends PedidoRepartidorRepository {
  constructor(pedidos = [], detallesPedido = []) {
    super();
    this.pedidos = pedidos.map(p => this._clonar(p));
    this.detallesPedido = detallesPedido.map(d => ({ ...d }));
  }

  _clonar(pedido) {
    return new Pedido({ ...pedido });
  }

  // ----- Repartidor -----

  async obtenerPedidosDelDia(repartidorId) {
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

  // Alias compatible con origin/main
  async obtenerPedidosAsignadosDelDia(repartidorId) {
    return this.obtenerPedidosDelDia(repartidorId);
  }

  async obtenerDetallePedido(pedidoId) {
    const pedido = this.pedidos.find(p => p.id_pedido === pedidoId);
    return pedido ? this._clonar(pedido) : null;
  }

  // Alias compatible con origin/main
  async obtenerPedidoPorId(pedidoId) {
    return this.obtenerDetallePedido(pedidoId);
  }

  async actualizarEstado(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const index = this.pedidos.findIndex(p => p.id_pedido === pedidoId);
    if (index === -1) throw new Error('Pedido no encontrado');

    const pedido = this.pedidos[index];

    if (pedido.estado !== estadoAnterior) {
      throw new Error('El pedido fue actualizado por otro proceso. Recargue la información.');
    }

    if (nuevoEstado === 'ENTREGADO') {
      pedido.comprobante_url = `https://cloudinary.com/evidencia_${pedidoId}.jpg`;
    }

    const pedidoActualizado = this._clonar({
      ...pedido,
      estado: nuevoEstado,
      fecha_actualizacion: new Date().toISOString()
    });
    this.pedidos[index] = pedidoActualizado;
    return this._clonar(pedidoActualizado);
  }

  // Alias compatible con origin/main
  async actualizarEstadoPedido(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    return this.actualizarEstado(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales);
  }

  // ----- Administrador -----

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

    const total = pedidos.length;
    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    const data = pedidos.slice(start, end);

    return {
      data,
      total,
      page,
      limit
    };
    }

  async contarPedidosDelDia(repartidorId) {
    const hoy = new Date().toLocaleDateString('en-CA');
    return this.pedidos.filter(p => {
      const fechaPedido = new Date(p.fecha_pedido).toLocaleDateString('en-CA');
      return (
        p.id_repartidor === repartidorId &&
        p.estado !== 'CANCELADO' &&
        p.estado !== 'ENTREGADO' &&
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

  // Método para cancelación con reintegración (HEAD)
  async obtenerDetallesPorPedido(id_pedido) {
    return this.detallesPedido
      .filter(d => d.id_pedido === id_pedido)
      .map(d => ({ ...d }));
  }

  agregarDetallePedido(detalle) {
    this.detallesPedido.push({ ...detalle });
  }

  // CU-018 · Historial de pedidos finalizados (origin/main)
  async obtenerHistorialPedidos(repartidorId, filtros = {}) {
    const estadosFinales = new Set(['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO']);
    let pedidos = this.pedidos.filter(p =>
      p.id_repartidor === repartidorId && estadosFinales.has(p.estado)
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
    const estadosFinales = new Set(['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO']);
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const diasDesdeLunes = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
    const inicioSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasDesdeLunes);

    const finalizados = this.pedidos.filter(p =>
      p.id_repartidor === repartidorId && estadosFinales.has(p.estado)
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