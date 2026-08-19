class Repartidor {
  constructor({ id_usuario, nombre = '', apellidos = '', telefono = '', email = '', estado = 'DISPONIBLE' }) {
    this.id_usuario = id_usuario;
    this.nombre = nombre;
    this.apellidos = apellidos;
    this.telefono = telefono;
    this.email = email;
    this.estado = estado;
  }
}

module.exports = Repartidor;