const CategoriaRepository = require('../../../domain/ports/CategoriaRepository');

/**
 * Adaptador de Infraestructura: InMemoryCategoriaRepository
 * Implementa la interfaz (puerto) CategoriaRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryCategoriaRepository extends CategoriaRepository {
  constructor() {
    super();
    this.categorias = [];
  }

  async findActivos() {
    return this.categorias.filter((categoria) => categoria.estado === 1);
  }
}

module.exports = InMemoryCategoriaRepository;
