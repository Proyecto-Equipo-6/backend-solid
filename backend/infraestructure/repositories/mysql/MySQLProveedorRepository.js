const ProveedorRepository = require('../../../domain/ports/ProveedorRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLProveedorRepository
 * Persiste el CRUD de proveedores (CU-025) en MySQL.
 * Tabla: proveedores (ver DB/Schema.sql).
 */
class MySQLProveedorRepository extends ProveedorRepository {
  /**
   * Ejecuta query con fallback si falla por columna imagen_url inexistente.
   * @param {string} sqlWithImg - Query con imagen_url
   * @param {string} sqlWithoutImg - Query sin imagen_url
   * @param {Array} params - Parámetros
   */
  async _queryWithFallback(sqlWithImg, sqlWithoutImg, params) {
    try {
      const [filas] = await pool.execute(sqlWithImg, params);
      return filas;
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('imagen_url')) {
        console.warn('Columna imagen_url no existe en BD, usando query fallback');
        const [filas] = await pool.execute(sqlWithoutImg, params);
        return filas;
      }
      throw error;
    }
  }

  async guardar(proveedorData) {
    const sqlWithImg = `
      INSERT INTO proveedores (nit_proveedor, razon_social, telefono, email, imagen_url, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const sqlWithoutImg = `
      INSERT INTO proveedores (nit_proveedor, razon_social, telefono, email, estado)
      VALUES (?, ?, ?, ?, ?)
    `;
    const paramsWithImg = [
      proveedorData.nit_proveedor,
      proveedorData.razon_social,
      proveedorData.telefono,
      proveedorData.email,
      proveedorData.imagen_url || null,
      proveedorData.estado ?? 1,
    ];
    const paramsWithoutImg = [
      proveedorData.nit_proveedor,
      proveedorData.razon_social,
      proveedorData.telefono,
      proveedorData.email,
      proveedorData.estado ?? 1,
    ];

    let resultado;
    try {
      [resultado] = await pool.execute(sqlWithImg, paramsWithImg);
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('imagen_url')) {
        console.warn('Columna imagen_url no existe en BD, insertando sin ella');
        [resultado] = await pool.execute(sqlWithoutImg, paramsWithoutImg);
      } else {
        throw error;
      }
    }
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorNIT(nit) {
    const sqlWithImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
      FROM proveedores
      WHERE nit_proveedor = ?
      LIMIT 1
    `;
    const sqlWithoutImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, estado, fecha_creacion
      FROM proveedores
      WHERE nit_proveedor = ?
      LIMIT 1
    `;
    const filas = await this._queryWithFallback(sqlWithImg, sqlWithoutImg, [nit]);
    return filas[0] || null;
  }

  async buscarPorId(id_proveedor) {
    const sqlWithImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
      FROM proveedores
      WHERE id_proveedor = ?
      LIMIT 1
    `;
    const sqlWithoutImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, estado, fecha_creacion
      FROM proveedores
      WHERE id_proveedor = ?
      LIMIT 1
    `;
    const filas = await this._queryWithFallback(sqlWithImg, sqlWithoutImg, [id_proveedor]);
    return filas[0] || null;
  }

  async actualizar(id_proveedor, datos) {
    const sqlWithImg = `
      UPDATE proveedores
      SET nit_proveedor = ?, razon_social = ?, telefono = ?, email = ?, imagen_url = ?, estado = ?
      WHERE id_proveedor = ?
    `;
    const sqlWithoutImg = `
      UPDATE proveedores
      SET nit_proveedor = ?, razon_social = ?, telefono = ?, email = ?, estado = ?
      WHERE id_proveedor = ?
    `;
    const paramsWithImg = [
      datos.nit_proveedor,
      datos.razon_social,
      datos.telefono,
      datos.email,
      datos.imagen_url || null,
      datos.estado,
      id_proveedor,
    ];
    const paramsWithoutImg = [
      datos.nit_proveedor,
      datos.razon_social,
      datos.telefono,
      datos.email,
      datos.estado,
      id_proveedor,
    ];

    try {
      await pool.execute(sqlWithImg, paramsWithImg);
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage?.includes('imagen_url')) {
        console.warn('Columna imagen_url no existe en BD, actualizando sin ella');
        await pool.execute(sqlWithoutImg, paramsWithoutImg);
      } else {
        throw error;
      }
    }
    return this.buscarPorId(id_proveedor);
  }

  async eliminar(id_proveedor) {
    await pool.execute(
      `UPDATE proveedores SET estado = 0 WHERE id_proveedor = ?`,
      [id_proveedor]
    );
    return this.buscarPorId(id_proveedor);
  }

  async findActivos() {
    const sqlWithImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
      FROM proveedores
      WHERE estado = 1
      ORDER BY id_proveedor ASC
    `;
    const sqlWithoutImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, estado, fecha_creacion
      FROM proveedores
      WHERE estado = 1
      ORDER BY id_proveedor ASC
    `;
    return this._queryWithFallback(sqlWithImg, sqlWithoutImg, []);
  }

  async findAll() {
    const sqlWithImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
      FROM proveedores
      ORDER BY id_proveedor ASC
    `;
    const sqlWithoutImg = `
      SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, estado, fecha_creacion
      FROM proveedores
      ORDER BY id_proveedor ASC
    `;
    return this._queryWithFallback(sqlWithImg, sqlWithoutImg, []);
  }
}

module.exports = MySQLProveedorRepository;