/**
 * Caso de Uso: VerCarritoUseCase
 * Consulta el carrito del cliente autenticado (RF-004.1).
 * RN-038: el carrito se almacena en BD vinculado al ID del cliente.
 * RN-039: solo accede un cliente con sesión iniciada.
 * RN-040: los datos persisten aunque cierre sesión.
 */
class VerCarritoUseCase {
  constructor(carritoRepository) {
    this.carritoRepository = carritoRepository;
  }

  async execute(usuario) {
    const carrito = await this.carritoRepository.obtenerCarrito(usuario.id_usuario);
    return {
      usuarioId: usuario.id_usuario,
      items: carrito.items,
      total: carrito.total,
      vacio: carrito.items.length === 0,
    };
  }
}

module.exports = VerCarritoUseCase;