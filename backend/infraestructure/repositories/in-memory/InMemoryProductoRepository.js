const ProductoRepository = require('../../../domain/ports/ProductoRepository');

/**
 * Adaptador de Infraestructura: InMemoryProductoRepository
 * Implementa la interfaz (puerto) ProductoRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryProductoRepository extends ProductoRepository {
  constructor() {
    super();
    this.productos = [];
  }

  async findActivos() {
    return this.productos.filter((producto) => producto.estado === 1);
  }

  async findById(id) {
    return (
      this.productos.find((producto) => producto.id_producto === id) || null
    );
  }
}

module.exports = InMemoryProductoRepository;
