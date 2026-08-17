class Repartidor {
  constructor({ id_usuario, nombre = '', estado = 'DISPONIBLE' }) {
    this.id_usuario = id_usuario;
    this.nombre = nombre;
    this.estado = estado; // DISPONIBLE, OCUPADO, INACTIVO
  }

  estaDisponible() {
    return this.estado === 'DISPONIBLE';
  }
}

module.exports = Repartidor;