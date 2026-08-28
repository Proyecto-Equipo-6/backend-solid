/**
 * Adaptador de Infraestructura: PedidoController
 * Maneja las peticiones HTTP de pedidos y las delega a los casos de uso.
 * El usuario autenticado ya viene adjuntado por el middleware (req.usuario).
 */
class PedidoController {
  constructor({ crearPedidoUseCase, verPedidosUseCase, cancelarPedidoUseCase, generarTicketPedidoUseCase, obtenerDetallePedidoClienteUseCase, pedidoRepository }) {
    this.crearPedidoUseCase = crearPedidoUseCase;
    this.verPedidosUseCase = verPedidosUseCase;
    this.cancelarPedidoUseCase = cancelarPedidoUseCase;
    this.generarTicketPedidoUseCase = generarTicketPedidoUseCase;
    this.obtenerDetallePedidoClienteUseCase = obtenerDetallePedidoClienteUseCase;
    this.pedidoRepository = pedidoRepository;
  }

  async crear(req, res) {
    try {
      const resultado = await this.crearPedidoUseCase.execute(req.usuario, req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async ver(req, res) {
    try {
      const resultado = await this.verPedidosUseCase.execute(req.usuario, {
        estado: req.query.estado || null,
        pagina: req.query.pagina,
        limite: req.query.limite,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async cancelar(req, res) {
    try {
      const resultado = await this.cancelarPedidoUseCase.execute(req.usuario, {
        idPedido: Number(req.params.id),
        motivo: req.body.motivo,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async detalle(req, res) {
    try {
      const resultado = await this.obtenerDetallePedidoClienteUseCase.execute(req.usuario, Number(req.params.id));
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async ticket(req, res) {
    try {
      const idPedido = Number(req.params.id);

      // Verifica que el pedido pertenezca al cliente autenticado (RN-037/RN-039).
      const pedido = await this.pedidoRepository.obtenerPedidoPorId(idPedido);
      if (!pedido || pedido.id_usuario !== req.usuario.id_usuario) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const ticket = await this.generarTicketPedidoUseCase.execute(idPedido);
      return res.status(200).json(ticket);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = PedidoController;