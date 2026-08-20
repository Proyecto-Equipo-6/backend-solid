/**
 * Constantes compartidas para mensajes de respuesta HTTP.
 */
const MENSAJES = {
  NO_ENCONTRADO: 'no encontrado',
  CONFLICTO: 'ya se encuentra',
};

function esNoEncontrado(mensaje) {
  return mensaje?.includes(MENSAJES.NO_ENCONTRADO);
}

function esConflicto(mensaje) {
  return mensaje?.includes(MENSAJES.CONFLICTO);
}

module.exports = { MENSAJES, esNoEncontrado, esConflicto };
