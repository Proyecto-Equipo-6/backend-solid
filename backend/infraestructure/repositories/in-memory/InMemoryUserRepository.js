const UserRepository = require('../../../domain/ports/UserRepository');

/**
 * Adaptador de Infraestructura: InMemoryUserRepository
 * Implementa la interfaz (puerto) UserRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    this.users = [];
  }

  async save(user) {
    this.users.push(user);
    return user;
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }

  async findByNumeroDocumento(numeroDocumento) {
    return this.users.find(user => user.numero_documento === numeroDocumento) || null;
  }

  async findById(id) {
    return this.users.find(user => (user.id_usuario ?? user.id) === id) || null;
  }

  async updatePassword(id, passwordHash) {
    const user = await this.findById(id);
    if (!user) return false;
    user.password = passwordHash;
    return true;
  }

  async updatePerfil(id, { nombre_apellido, email, telefono, direccion }) {
    const user = await this.findById(id);
    if (!user) return false;
    user.nombre_apellido = nombre_apellido;
    user.email = email;
    user.telefono = telefono;
    user.direccion = direccion;
    return true;
  }

  async findAll(filtros = {}) {
    let usuarios = [...this.users];
    if (filtros.estado !== undefined) {
      usuarios = usuarios.filter((u) => Number(u.activo) === Number(filtros.estado));
    }
    if (filtros.rol) {
      usuarios = usuarios.filter((u) => Number(u.id_rol) === Number(filtros.rol));
    }
    if (filtros.busqueda) {
      const t = filtros.busqueda.toLowerCase();
      usuarios = usuarios.filter(
        (u) =>
          (u.nombre_apellido || '').toLowerCase().includes(t) ||
          (u.email || '').toLowerCase().includes(t) ||
          (u.numero_documento || '').toLowerCase().includes(t)
      );
    }
    return usuarios;
  }

  async updateEstado(id, activo) {
    const user = await this.findById(id);
    if (!user) throw new Error('Usuario no encontrado');
    user.activo = activo ? 1 : 0;
    return { id_usuario: id, activo: user.activo };
  }

  async actualizar(id, datos) {
    const user = await this.findById(id);
    if (!user) throw new Error('Usuario no encontrado');
    Object.assign(user, datos);
    return user;
  }

  async contarPorRol(idRol) {
    return this.users.filter((u) => Number(u.id_rol) === Number(idRol)).length;
  }
}

module.exports = InMemoryUserRepository;
