/**
 * Adaptador de Infraestructura: ProductoController
 * Maneja las peticiones HTTP del catálogo y las delega al Caso de Uso correspondiente.
 */
class ProductoController {
  constructor(listarProductosUseCase, obtenerProductoUseCase) {
    this.listarProductosUseCase = listarProductosUseCase;
    this.obtenerProductoUseCase = obtenerProductoUseCase;
  }

  async listarPublicos(req, res) {
    try {
      const productos = await this.listarProductosUseCase.execute();
      return res.status(200).json(productos);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const producto = await this.obtenerProductoUseCase.execute({
        id: Number(req.params.id),
      });
      return res.status(200).json(producto);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = ProductoController;
