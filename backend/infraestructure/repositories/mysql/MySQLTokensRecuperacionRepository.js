const TokensRecuperacionRepository = require('../../../domain/ports/TokensRecuperacionRepository');
const pool = require('../../database/db');

class MySQLTokensRecuperacionRepository extends TokensRecuperacionRepository {
  async save({ id_usuario, token, expira_en }) {
    const query = `
      INSERT INTO tokens_recuperacion (id_usuario, token, expira_en)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [id_usuario, token, expira_en]);
    return { id_token: result.insertId, id_usuario, token, expira_en };
  }

  async findByToken(token) {
    const query = 'SELECT * FROM tokens_recuperacion WHERE token = ? LIMIT 1';
    const [rows] = await pool.execute(query, [token]);
    return rows[0] || null;
  }

  async marcarUsado(token) {
    const query = 'UPDATE tokens_recuperacion SET usado = 1 WHERE token = ?';
    const [result] = await pool.execute(query, [token]);
    return result.affectedRows > 0;
  }
}

module.exports = MySQLTokensRecuperacionRepository;
