/**
 * Error de Aplicación: ErrorConflicto
 * Representa una solicitud válida que choca con el estado actual del recurso
 * (por ejemplo, correo o documento ya registrados). Se traduce a HTTP 409.
 */
class ErrorConflicto extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorConflicto';
    this.status = 409;
  }
}

module.exports = ErrorConflicto;
