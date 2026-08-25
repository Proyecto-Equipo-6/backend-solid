const TokenBlacklistRepository = require('../../../domain/ports/TokenBlacklistRepository');

/**
 * Adaptador de Infraestructura: InMemoryTokenBlacklistRepository
 * Implementa el puerto TokenBlacklistRepository usando memoria volátil.
 * Adecuado para desarrollo y tests unitarios.
 * NOTA: para producción se recomienda una implementación con respaldo en BD
 * (tabla tokens_revocados) para que la lista negra sobreviva reinicios.
 */
class InMemoryTokenBlacklistRepository extends TokenBlacklistRepository {
  constructor() {
    super();
    this.revocados = new Map(); // token -> expiraEn (Date)
  }

  async agregar(token, expiraEn) {
    this.revocados.set(token, expiraEn ? new Date(expiraEn) : null);
    return true;
  }

  async estaRevocado(token) {
    const expiraEn = this.revocados.get(token);
    if (expiraEn === undefined) return false;
    // Si el token ya expiró, se puede limpiar de la lista negra.
    if (expiraEn !== null && expiraEn.getTime() < Date.now()) {
      this.revocados.delete(token);
      return false;
    }
    return true;
  }
}

module.exports = InMemoryTokenBlacklistRepository;