/**
 * RNF-007: Escalabilidad — Seed de 5000 productos
 *
 * OBJETIVO: Poblar la base de datos con 5000 productos para probar
 *           el rendimiento del catálogo bajo carga.
 *
 * CÓMO FUNCIONA:
 *   1. Se conecta a MySQL
 *   2. Verifica que existan al menos 1 categoría y 1 proveedor
 *   3. Inserta 5000 productos con datos variados
 *   4. Verifica el conteo total
 *
 * REQUISITOS:
 *   - MySQL corriendo en localhost:3306
 *   - Base de datos sistema_comercial creada (con Schema.sql)
 *   - Al menos 1 categoría y 1 proveedor existen (Seed.sql)
 *   - npm install mysql2 (ya debería estar instalado)
 *
 * EJECUCIÓN:
 *   node __tests__/rnf/RNF-007-seed-productos.js
 *
 * LIMPIEZA (para volver al estado original):
 *   DELETE FROM productos WHERE id_producto > 5;
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const TOTAL_PRODUCTOS = 5000;

// Datos para generar productos variados
const categorias = [
  'Cocina', 'Hogar', 'Electrónica', 'Muebles', 'Jardín',
];

const nombres = [
  'Olla Acero Inox', 'Sartén Antiadherente', 'Batidora Eléctrica', 'Licuadora 3Vel',
  'Horno Microondas', 'Refrigerador Side', 'Lavadora Automática', 'Secadora Compacta',
  'Aspiradora Robot', 'Plancha Vapor', 'Purificador Agua', 'Aire Acondicionado',
  'Televisor 55"', 'Soundbar HDMI', 'Parlante BT', 'Audífonos Noise',
  'Cargador Rápido', 'Cable USB-C', 'Mouse Ergonómico', 'Teclado Mecánico',
  'Monitor 24"', 'Webcam HD', 'Hub USB 7Puertos', 'Disco SSD 1TB',
  'Silla Ergonómica', 'Escritorio Exec', 'Estantería Modular', 'Mesa Comedor',
  'Sofá 3Cuerpos', 'Mesa Centred', 'Lámpara Pie', 'Cuadro Decorativo',
  'Cortina Blackout', 'Alfombra Persa', 'Jarrón Cerámica', 'Reloj Pared',
  'Maceta Terraza', 'Manguera 30m', 'Cortacésped Eléc', 'Herramientas Jardín',
  'Set Barbacoa', 'Tumbona Exterior', 'Sombrilla 3m', 'Fuente Jardín',
  'Set Vajilla 12p', 'Cuchillos Chef', 'Tabla Cortar', 'Olla Arrocera',
  'Tostador 2Rejillas', 'Hervidor Eléctrico', 'Exprimidor Cítricos', 'Sandwichera',
  'Freidora Aire', 'Máquina Café', 'Jarra Filtrante', 'Dispensador Agua',
  'Ventilador Torre', 'Calefactor Mini', 'Desumidificador', 'Calentador Paso',
];

const descripciones = [
  'Producto de alta calidad con garantía del fabricante',
  'Diseño moderno y funcional para el hogar',
  'Material resistente y duradero',
  'Tecnología de última generación',
  'Fácil de limpiar y mantener',
  'Ideal para uso diario',
  'Garantía extendida disponible',
  'Envío gratis a todo el país',
];

const garantias = ['6 meses', '12 meses', '24 meses', 'Sin garantía'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generarSKU(index) {
  const cat = randInt(1, 5);
  const catStr = cat === 1 ? 'COC' : cat === 2 ? 'HOG' : cat === 3 ? 'ELE' : cat === 4 ? 'MUE' : 'JAR';
  return `${catStr}-PROD-${String(index).padStart(4, '0')}`;
}

async function main() {
  console.log('='.repeat(50));
  console.log(`RNF-007: Seed de ${TOTAL_PRODUCTOS} productos`);
  console.log('='.repeat(50));

  // Conectar a MySQL
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_comercial',
    connectionLimit: 5,
  });

  console.log('Conectado a MySQL');

  // Verificar categorías y proveedores
  const [cats] = await pool.execute('SELECT COUNT(*) as total FROM categorias WHERE estado = 1');
  const [provs] = await pool.execute('SELECT COUNT(*) as total FROM proveedores WHERE estado = 1');

  console.log(`Categorías activas: ${cats[0].total}`);
  console.log(`Proveedores activos: ${provs[0].total}`);

  if (cats[0].total === 0 || provs[0].total === 0) {
    console.log('❌ Error: Necesitas al menos 1 categoría y 1 proveedor activo');
    console.log('   Ejecuta DB/Seed.sql primero');
    await pool.end();
    process.exit(1);
  }

  // Obtener IDs válidos
  const [catRows] = await pool.execute('SELECT id_categoria FROM categorias WHERE estado = 1');
  const [provRows] = await pool.execute('SELECT id_proveedor FROM proveedores WHERE estado = 1');
  const catIds = catRows.map(r => r.id_categoria);
  const provIds = provRows.map(r => r.id_proveedor);

  // Contar productos actuales
  const [antes] = await pool.execute('SELECT COUNT(*) as total FROM productos');
  console.log(`\nProductos actuales: ${antes[0].total}`);

  // Insertar en lotes de 500
  const LOTE = 500;
  const totalLotes = Math.ceil(TOTAL_PRODUCTOS / LOTE);

  console.log(`Insertando ${TOTAL_PRODUCTOS} productos en ${totalLotes} lotes de ${LOTE}...`);

  const startTime = Date.now();

  for (let lote = 0; lote < totalLotes; lote++) {
    const inicio = lote * LOTE;
    const fin = Math.min(inicio + LOTE, TOTAL_PRODUCTOS);
    const valores = [];

    for (let i = inicio; i < fin; i++) {
      const idx = i % nombres.length;
      const nombre = `${nombres[idx]} #${i + 1}`;
      const sku = generarSKU(i + 6); // +6 para no chocar con los 5 existentes
      const catId = randChoice(catIds);
      const provId = randChoice(provIds);
      const precio = randInt(50000, 800000) + 0.00;
      const stock = randInt(0, 200);
      const garantia = randChoice(garantias);
      const desc = randChoice(descripciones);

      valores.push([sku, catId, provId, nombre, desc, precio, stock, garantia, null]);
    }

    const sql = `INSERT INTO productos (sku, id_categoria, id_proveedor, nombre, descripcion, precio, stock, garantia, imagen_url) VALUES ?`;
    await pool.query(sql, [valores]);

    const progreso = Math.round(((lote + 1) / totalLotes) * 100);
    process.stdout.write(`\r  Lote ${lote + 1}/${totalLotes} (${progreso}%)`);
  }

  const tiempoMs = Date.now() - startTime;

  // Verificar
  const [despues] = await pool.execute('SELECT COUNT(*) as total FROM productos');
  console.log(`\n\nProductos después del seed: ${despues[0].total}`);
  console.log(`Tiempo de inserción: ${tiempoMs}ms (${(tiempoMs / 1000).toFixed(1)}s)`);
  console.log(`\n✅ Seed completado. Ahora ejecuta RNF-007-load-test.js`);

  await pool.end();
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
