class User {
  constructor({
    id = null,
    nombre_apellido,
    tipo_documento,
    numero_documento,
    email,
    password,
    telefono,
    direccion,
    activo = 1
  } = {}) {
    this.id = id;
    this.nombre_apellido = nombre_apellido;
    this.tipo_documento = tipo_documento;
    this.numero_documento = numero_documento;
    this.email = email;
    this.password = password;
    this.telefono = telefono;
    this.direccion = direccion;
    this.activo = activo;
  }

  isValid() {
    const tiposValidos = ['CC', 'Pasaporte', 'CE', 'Otro'];
    const telefonoValido = /^\d{10}$/.test(this.telefono || '');
    const documentoValido = /^\d+$/.test(this.numero_documento || '');
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email || '');
    const passwordValida =
      typeof this.password === 'string' &&
      this.password.length >= 8 &&
      /[A-Z]/.test(this.password) &&
      /[0-9]/.test(this.password);

    return Boolean(
      this.nombre_apellido &&
      this.tipo_documento && tiposValidos.includes(this.tipo_documento) &&
      this.numero_documento && documentoValido &&
      this.email && emailValido &&
      passwordValida &&
      telefonoValido &&
      this.direccion
    );
  }
}

module.exports = User;
