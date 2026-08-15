/**
 * Error de Aplicación: ErrorNoEncontrado
 * Representa un recurso que no existe o no es visible públicamente.
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
