const TokensRecuperacionRepository = require('../../../domain/ports/TokensRecuperacionRepository');

/**
 * Adaptador de Infraestructura: InMemoryTokensRecuperacionRepository
 * Implementa la interfaz (puerto) usando memoria volátil. (Principio LSP)
 */
class InMemoryTokensRecuperacionRepository extends TokensRecuperacionRepository {
  constructor() {
    super();
    this.tokens = [];
  }

  async save({ id_usuario, token, expira_en }) {
    const registro = {
      id_token: this.tokens.length + 1,
      id_usuario,
      token,
      expira_en,
      usado: 0,
    };
    this.tokens.push(registro);
    return registro;
  }

  async findByToken(token) {
    return this.tokens.find((registro) => registro.token === token) || null;
  }

  async marcarUsado(token) {
    const registro = this.tokens.find((item) => item.token === token);
    if (!registro) return false;
    registro.usado = 1;
    return true;
  }
}

module.exports = InMemoryTokensRecuperacionRepository;
