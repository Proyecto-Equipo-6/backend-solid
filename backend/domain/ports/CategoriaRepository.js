/**
 * Port: CategoriaRepository
 * Define el contrato que cualquier adaptador de persistencia de categorías debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class CategoriaRepository {
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }

  async findAll() {
    throw new Error("Método 'findAll' no implementado");
  }

  async guardar(categoriaData) {
    throw new Error("Método 'guardar' no implementado");
  }

  async buscarPorNombre(nombre) {
    throw new Error("Método 'buscarPorNombre' no implementado");
  }

  async buscarPorId(id_categoria) {
    throw new Error("Método 'buscarPorId' no implementado");
  }

  async actualizar(id_categoria, datos) {
    throw new Error("Método 'actualizar' no implementado");
  }

  async eliminar(id_categoria) {
    throw new Error("Método 'eliminar' no implementado");
  }

  async contarProductosAsociados(id_categoria) {
    throw new Error("Método 'contarProductosAsociados' no implementado");
  }
}

module.exports = CategoriaRepository;
