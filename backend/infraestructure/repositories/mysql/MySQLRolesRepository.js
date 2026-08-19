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

  async findAll() {
    const [rows] = await pool.execute('SELECT id_rol AS id, nombre AS name, descripcion AS description FROM roles ORDER BY id_rol ASC');
    return rows;
  }
}

module.exports = MySQLRolesRepository;
