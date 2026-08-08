const UserRepository = require('../../domain/ports/UserRepository');

/**
 * Adaptador de Infraestructura: InMemoryUserRepository
 * Implementa la interfaz (puerto) UserRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    this.users = [];
  }

  async save(user) {
    this.users.push(user);
    return user;
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }
}

module.exports = InMemoryUserRepository;
