class CrearProveedorUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar({ nit_proveedor, razon_social, telefono, email, imagen_url }) {
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
      throw new Error('La razón social solo debe contener letras, números y espacios');
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

    const existente = await this.proveedorRepo.buscarPorNIT(nit_proveedor.trim());
    if (existente) {
      throw new Error('El NIT ingresado ya está registrado por otro proveedor');
    }

    return await this.proveedorRepo.guardar({
      nit_proveedor: nit_proveedor.trim(),
      razon_social: razon_social.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      imagen_url: imagen_url || null,
      estado: 1
    });
  }
}

module.exports = CrearProveedorUseCase;