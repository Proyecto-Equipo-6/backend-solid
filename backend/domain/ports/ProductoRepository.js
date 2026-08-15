/**
 * Port: ProductoRepository
 * Define el contrato que cualquier adaptador de persistencia de productos debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class ProductoRepository {
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }

  async findById(id) {
    throw new Error("Método 'findById' no implementado");
  }
}

module.exports = ProductoRepository;
