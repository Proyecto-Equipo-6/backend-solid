const ProveedorRepository = require('../../../domain/ports/ProveedorRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLProveedorRepository
 * Persiste el CRUD de proveedores (CU-025) en MySQL.
 * Tabla: proveedores (ver DB/Schema.sql).
 */
class MySQLProveedorRepository extends ProveedorRepository {
  async guardar(proveedorData) {
    const [resultado] = await pool.execute(
      `INSERT INTO proveedores (nit_proveedor, razon_social, telefono, email, imagen_url, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        proveedorData.nit_proveedor,
        proveedorData.razon_social,
        proveedorData.telefono,
        proveedorData.email,
        proveedorData.imagen_url || null,
        proveedorData.estado ?? 1,
      ]
    );
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorNIT(nit) {
    const [filas] = await pool.execute(
      `SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
       FROM proveedores
       WHERE nit_proveedor = ?
       LIMIT 1`,
      [nit]
    );
    return filas[0] || null;
  }

  async buscarPorId(id_proveedor) {
    const [filas] = await pool.execute(
      `SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
       FROM proveedores
       WHERE id_proveedor = ?
       LIMIT 1`,
      [id_proveedor]
    );
    return filas[0] || null;
  }

  async actualizar(id_proveedor, datos) {
    await pool.execute(
      `UPDATE proveedores
       SET nit_proveedor = ?, razon_social = ?, telefono = ?, email = ?, imagen_url = ?, estado = ?
       WHERE id_proveedor = ?`,
      [
        datos.nit_proveedor,
        datos.razon_social,
        datos.telefono,
        datos.email,
        datos.imagen_url || null,
        datos.estado,
        id_proveedor,
      ]
    );
    return this.buscarPorId(id_proveedor);
  }

  async eliminar(id_proveedor) {
    // Borrado lógico: desactiva el proveedor sin eliminar el registro.
    await pool.execute(
      `UPDATE proveedores SET estado = 0 WHERE id_proveedor = ?`,
      [id_proveedor]
    );
    return this.buscarPorId(id_proveedor);
  }

  async findActivos() {
    const [filas] = await pool.execute(
      `SELECT id_proveedor, nit_proveedor, razon_social, telefono, email, imagen_url, estado, fecha_creacion
       FROM proveedores
       WHERE estado = 1
       ORDER BY id_proveedor ASC`
    );
    return filas;
  }
}

module.exports = MySQLProveedorRepository;