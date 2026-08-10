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
}

module.exports = UserRepository;