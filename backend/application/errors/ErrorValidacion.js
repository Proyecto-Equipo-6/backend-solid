/**
 * Error de Aplicación: ErrorValidacion
 * Representa datos de entrada inválidos (cantidad, filtros, término, etc.).
 * Se traduce a HTTP 400.
 */
class ErrorValidacion extends Error {
  constructor(mensaje = 'Datos de entrada inválidos') {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.status = 400;
  }
}

module.exports = ErrorValidacion;