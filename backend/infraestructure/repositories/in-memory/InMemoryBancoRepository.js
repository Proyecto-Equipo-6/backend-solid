const BancoRepository = require('../../../domain/ports/BancoRepository');

/**
 * Adaptador de Infraestructura: InMemoryBancoRepository
 * Implementa la interfaz (puerto) BancoRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryBancoRepository extends BancoRepository {
  constructor() {
    super();
    this.bancos = [];
  }

  async findActivos() {
    return this.bancos.filter((banco) => banco.activo === 1);
  }
}

module.exports = InMemoryBancoRepository;