const Categoria = require('../domain/models/Categoria');

/**
 * Caso de Uso: ListarCategoriasUseCase
 * Obtiene las categorías activas del catálogo para poder filtrar los productos.
 * Solo depende de la abstracción (CategoriaRepository).
 */
class ListarCategoriasUseCase {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  async execute() {
    const categorias = await this.categoriaRepository.findActivos();
    return categorias.map((categoria) => {
      const instancia = categoria instanceof Categoria ? categoria : new Categoria(categoria);
      return {
        id_categoria: instancia.id_categoria,
        nombre: instancia.nombre,
        descripcion: instancia.descripcion,
      };
    });
  }
}

module.exports = ListarCategoriasUseCase;
