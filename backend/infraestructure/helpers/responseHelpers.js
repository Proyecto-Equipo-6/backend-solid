/**
 * Constantes compartidas para mensajes de respuesta HTTP.
 */
const MENSAJES = {
  NO_ENCONTRADO: 'no encontrado',
};

/**
 * Determina si un error es de tipo "no encontrado" (404).
 * @param {string} mensaje - Mensaje del error
 * @returns {boolean}
 */
function esNoEncontrado(mensaje) {
  return mensaje?.includes(MENSAJES.NO_ENCONTRADO);
}

module.exports = { MENSAJES, esNoEncontrado };
