class EditarProveedorUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar(id_proveedor, { nit_proveedor, razon_social, telefono, email, estado }) {
    const proveedor = await this.proveedorRepo.buscarPorId(id_proveedor);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    if (!nit_proveedor || !razon_social || !telefono || !email) {
      throw new Error('Complete los campos obligatorios');
    }

    // Validación de NIT: 9 dígitos - 1 dígito
    const regexNIT = /^\d{9}-\d$/;
    if (!regexNIT.test(nit_proveedor.trim())) {
      throw new Error('El NIT debe tener el formato 900123456-7');
    }

    // Validación de razón social
    const regexNombre = /^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s.,&\-()]+$/;
    if (!regexNombre.test(razon_social.trim())) {
      throw new Error('La razón social solo debe contener letras, números, espacios y símbolos básicos');
    }

    // Validación de teléfono: 10 dígitos
    const regexTelefono = /^\d{10}$/;
    if (!regexTelefono.test(telefono.trim())) {
      throw new Error('El teléfono debe contener exactamente 10 dígitos');
    }

    // Validación de email
    const regexEmail = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
    if (!regexEmail.test(email.trim())) {
      throw new Error('El correo electrónico no tiene un formato válido');
    }

    // Validar NIT único, excluyendo el mismo proveedor
    const existente = await this.proveedorRepo.buscarPorNIT(nit_proveedor.trim());
    if (existente && existente.id_proveedor !== id_proveedor) {
      throw new Error('El NIT ingresado ya está registrado por otro proveedor');
    }

    // Convertir estado si viene como string
    let estadoNumerico = proveedor.estado;
    if (estado !== undefined) {
      if (estado === 'Activo') estadoNumerico = 1;
      else if (estado === 'Inactivo') estadoNumerico = 0;
      else if ([0, 1].includes(estado)) estadoNumerico = estado;
      else throw new Error('Estado inválido');
    }

    return await this.proveedorRepo.actualizar(id_proveedor, {
      nit_proveedor: nit_proveedor.trim(),
      razon_social: razon_social.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      estado: estadoNumerico
    });
  }
}

module.exports = EditarProveedorUseCase;