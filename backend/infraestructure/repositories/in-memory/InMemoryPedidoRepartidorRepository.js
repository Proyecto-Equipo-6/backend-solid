const PedidoRepartidorRepository = require('../../../domain/ports/PedidoRepartidorRepository');
const Pedido = require('../../../domain/models/Pedido');

class InMemoryPedidoRepartidorRepository extends PedidoRepartidorRepository {
  constructor(pedidos = []) {
    super();
    // Clonamos los pedidos para evitar mutar los originales
    this.pedidos = pedidos.map(p => this._clonar(p));
  }

  _clonar(pedido) {
    return new Pedido({ ...pedido });
  }

  async obtenerPedidosDelDia(repartidorId) {
    const hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    const pedidosDelDia = this.pedidos
      .filter(p => {
        const fechaPedido = new Date(p.fechaAsignacion).toLocaleDateString('en-CA');
        return (
          p.idUsuario === repartidorId && // repartidorId viaja en id_usuario
          p.estado === 'ASIGNADO' &&
          fechaPedido === hoy
        );
      })
      .sort((a, b) => new Date(a.fechaAsignacion) - new Date(b.fechaAsignacion));

    return pedidosDelDia.map(p => this._clonar(p));
  }

  async obtenerDetallePedido(pedidoId) {
    const pedido = this.pedidos.find(p => p.idPedido === pedidoId);
    return pedido ? this._clonar(pedido) : null;
  }

  async actualizarEstado(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const index = this.pedidos.findIndex(p => p.idPedido === pedidoId);
    if (index === -1) throw new Error('Pedido no encontrado');

    const pedido = this.pedidos[index];

    // Simulación de concurrencia
    if (pedido.estado !== estadoAnterior) {
      throw new Error('El pedido fue actualizado por otro proceso. Recargue la información.');
    }

    // Máquina de estados real
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

    // Clonamos y reemplazamos (inmutabilidad)
    const pedidoActualizado = this._clonar({
      ...pedido,
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString()
    });

    this.pedidos[index] = pedidoActualizado;
    return this._clonar(pedidoActualizado);
  }
}

module.exports = InMemoryPedidoRepartidorRepository;