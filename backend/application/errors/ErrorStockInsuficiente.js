/**
 * Error de Aplicación: ErrorStockInsuficiente
 * Representa una solicitud que excede el stock disponible.
 * RN-033 / RN-035: no se agregan más unidades que el stock y se muestra
 * "No hay unidades suficientes". Se traduce a HTTP 409.
 */
class ErrorStockInsuficiente extends Error {
  constructor(mensaje = 'No hay unidades suficientes') {
    super(mensaje);
    this.name = 'ErrorStockInsuficiente';
    this.status = 409;
  }
}

module.exports = ErrorStockInsuficiente;