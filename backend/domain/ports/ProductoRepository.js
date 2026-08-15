/**
 * Port: ProductoRepository
 * Define el contrato que cualquier adaptador de persistencia del catálogo
 * debe implementar (Principio de Inversión de Dependencias - DIP).
 */
class ProductoRepository {
  async listar(filtros) {
    throw new Error("Método 'listar' no implementado");
  }

  async buscar(termino, filtros) {
    throw new Error("Método 'buscar' no implementado");
  }

  async sugerencias(termino) {
    throw new Error("Método 'sugerencias' no implementado");
  }

  async findById(id) {
    throw new Error("Método 'findById' no implementado");
  }
}

module.exports = ProductoRepository;