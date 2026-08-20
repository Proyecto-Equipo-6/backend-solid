const RolesRepository = require('../../../domain/ports/RolesRepository');
const pool = require('../../database/db');

class MySQLRolesRepository extends RolesRepository {
  async update(rol) {
    const query = 'UPDATE roles SET nombre = ?, descripcion = ? WHERE id_rol = ?';
    const [result] = await pool.execute(query, [rol.name, rol.description, rol.id]);
    if (result.affectedRows === 0) {
      throw new Error('Rol no encontrado');
    }
    return { id: rol.id, name: rol.name, description: rol.description };
  }

  async crear(rol) {
    const query = 'INSERT INTO roles (nombre, descripcion) VALUES (?, ?)';
    const [result] = await pool.execute(query, [rol.name, rol.description || null]);
    return { id: result.insertId, name: rol.name, description: rol.description || null };
  }

  async eliminar(id) {
    const [enUso] = await pool.execute('SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ?', [id]);
    if (Number(enUso[0]?.total) > 0) {
      throw new Error('No se puede eliminar un rol que está asignado a usuarios');
    }
    const [result] = await pool.execute('DELETE FROM roles WHERE id_rol = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Rol no encontrado');
    }
    return { id, eliminado: true };
  }

  async findAll() {
    const [rows] = await pool.execute('SELECT id_rol AS id, nombre AS name, descripcion AS description FROM roles ORDER BY id_rol ASC');
    return rows;
  }
}

module.exports = MySQLRolesRepository;
