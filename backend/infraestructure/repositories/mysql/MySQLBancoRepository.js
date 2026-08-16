const BancoRepository = require('../../../domain/ports/BancoRepository');
const pool = require('../../database/db');

class MySQLBancoRepository extends BancoRepository {
  async findActivos() {
    const query = `
      SELECT id_banco, id_metodo_pago, nombre, descripcion, numero_cuenta
      FROM bancos
      WHERE activo = 1
      ORDER BY id_banco ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = MySQLBancoRepository;