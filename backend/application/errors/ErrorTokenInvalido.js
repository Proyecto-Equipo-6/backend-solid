/**
 * Error de Aplicación: ErrorTokenInvalido
 * Representa un token de recuperación inexistente, expirado o ya utilizado.
 * Se traduce a HTTP 400.
 */
class ErrorTokenInvalido extends Error {
  constructor(mensaje = 'El token de recuperación ha expirado. Solicitelo nuevamente') {
    super(mensaje);
    this.name = 'ErrorTokenInvalido';
    this.status = 400;
  }
}

module.exports = ErrorTokenInvalido;
