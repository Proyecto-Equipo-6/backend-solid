/**
 * Error de Aplicación: ErrorNoAutorizado
 * Representa credenciales inválidas (correo inexistente o contraseña incorrecta).
 * Se traduce a HTTP 401.
 */
class ErrorNoAutorizado extends Error {
  constructor(mensaje = 'Correo electrónico o contraseña incorrectos') {
    super(mensaje);
    this.name = 'ErrorNoAutorizado';
    this.status = 401;
  }
}

module.exports = ErrorNoAutorizado;
