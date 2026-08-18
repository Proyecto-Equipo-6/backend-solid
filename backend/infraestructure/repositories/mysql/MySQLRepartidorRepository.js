const RepartidorRepository = require('../../../domain/ports/RepartidorRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLRepartidorRepository
 * Persiste la gestión de repartidores (CU-021) en MySQL.
 * Tabla: repartidores (FK a usuarios).
 */
class MySQLRepartidorRepository extends RepartidorRepository {
  async findAll() {
    const [filas] = await pool.execute(
      `SELECT r.id_repartidor, r.id_usuario, r.vehiculo, r.placa, r.activo,
              u.nombre_apellido AS nombre, '' AS apellidos,
              u.telefono, u.email,
              CASE WHEN r.activo = 1 THEN 'DISPONIBLE' ELSE 'INACTIVO' END AS estado
       FROM repartidores r
       INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
       ORDER BY r.id_repartidor ASC`
    );
    return filas;
  }

  async buscarPorId(idRepartidor) {
    const [filas] = await pool.execute(
      `SELECT r.id_repartidor, r.id_usuario, r.vehiculo, r.placa, r.activo,
              u.nombre_apellido AS nombre, '' AS apellidos,
              u.telefono, u.email,
              CASE WHEN r.activo = 1 THEN 'DISPONIBLE' ELSE 'INACTIVO' END AS estado
       FROM repartidores r
       INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
       WHERE r.id_repartidor = ?
       LIMIT 1`,
      [idRepartidor]
    );
    return filas[0] || null;
  }

  async estaDisponible(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    return repartidor && repartidor.estado === 'DISPONIBLE';
  }

  async marcarOcupado(idRepartidor) {
    await pool.execute(
      'UPDATE repartidores SET activo = 0 WHERE id_repartidor = ?',
      [idRepartidor]
    );
  }

  async marcarDisponible(idRepartidor) {
    await pool.execute(
      'UPDATE repartidores SET activo = 1 WHERE id_repartidor = ?',
      [idRepartidor]
    );
  }

  async actualizar(idRepartidor, datos) {
    if (datos.estado === 'INACTIVO') {
      await pool.execute(
        'UPDATE repartidores SET activo = 0 WHERE id_repartidor = ?',
        [idRepartidor]
      );
    } else if (datos.estado === 'DISPONIBLE') {
      await pool.execute(
        'UPDATE repartidores SET activo = 1 WHERE id_repartidor = ?',
        [idRepartidor]
      );
    }
    return this.buscarPorId(idRepartidor);
  }
}

module.exports = MySQLRepartidorRepository;
