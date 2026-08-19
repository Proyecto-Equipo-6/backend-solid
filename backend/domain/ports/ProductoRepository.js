/**
 * Port: ProductoRepository
 * Define el contrato que cualquier adaptador de persistencia de productos debe implementar.
 * Incluye métodos del catálogo público y del CRUD administrativo.
 */
class ProductoRepository {
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }

  async findActivosPorCategoria(id_categoria) {
  throw new Error("Método 'findActivosPorCategoria' no implementado");
  }
  
  async findById(id) {
    throw new Error("Método 'findById' no implementado");
  }

  async guardar(productoData) {
    throw new Error("Método 'guardar' no implementado");
  }

  async buscarPorNombre(nombre) {
    throw new Error("Método 'buscarPorNombre' no implementado");
  }

  async buscarPorSKU(sku) {
    throw new Error("Método 'buscarPorSKU' no implementado");
  }

  async actualizar(id_producto, datos) {
    throw new Error("Método 'actualizar' no implementado");
  }

  async eliminar(id_producto) {
    throw new Error("Método 'eliminar' no implementado");
  }

  async reintegrarInventario(id_producto, cantidad) {
    throw new Error("Método 'reintegrarInventario' no implementado");
  }

  async registrarAjusteStock(id_producto, cantidad_nueva, motivo) {
    throw new Error("Método 'registrarAjusteStock' no implementado");
  }

  async sugerencias(termino, limite = 5) {
    throw new Error("Método 'sugerencias' no implementado");
  }

  async buscar(termino, filtros = {}) {
    throw new Error("Método 'buscar' no implementado");
  }
  
}

module.exports = ProductoRepository;
