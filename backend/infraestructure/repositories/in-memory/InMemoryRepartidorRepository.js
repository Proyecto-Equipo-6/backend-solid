const RepartidorRepository = require('../../../domain/ports/RepartidorRepository');
const Repartidor = require('../../../domain/models/Repartidor');

class InMemoryRepartidorRepository extends RepartidorRepository {
  constructor(repartidores = []) {
    super();
    this.repartidores = repartidores.map(r => new Repartidor({ ...r }));
  }

  async estaDisponible(idRepartidor) {
    const repartidor = this.repartidores.find(r => r.id_usuario === idRepartidor);
    return repartidor ? repartidor.estaDisponible() : false;
  }

  async marcarOcupado(idRepartidor) {
    const index = this.repartidores.findIndex(r => r.id_usuario === idRepartidor);
    if (index === -1) throw new Error('Repartidor no encontrado');
    this.repartidores[index].estado = 'OCUPADO';
    return new Repartidor({ ...this.repartidores[index] });
  }

  // NUEVO: marcar disponible
  async marcarDisponible(idRepartidor) {
    const index = this.repartidores.findIndex(r => r.id_usuario === idRepartidor);
    if (index === -1) throw new Error('Repartidor no encontrado');
    this.repartidores[index].estado = 'DISPONIBLE';
    return new Repartidor({ ...this.repartidores[index] });
  }

  agregarRepartidor(repartidor) {
    this.repartidores.push(new Repartidor({ ...repartidor }));
  }
}

module.exports = InMemoryRepartidorRepository;