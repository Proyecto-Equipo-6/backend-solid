/**
 * Adaptador de Infraestructura: ProductoController
 * Maneja las peticiones HTTP de productos y las delega a los Casos de Uso.
 * Incluye el catálogo público y el CRUD administrativo (CU-023).
 */
class ProductoController {
  constructor({
    listarProductosUseCase,
    obtenerProductoUseCase,
    crearProductoUseCase,
    editarProductoUseCase,
    eliminarProductoUseCase,
  }) {
    this.listarProductosUseCase = listarProductosUseCase;
    this.obtenerProductoUseCase = obtenerProductoUseCase;
    this.crearProductoUseCase = crearProductoUseCase;
    this.editarProductoUseCase = editarProductoUseCase;
    this.eliminarProductoUseCase = eliminarProductoUseCase;
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

  async crear(req, res) {
    try {
      const producto = await this.crearProductoUseCase.ejecutar(req.body);
      return res.status(201).json(producto);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async editar(req, res) {
    try {
      const producto = await this.editarProductoUseCase.ejecutar(
        Number(req.params.id),
        req.body
      );
      return res.status(200).json(producto);
    } catch (error) {
      const status = error.message === 'Producto no encontrado' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await this.eliminarProductoUseCase.ejecutar(Number(req.params.id));
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.message === 'Producto no encontrado' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = ProductoController;