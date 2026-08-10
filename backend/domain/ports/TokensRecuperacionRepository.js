/**
 * Port: TokensRecuperacionRepository
 * Define el contrato para la persistencia de tokens de recuperación de contraseña.
 * (Principio de Inversión de Dependencias - DIP)
 */
class TokensRecuperacionRepository {
  async save(token) {
    throw new Error("Método 'save' no implementado");
  }

  async findByToken(token) {
    throw new Error("Método 'findByToken' no implementado");
  }

  async marcarUsado(token) {
    throw new Error("Método 'marcarUsado' no implementado");
  }
}

module.exports = TokensRecuperacionRepository;
