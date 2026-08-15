/**
 * Adaptador de Infraestructura: CategoriaController
 * Maneja las peticiones HTTP de categorías y las delega al Caso de Uso.
 */
class CategoriaController {
  constructor(listarCategoriasUseCase) {
    this.listarCategoriasUseCase = listarCategoriasUseCase;
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
}

module.exports = CategoriaController;
