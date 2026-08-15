/**
 * Error de Aplicación: ErrorSesionExpirada
 * Representa un token de sesión ausente, expirado o inválido.
 * Se traduce a HTTP 401.
 */
class ErrorSesionExpirada extends Error {
  constructor(mensaje = 'Su sesión ha expirado. Inicie sesión nuevamente') {
    super(mensaje);
    this.name = 'ErrorSesionExpirada';
    this.status = 401;
  }
}

module.exports = ErrorSesionExpirada;
