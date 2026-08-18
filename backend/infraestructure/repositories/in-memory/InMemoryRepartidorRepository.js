const RepartidorRepository = require('../../../domain/ports/RepartidorRepository');
const Repartidor = require('../../../domain/models/Repartidor');

class InMemoryRepartidorRepository extends RepartidorRepository {
  constructor(repartidores = []) {
    super();
    this.repartidores = repartidores.map(r => new Repartidor({ ...r }));
    this.contadorId = this.repartidores.length > 0
      ? Math.max(...this.repartidores.map(r => r.id_usuario || 0))
      : 0;
    this.pedidosActivosPorRepartidor = new Map();
  }

  async findAll() {
    return this.repartidores.map(r => new Repartidor({ ...r }));
  }

  async buscarPorId(idRepartidor) {
    return this.repartidores.find(r => r.id_usuario === idRepartidor) || null;
  }

  async buscarPorDocumento(numeroDocumento) {
    return this.repartidores.find(
      r => r.numero_documento && r.numero_documento.toLowerCase() === numeroDocumento.toLowerCase()
    ) || null;
  }

  async buscarPorEmail(email) {
    return this.repartidores.find(
      r => r.email && r.email.toLowerCase() === email.toLowerCase()
    ) || null;
  }

  async guardar(repartidorData) {
    const nuevoId = this.contadorId + 1;
    const nuevoRepartidor = new Repartidor({
      ...repartidorData,
      id_usuario: nuevoId,
      estado: repartidorData.estado || 'INACTIVO'
    });
    this.repartidores.push(nuevoRepartidor);
    this.contadorId = nuevoId;
    return new Repartidor({ ...nuevoRepartidor });
  }

  async actualizar(idRepartidor, datos) {
    const index = this.repartidores.findIndex(r => r.id_usuario === idRepartidor);
    if (index === -1) throw new Error('Repartidor no encontrado');

    const actualizado = new Repartidor({
      ...this.repartidores[index],
      ...datos,
      id_usuario: idRepartidor
    });
    this.repartidores[index] = actualizado;
    return new Repartidor({ ...actualizado });
  }

  async eliminar(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    if (!repartidor) throw new Error('Repartidor no encontrado');
    return this.actualizar(idRepartidor, { estado: 'INACTIVO' });
  }

  async estaDisponible(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    return repartidor ? repartidor.estado === 'DISPONIBLE' : false;
  }

  async marcarOcupado(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    if (!repartidor) throw new Error('Repartidor no encontrado');
    return this.actualizar(idRepartidor, { estado: 'OCUPADO' });
  }

  async marcarDisponible(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    if (!repartidor) throw new Error('Repartidor no encontrado');
    return this.actualizar(idRepartidor, { estado: 'DISPONIBLE' });
  }

  setPedidosActivos(idRepartidor, cantidad) {
    this.pedidosActivosPorRepartidor.set(idRepartidor, cantidad);
  }

  async contarPedidosActivos(idRepartidor) {
    return this.pedidosActivosPorRepartidor.get(idRepartidor) || 0;
  }
}

module.exports = InMemoryRepartidorRepository;