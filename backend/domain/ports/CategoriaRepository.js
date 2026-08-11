/**
 * Port: CategoriaRepository
 * Define el contrato que cualquier adaptador de persistencia de categorías debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class CategoriaRepository {
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }
}

module.exports = CategoriaRepository;
