const { esNoEncontrado } = require('../helpers/responseHelpers');

/**
 * Adaptador de Infraestructura: PedidoAdminController
 * Administra pedidos (CU-027): listar, ver detalle, actualizar estado, cancelar, asignar repartidor.
 */
class PedidoAdminController {
  constructor({
    obtenerTodosPedidosUseCase,
    obtenerDetallePedidoAdminUseCase,
    actualizarEstadoPedidoAdminUseCase,
    cancelarPedidoAdminUseCase,
    asignarRepartidorUseCase,
    generarTicketPedidoUseCase,
  }) {
    this.obtenerTodosPedidosUseCase = obtenerTodosPedidosUseCase;
    this.obtenerDetallePedidoAdminUseCase = obtenerDetallePedidoAdminUseCase;
    this.actualizarEstadoPedidoAdminUseCase = actualizarEstadoPedidoAdminUseCase;
    this.cancelarPedidoAdminUseCase = cancelarPedidoAdminUseCase;
    this.asignarRepartidorUseCase = asignarRepartidorUseCase;
    this.generarTicketPedidoUseCase = generarTicketPedidoUseCase;
  }

  async listar(req, res) {
    try {
      const { estado, repartidor, page, limit } = req.query;
      const filtros = {};
      if (estado) filtros.estado = estado;
      if (repartidor) filtros.repartidor = Number(repartidor);
      if (page) filtros.page = Number(page);
      if (limit) filtros.limit = Number(limit);

      const pedidos = await this.obtenerTodosPedidosUseCase.ejecutar(filtros);
      return res.status(200).json(pedidos);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async detalle(req, res) {
    try {
      const id_pedido = Number(req.params.id);
      const pedido = await this.obtenerDetallePedidoAdminUseCase.ejecutar(id_pedido);
      return res.status(200).json(pedido);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async actualizarEstado(req, res) {
    try {
      const id_pedido = Number(req.params.id);
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: 'El campo estado es obligatorio' });
      }

      const pedido = await this.actualizarEstadoPedidoAdminUseCase.ejecutar(id_pedido, estado);
      return res.status(200).json(pedido);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async cancelar(req, res) {
    try {
      const id_pedido = Number(req.params.id);
      const { motivo_cancelacion, observaciones, reintegrar_stock } = req.body;

      if (!motivo_cancelacion) {
        return res.status(400).json({ error: 'El motivo de cancelación es obligatorio' });
      }

      const pedido = await this.cancelarPedidoAdminUseCase.ejecutar(id_pedido, motivo_cancelacion, {
        observaciones,
        reintegrar_stock
      });
      return res.status(200).json(pedido);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async asignarRepartidor(req, res) {
    try {
      const id_pedido = Number(req.params.id);
      const { id_repartidor } = req.body;

      if (!id_repartidor) {
        return res.status(400).json({ error: 'El campo id_repartidor es obligatorio' });
      }

      const pedido = await this.asignarRepartidorUseCase.ejecutar(id_pedido, Number(id_repartidor));
      return res.status(200).json(pedido);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async ticket(req, res) {
    try {
      const id_pedido = Number(req.params.id);
      const ticket = await this.generarTicketPedidoUseCase.execute(id_pedido);
      return res.status(200).json(ticket);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = PedidoAdminController;
