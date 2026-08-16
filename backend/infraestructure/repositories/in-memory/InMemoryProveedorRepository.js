const Proveedor = require('../../../domain/models/Proveedor');
const ProveedorRepository = require('../../../domain/ports/ProveedorRepository');

/**
 * Adaptador de Infraestructura: InMemoryProveedorRepository
 * Implementa el puerto ProveedorRepository usando memoria volátil.
 */
class InMemoryProveedorRepository extends ProveedorRepository {
  constructor() {
    super();
    this.proveedores = [];
    this.contadorId = 0;
  }

  async guardar(proveedorData) {
    const nuevoId = this.contadorId + 1;
    const nuevoProveedor = new Proveedor({
      ...proveedorData,
      id_proveedor: nuevoId,
      estado: proveedorData.estado ?? 1,
      fecha_creacion: new Date().toISOString()
    });

    this.proveedores.push(nuevoProveedor);
    this.contadorId = nuevoId;
    return new Proveedor({ ...nuevoProveedor });
  }

  async buscarPorNIT(nit) {
    return this.proveedores.find(
      (p) => p.nit_proveedor.toLowerCase() === nit.toLowerCase()
    ) || null;
  }

  async buscarPorId(id_proveedor) {
    return this.proveedores.find((p) => p.id_proveedor === id_proveedor) || null;
  }

  async actualizar(id_proveedor, datos) {
    const index = this.proveedores.findIndex((p) => p.id_proveedor === id_proveedor);
    if (index === -1) throw new Error('Proveedor no encontrado');

    const actualizado = new Proveedor({
      ...this.proveedores[index],
      ...datos,
      id_proveedor,
      fecha_creacion: this.proveedores[index].fecha_creacion
    });

    this.proveedores[index] = actualizado;
    return new Proveedor({ ...actualizado });
  }

  async eliminar(id_proveedor) {
    const proveedor = await this.buscarPorId(id_proveedor);
    if (!proveedor) throw new Error('Proveedor no encontrado');
    // Borrado lógico
    return this.actualizar(id_proveedor, { estado: 0 });
  }

  // NUEVO MÉTODO: para el CP-CU-025-03
  async findActivos() {
    return this.proveedores.filter((p) => p.estado === 1);
  }
}

module.exports = InMemoryProveedorRepository;