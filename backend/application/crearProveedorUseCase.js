class CrearProveedorUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar({ nit_proveedor, razon_social, telefono, email }) {
    if (!nit_proveedor || !razon_social || !telefono || !email) {
      throw new Error('Complete los campos obligatorios');
    }

    const existente = await this.proveedorRepo.buscarPorNIT(nit_proveedor.trim());
    if (existente) {
      throw new Error('El NIT ingresado ya está registrado por otro proveedor');
    }

    return await this.proveedorRepo.guardar({
      nit_proveedor: nit_proveedor.trim(),
      razon_social: razon_social.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      estado: 1 // Activo por defecto
    });
  }
}

module.exports = CrearProveedorUseCase;