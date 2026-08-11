/**
 * Port: UserRepository
 * Define el contrato/interfaz que cualquier adaptador de persistencia debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class UserRepository {
  async save(user) {
    throw new Error("Método 'save' no implementado");
  }

  async findByEmail(email) {
    throw new Error("Método 'findByEmail' no implementado");
  }

  async findByNumeroDocumento(numeroDocumento) {
    throw new Error("Método 'findByNumeroDocumento' no implementado");
  }

  async findById(id) {
    throw new Error("Método 'findById' no implementado");
  }

  async updatePassword(id, passwordHash) {
    throw new Error("Método 'updatePassword' no implementado");
  }

  async updatePerfil(id, datos) {
    throw new Error("Método 'updatePerfil' no implementado");
  }
}

module.exports = UserRepository;