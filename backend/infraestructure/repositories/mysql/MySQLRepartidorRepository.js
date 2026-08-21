const RepartidorRepository = require('../../../domain/ports/RepartidorRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLRepartidorRepository
 * Persiste la gestión de repartidores (CU-021) en MySQL.
 * Tabla: repartidores (FK a usuarios).
 */
class MySQLRepartidorRepository extends RepartidorRepository {
  async obtenerColumnasRepartidor() {
    const [columnas] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'repartidores'`
    );
    return new Set((columnas || []).map(columna => columna.COLUMN_NAME || columna.column_name));
  }

  async findAll() {
    const columnas = await this.obtenerColumnasRepartidor();
    const columnasExtra = columnas.has('vehiculo') || columnas.has('placa')
      ? `${columnas.has('vehiculo') ? 'r.vehiculo,' : ''} ${columnas.has('placa') ? 'r.placa,' : ''}`
      : '';

    const [filas] = await pool.execute(
      `SELECT r.id_repartidor, r.id_usuario, r.activo, ${columnasExtra}
              u.nombre_apellido AS nombre, '' AS apellidos,
              u.nombre_apellido AS nombre_apellido,
              u.telefono, u.email, u.direccion,
              CASE WHEN r.activo = 1 THEN 'DISPONIBLE' ELSE 'INACTIVO' END AS estado
       FROM repartidores r
       INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
       ORDER BY r.id_repartidor ASC`
    );
    return filas;
  }

  async buscarPorId(idRepartidor) {
    const columnas = await this.obtenerColumnasRepartidor();
    const columnasExtra = columnas.has('vehiculo') || columnas.has('placa')
      ? `${columnas.has('vehiculo') ? 'r.vehiculo,' : ''} ${columnas.has('placa') ? 'r.placa,' : ''}`
      : '';

    const [filas] = await pool.execute(
      `SELECT r.id_repartidor, r.id_usuario, r.activo, ${columnasExtra}
              u.nombre_apellido AS nombre, '' AS apellidos,
              u.nombre_apellido AS nombre_apellido,
              u.telefono, u.email, u.direccion,
              CASE WHEN r.activo = 1 THEN 'DISPONIBLE' ELSE 'INACTIVO' END AS estado
       FROM repartidores r
       INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
       WHERE r.id_usuario = ?
       LIMIT 1`,
      [idRepartidor]
    );
    return filas[0] || null;
  }

  async estaDisponible(idRepartidor) {
    const repartidor = await this.buscarPorId(idRepartidor);
    return repartidor?.estado === 'DISPONIBLE';
  }

  // El estado "ocupado" se deriva de los pedidos activos del repartidor
  // (ver ConsultarRepartidoresUseCase). Estos métodos no alteran el estado
  // de cuenta (activo) para no marcar como inactivo a un repartidor que
  // simplemente está trabajando.
  async marcarOcupado(idRepartidor) {
    await pool.execute(
      'UPDATE repartidores SET activo = 0 WHERE id_usuario = ?',
      [idRepartidor]
    );
    return this.buscarPorId(idRepartidor);
  }

  async marcarDisponible(idRepartidor) {
    await pool.execute(
      'UPDATE repartidores SET activo = 1 WHERE id_usuario = ?',
      [idRepartidor]
    );
    return this.buscarPorId(idRepartidor);
  }

  async actualizar(idRepartidor, datos) {
    const columnas = await this.obtenerColumnasRepartidor();

    if (datos.estado === 'INACTIVO') {
      await pool.execute(
        'UPDATE repartidores SET activo = 0 WHERE id_usuario = ?',
        [idRepartidor]
      );
    } else if (datos.estado === 'DISPONIBLE') {
      await pool.execute(
        'UPDATE repartidores SET activo = 1 WHERE id_usuario = ?',
        [idRepartidor]
      );
    }

    const tieneVehiculo = datos.vehiculo !== undefined && columnas.has('vehiculo');
    const tienePlaca = datos.placa !== undefined && columnas.has('placa');

    if (tieneVehiculo || tienePlaca) {
      const campos = [];
      const valores = [];
      if (tieneVehiculo) {
        campos.push('vehiculo = ?');
        valores.push(datos.vehiculo);
      }
      if (tienePlaca) {
        campos.push('placa = ?');
        valores.push(datos.placa);
      }
      valores.push(idRepartidor);
      await pool.execute(
        `UPDATE repartidores SET ${campos.join(', ')} WHERE id_usuario = ?`,
        valores
      );
    }
    return this.buscarPorId(idRepartidor);
  }

  async crear({ id_usuario, vehiculo = '', placa = '' }) {
    const columnas = await this.obtenerColumnasRepartidor();
    const tieneVehiculo = columnas.has('vehiculo');
    const tienePlaca = columnas.has('placa');

    if (tieneVehiculo || tienePlaca) {
      const campos = ['id_usuario', 'activo'];
      const valores = [id_usuario, 1];
      if (tieneVehiculo) {
        campos.push('vehiculo');
        valores.push(vehiculo);
      }
      if (tienePlaca) {
        campos.push('placa');
        valores.push(placa);
      }
      await pool.execute(
        `INSERT INTO repartidores (${campos.join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`,
        valores
      );
    } else {
      await pool.execute(
        'INSERT INTO repartidores (id_usuario, activo) VALUES (?, 1)',
        [id_usuario]
      );
    }
    return this.buscarPorId(id_usuario);
  }

  async eliminar(idRepartidor) {
    await pool.execute(
      'UPDATE repartidores SET activo = 0 WHERE id_usuario = ?',
      [idRepartidor]
    );
    return this.buscarPorId(idRepartidor);
  }
}

module.exports = MySQLRepartidorRepository;
