const UserRepository = require('../../../domain/ports/UserRepository');
const pool = require('../../database/db');

class MySQLUserRepository extends UserRepository {
  async save(user) {
    const query = `
      INSERT INTO usuarios
        (id_rol, nombre_apellido, tipo_documento, numero_documento, email, password, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      user.id_rol,
      user.nombre_apellido,
      user.tipo_documento,
      user.numero_documento,
      user.email,
      user.password,
      user.telefono,
      user.direccion
    ]);
    return { ...user, id: result.insertId };
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
  }

  async findByNumeroDocumento(numeroDocumento) {
    const query = 'SELECT * FROM usuarios WHERE numero_documento = ? LIMIT 1';
    const [rows] = await pool.execute(query, [numeroDocumento]);
    return rows[0] || null;
  }

  async findById(id) {
    const query = 'SELECT * FROM usuarios WHERE id_usuario = ? LIMIT 1';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async updatePassword(id, passwordHash) {
    const query = 'UPDATE usuarios SET password = ? WHERE id_usuario = ?';
    const [result] = await pool.execute(query, [passwordHash, id]);
    return result.affectedRows > 0;
  }

  async updatePerfil(id, { nombre_apellido, email, telefono, direccion }) {
    const query = `
      UPDATE usuarios
      SET nombre_apellido = ?, email = ?, telefono = ?, direccion = ?
      WHERE id_usuario = ?
    `;
    const [result] = await pool.execute(query, [
      nombre_apellido,
      email,
      telefono,
      direccion,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async findAll(filtros = {}) {
    let sql = `SELECT id_usuario, id_rol, nombre_apellido, tipo_documento, numero_documento, email, telefono, direccion, activo, fecha_creacion
               FROM usuarios WHERE 1=1`;
    const params = [];

    if (filtros.estado !== undefined) {
      sql += ' AND activo = ?';
      params.push(filtros.estado);
    }
    if (filtros.rol) {
      sql += ' AND id_rol = ?';
      params.push(filtros.rol);
    }
    if (filtros.busqueda) {
      sql += ' AND (nombre_apellido LIKE ? OR email LIKE ? OR numero_documento LIKE ?)';
      const termino = `%${filtros.busqueda}%`;
      params.push(termino, termino, termino);
    }

    sql += ' ORDER BY id_usuario ASC';

    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 10;
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async updateEstado(id, activo) {
    const [result] = await pool.execute(
      'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
      [activo ? 1 : 0, id]
    );
    if (result.affectedRows === 0) {
      throw new Error('Usuario no encontrado');
    }
    return { id_usuario: id, activo: activo ? 1 : 0 };
  }
}

module.exports = MySQLUserRepository;
