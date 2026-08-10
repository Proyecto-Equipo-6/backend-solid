/**
 * Error de Aplicación: ErrorAccesoDenegado
 * Representa un usuario existente cuya cuenta está inactiva o suspendida.
 * Se traduce a HTTP 403.
 */
class ErrorAccesoDenegado extends Error {
  constructor(mensaje = 'Su cuenta se encuentra suspendida. Comuníquese con administración') {
    super(mensaje);
    this.name = 'ErrorAccesoDenegado';
    this.status = 403;
  }
}

module.exports = ErrorAccesoDenegado;
