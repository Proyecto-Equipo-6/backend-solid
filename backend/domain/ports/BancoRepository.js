/**
 * Port: BancoRepository
 * Define el contrato que cualquier adaptador de persistencia de bancos debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class BancoRepository {
  async findActivos() {
    throw new Error("Método 'findActivos' no implementado");
  }
}

module.exports = BancoRepository;