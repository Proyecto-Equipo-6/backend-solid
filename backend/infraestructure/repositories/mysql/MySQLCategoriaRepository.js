const CategoriaRepository = require('../../../domain/ports/CategoriaRepository');
const pool = require('../../database/db');

class MySQLCategoriaRepository extends CategoriaRepository {
  async findActivos() {
    const query = `
      SELECT id_categoria, nombre, descripcion
      FROM categorias
      WHERE estado = 1
      ORDER BY id_categoria ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = MySQLCategoriaRepository;
