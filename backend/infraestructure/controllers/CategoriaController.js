/**
 * Adaptador de Infraestructura: CategoriaController
 * Maneja las peticiones HTTP de categorías y las delega a los Casos de Uso.
 * Incluye el catálogo público y el CRUD administrativo (CU-022).
 */
class CategoriaController {
  constructor({
    listarCategoriasUseCase,
    crearCategoriaUseCase,
    editarCategoriaUseCase,
    eliminarCategoriaUseCase,
  }) {
    this.listarCategoriasUseCase = listarCategoriasUseCase;
    this.crearCategoriaUseCase = crearCategoriaUseCase;
    this.editarCategoriaUseCase = editarCategoriaUseCase;
    this.eliminarCategoriaUseCase = eliminarCategoriaUseCase;
  }

  async listarPublicas(req, res) {
    try {
      const categorias = await this.listarCategoriasUseCase.execute();
      return res.status(200).json(categorias);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async crear(req, res) {
    try {
      const categoria = await this.crearCategoriaUseCase.ejecutar(req.body);
      return res.status(201).json(categoria);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async editar(req, res) {
    try {
      const categoria = await this.editarCategoriaUseCase.ejecutar(
        Number(req.params.id),
        req.body
      );
      return res.status(200).json(categoria);
    } catch (error) {
      const status = error.message === 'Categoría no encontrada' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await this.eliminarCategoriaUseCase.ejecutar(Number(req.params.id));
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.message === 'Categoría no encontrada' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = CategoriaController;