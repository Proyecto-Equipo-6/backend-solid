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

  async obtenerDetallePedido(pedidoId) {
    const pedido = this.pedidos.find(p => p.id_pedido === pedidoId);
    return pedido ? this._clonar(pedido) : null;
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

    return pedidos;
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

  // NUEVO: Obtener detalles del pedido (simula tabla pedido_detalles)
  async obtenerDetallesPorPedido(id_pedido) {
    return this.detallesPedido
      .filter(d => d.id_pedido === id_pedido)
      .map(d => ({ ...d }));
  }

  agregarDetallePedido(detalle) {
    this.detallesPedido.push({ ...detalle });
  }
}

module.exports = InMemoryPedidoRepartidorRepository;