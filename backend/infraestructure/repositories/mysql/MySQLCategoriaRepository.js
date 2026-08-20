const CategoriaRepository = require('../../../domain/ports/CategoriaRepository');
const pool = require('../../database/db');

const SELECT_BASE = `
  SELECT id_categoria, nombre, descripcion, estado, fecha_creacion
  FROM categorias
`;

/**
 * Adaptador de Infraestructura: MySQLCategoriaRepository
 * Implementa el contrato CategoriaRepository usando MySQL (mysql2/promise).
 * Incluye el catálogo público y el CRUD administrativo (CU-022).
 */
class MySQLCategoriaRepository extends CategoriaRepository {
  async findActivos() {
    const query = `${SELECT_BASE} WHERE estado = 1 ORDER BY id_categoria ASC`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async findAll() {
    const query = `${SELECT_BASE} ORDER BY id_categoria ASC`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async guardar(categoriaData) {
    const { nombre, descripcion, estado } = categoriaData;
    const [result] = await pool.execute(
      'INSERT INTO categorias (nombre, descripcion, estado) VALUES (?, ?, ?)',
      [nombre, descripcion, estado ?? 1]
    );
    return this.buscarPorId(result.insertId);
  }

  async buscarPorNombre(nombre) {
    const query = `${SELECT_BASE} WHERE nombre = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [nombre]);
    return rows[0] || null;
  }

  async buscarPorId(id_categoria) {
    const query = `${SELECT_BASE} WHERE id_categoria = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [id_categoria]);
    return rows[0] || null;
  }

  async actualizar(id_categoria, datos) {
    const { nombre, descripcion, estado } = datos;
    await pool.execute(
      'UPDATE categorias SET nombre = ?, descripcion = ?, estado = ? WHERE id_categoria = ?',
      [nombre, descripcion, estado, id_categoria]
    );
    return this.buscarPorId(id_categoria);
  }

  async eliminar(id_categoria) {
    // Borrado lógico: desactiva la categoría sin eliminar el registro.
    await pool.execute('UPDATE categorias SET estado = 0 WHERE id_categoria = ?', [id_categoria]);
    return true;
  }

  async contarProductosAsociados(id_categoria) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM productos WHERE id_categoria = ?',
      [id_categoria]
    );
    return rows[0].total;
  }
}

module.exports = MySQLCategoriaRepository;