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
}

module.exports = MySQLRolesRepository;
