/**
 * Port: ProveedorRepository
 * Define el contrato que cualquier adaptador de persistencia de proveedores debe implementar.
 */
class ProveedorRepository {
  async guardar(proveedorData) {
    throw new Error("Método 'guardar' no implementado");
  }

  async buscarPorNIT(nit) {
    throw new Error("Método 'buscarPorNIT' no implementado");
  }

  async buscarPorId(id_proveedor) {
    throw new Error("Método 'buscarPorId' no implementado");
  }

  async actualizar(id_proveedor, datos) {
    throw new Error("Método 'actualizar' no implementado");
  }

  async eliminar(id_proveedor) {
    throw new Error("Método 'eliminar' no implementado");
  }

  /**
   * CU-025: lista los proveedores activos (estado = 1).
   * @returns {Promise<Array>}
   */
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }
}

module.exports = ProveedorRepository;