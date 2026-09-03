/**
 * RNF-007: Limpieza — Eliminar productos del seed
 *
 * Elimina los productos insertados por RNF-007-seed-productos.js
 * Primero elimina las dependencias (pedido_detalles, carrito_detalles, historial_stock)
 * y luego los productos con id > 5 (los originales del Seed.sql se conservan)
 *
 * EJECUCIÓN:
 *   node __tests__/rnf/RNF-007-limpiar.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_comercial',
  });

  const [antes] = await pool.execute('SELECT COUNT(*) as total FROM productos');
  console.log(`Productos antes de limpiar: ${antes[0].total}`);

  // Eliminar dependencias primero (foreign keys)
  console.log('Eliminando pedido_detalles de productos seed...');
  await pool.execute('DELETE FROM pedido_detalles WHERE id_producto > 5');

  console.log('Eliminando carrito_detalles de productos seed...');
  await pool.execute('DELETE FROM carrito_detalles WHERE id_producto > 5');

  console.log('Eliminando historial_stock de productos seed...');
  await pool.execute('DELETE FROM historial_stock WHERE id_producto > 5');

  // Ahora sí eliminar los productos
  console.log('Eliminando productos seed...');
  const [resultado] = await pool.execute('DELETE FROM productos WHERE id_producto > 5');
  console.log(`Productos eliminados: ${resultado.affectedRows}`);

  const [despues] = await pool.execute('SELECT COUNT(*) as total FROM productos');
  console.log(`Productos después de limpiar: ${despues[0].total}`);

  await pool.end();
  console.log('✅ Limpieza completada');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
