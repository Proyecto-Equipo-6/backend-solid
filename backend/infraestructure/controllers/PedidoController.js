/**
 * Adaptador de Infraestructura: PedidoController
 * Maneja las peticiones HTTP de pedidos y las delega a los casos de uso.
 * El usuario autenticado ya viene adjuntado por el middleware (req.usuario).
 */
class PedidoController {
  constructor({ crearPedidoUseCase }) {
    this.crearPedidoUseCase = crearPedidoUseCase;
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
}

module.exports = PedidoController;