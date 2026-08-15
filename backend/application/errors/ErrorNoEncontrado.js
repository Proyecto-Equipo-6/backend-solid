/**
 * Error de Aplicación: ErrorNoEncontrado
 * Representa un recurso inexistente (producto, item de carrito, etc.).
 * Se traduce a HTTP 404.
 */
class ErrorNoEncontrado extends Error {
  constructor(mensaje = 'Recurso no encontrado') {
    super(mensaje);
    this.name = 'ErrorNoEncontrado';
    this.status = 404;
  }
}

module.exports = ErrorNoEncontrado;