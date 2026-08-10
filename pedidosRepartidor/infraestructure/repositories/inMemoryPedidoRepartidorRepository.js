import { PedidoRepartidorRepository } from '../../domain/ports/pedidoRepartidorRepository.js';
import { Pedido, ESTADOS_PEDIDO } from '../../domain/models/pedido.js';

const ESTADOS_HISTORIAL = [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.NO_ENTREGADO, ESTADOS_PEDIDO.CANCELADO];

/**
 * Implementación en memoria del puerto PedidoRepartidorRepository.
 * Pensada para pruebas unitarias de los casos de uso, sin depender de Prisma/BD.
 * (Principio de Sustitución de Liskov - LSP, igual que InMemoryUserRepository de la plantilla)
 */
export class InMemoryPedidoRepartidorRepository extends PedidoRepartidorRepository {
  constructor(pedidosIniciales = []) {
    super();
    this.pedidos = pedidosIniciales.map((datos) => new Pedido(datos));
  }

  async obtenerPedidosAsignadosDelDia(repartidorId) {
    return this.pedidos
      .filter((p) => p.repartidorId === repartidorId)
      .filter((p) => [ESTADOS_PEDIDO.ASIGNADO, ESTADOS_PEDIDO.EN_CAMINO].includes(p.estado))
      .sort((a, b) => new Date(a.fechaAsignacion) - new Date(b.fechaAsignacion));
  }

  async obtenerPedidoPorId(idPedido) {
    return this.pedidos.find((p) => p.idPedido === Number(idPedido)) || null;
  }

  async actualizarEstadoPedido(idPedido, estadoNuevo, { fotoEvidenciaUrl, observacion }) {
    const pedido = await this.obtenerPedidoPorId(idPedido);
    if (!pedido) throw new Error('Pedido no encontrado');

    pedido.estado = estadoNuevo;
    if (estadoNuevo === ESTADOS_PEDIDO.ENTREGADO) {
      pedido.fechaEntregaReal = new Date();
      pedido.fotoEvidenciaUrl = fotoEvidenciaUrl;
    }
    if (estadoNuevo === ESTADOS_PEDIDO.NO_ENTREGADO) {
      pedido.observacion = observacion;
    }
    return pedido;
  }

  async obtenerHistorialPedidos(repartidorId, { filtroEstado } = {}) {
    return this.pedidos.filter((p) => {
      if (p.repartidorId !== repartidorId) return false;
      if (filtroEstado) return p.estado === filtroEstado;
      return ESTADOS_HISTORIAL.includes(p.estado);
    });
  }

  async contarPedidosDelPeriodo(repartidorId) {
    const historial = await this.obtenerHistorialPedidos(repartidorId, {});
    return { totalMes: historial.length, totalSemana: historial.length };
  }
}
