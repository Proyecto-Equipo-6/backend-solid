/**
 * Puerto RepartidorRepository
 * Define las operaciones necesarias para gestionar repartidores.
 */
class RepartidorRepository {
  async findAll() {
    throw new Error('Método findAll no implementado');
  }

  async buscarPorId(idRepartidor) {
    throw new Error('Método buscarPorId no implementado');
  }

  async estaDisponible(idRepartidor) {
    throw new Error('Método estaDisponible no implementado');
  }

  async marcarOcupado(idRepartidor) {
    throw new Error('Método marcarOcupado no implementado');
  }

  async marcarDisponible(idRepartidor) {
    throw new Error('Método marcarDisponible no implementado');
  }
}

module.exports = RepartidorRepository;