/**
 * Adaptador de Infraestructura: ProductoController
 * Maneja las peticiones HTTP del catálogo público y las delega a los casos de uso.
 */
class ProductoController {
  constructor(listarProductosUseCase, buscarProductosUseCase, verProductoDetalleUseCase) {
    this.listarProductosUseCase = listarProductosUseCase;
    this.buscarProductosUseCase = buscarProductosUseCase;
    this.verProductoDetalleUseCase = verProductoDetalleUseCase;
  }

  async listar(req, res) {
    try {
      const resultado = await this.listarProductosUseCase.execute(req.query);
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async buscar(req, res) {
    try {
      const resultado = await this.buscarProductosUseCase.execute({
        termino: req.query.termino,
        filtros: req.query,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async detalle(req, res) {
    try {
      const producto = await this.verProductoDetalleUseCase.execute(req.params.id);
      return res.status(200).json(producto);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = ProductoController;