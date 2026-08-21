/**
 * Puerto de Dominio: TokenBlacklistRepository
 * Contrato para el almacén de tokens revocados (RN-024 / RF-002.3).
 * Al cerrar sesión, el token JWT activo se agrega a la lista negra para
 * impedir su reutilización en rutas protegidas.
 */
class TokenBlacklistRepository {
  async agregar(token, expiraEn) {
    throw new Error('Método no implementado');
  }

  async estaRevocado(token) {
    throw new Error('Método no implementado');
  }
}

module.exports = TokenBlacklistRepository;