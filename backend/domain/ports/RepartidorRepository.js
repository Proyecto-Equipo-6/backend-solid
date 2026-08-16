/**
 * Puerto RepartidorRepository
 * Define las operaciones necesarias para gestionar repartidores.
 */
class RepartidorRepository {
  async estaDisponible(idRepartidor) {
    throw new Error('Método estaDisponible no implementado');
  }

  async marcarOcupado(idRepartidor) {
    throw new Error('Método marcarOcupado no implementado');
  }
}

module.exports = RepartidorRepository;