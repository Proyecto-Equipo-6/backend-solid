const UserRepository = require('../../../domain/ports/UserRepository');

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

  async findByNumeroDocumento(numeroDocumento) {
    return this.users.find(user => user.numero_documento === numeroDocumento) || null;
  }

  async findById(id) {
    return this.users.find(user => (user.id_usuario ?? user.id) === id) || null;
  }

  async updatePassword(id, passwordHash) {
    const user = await this.findById(id);
    if (!user) return false;
    user.password = passwordHash;
    return true;
  }

  async updatePerfil(id, { nombre_apellido, email, telefono, direccion }) {
    const user = await this.findById(id);
    if (!user) return false;
    user.nombre_apellido = nombre_apellido;
    user.email = email;
    user.telefono = telefono;
    user.direccion = direccion;
    return true;
  }
}

module.exports = InMemoryUserRepository;
