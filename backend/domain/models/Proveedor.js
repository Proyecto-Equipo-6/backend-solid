/**
 * Modelo de Dominio: Proveedor
 * Representa un proveedor del inventario.
 */
class Proveedor {
  constructor({
    id_proveedor = null,
    nit_proveedor,
    razon_social,
    telefono,
    email,
    imagen_url = null,
    estado = 1,
    fecha_creacion = new Date().toISOString()
  } = {}) {
    this.id_proveedor = id_proveedor;
    this.nit_proveedor = nit_proveedor;
    this.razon_social = razon_social;
    this.telefono = telefono;
    this.email = email;
    this.imagen_url = imagen_url;
    this.estado = estado; // 1 = Activo, 0 = Inactivo
    this.fecha_creacion = fecha_creacion;
  }

  esActivo() {
    return this.estado === 1;
  }

  desactivar() {
    this.estado = 0;
  }
}

module.exports = Proveedor;