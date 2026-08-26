/**
 * Port: CarritoRepository
 * Define el contrato que cualquier adaptador de persistencia del carrito
 * debe implementar (Principio de Inversión de Dependencias - DIP).
 */
class CarritoRepository {
  async obtenerCarrito(idUsuario) {
    throw new Error("Método 'obtenerCarrito' no implementado");
  }

  async agregarProducto(idUsuario, producto, cantidad) {
    throw new Error("Método 'agregarProducto' no implementado");
  }

  async actualizarCantidad(idUsuario, idProducto, cantidad) {
    throw new Error("Método 'actualizarCantidad' no implementado");
  }

  async eliminarProducto(idUsuario, idProducto) {
    throw new Error("Método 'eliminarProducto' no implementado");
  }

  async obtenerCantidad(idUsuario, idProducto) {
    throw new Error("Método 'obtenerCantidad' no implementado");
  }

  async contarItems(idUsuario) {
    throw new Error("Método 'contarItems' no implementado");
  }
}

module.exports = CarritoRepository;