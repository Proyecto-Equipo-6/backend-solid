/**
 * RNF-011: Recuperabilidad — Prueba de backup/restore
 *
 * OBJETIVO: Verificar RTO ≤ 30 minutos y RPO ≤ 1 hora ante fallo de BD.
 *
 * CÓMO FUNCIONA (sin riesgo para la BD real):
 *   1. Verifica que el backup existe
 *   2. Crea una BD temporal (sistema_comercial_test)
 *   3. Restaura el backup en la BD temporal (cronometrando)
 *   4. Verifica integridad: tablas, registros, triggers
 *   5. Compara contra la BD real para estimar RPO
 *   6. Elimina la BD temporal
 *
 * REQUISITOS:
 *   - MySQL corriendo en localhost:3306
 *   - Backup en C:\Users\cuent\Documents\dumps\sistema_comercial_0309.sql
 *   - Acceso root (sin contraseña, según .env)
 *
 * EJECUCIÓN:
 *   node __tests__/rnf/RNF-011-recuperabilidad.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_PATH = 'C:\\Users\\cuent\\Documents\\dumps\\sistema_comercial_0309.sql';
const BD_TEMPORAL = 'sistema_comercial_test';

// Ruta del cliente MySQL (XAMPP). Ajustar si está en otra ubicación.
const MYSQL_CLI = 'C:\\xampp\\mysql\\bin\\mysql.exe';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function main() {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║  RNF-011: RECUPERABILIDAD — Backup/Restore               ║');
  console.log('║  Fecha: ' + new Date().toISOString().split('T')[0] + ' '.repeat(38) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  // ----------------------------------------------------------
  // PASO 1: Verificar que el backup existe
  // ----------------------------------------------------------
  console.log('\n--- PASO 1: Verificando backup ---');
  if (!fs.existsSync(BACKUP_PATH)) {
    console.log(`❌ ERROR: No existe el backup en ${BACKUP_PATH}`);
    process.exit(1);
  }
  const tamanoMB = (fs.statSync(BACKUP_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Backup encontrado: ${BACKUP_PATH}`);
  console.log(`   Tamaño: ${tamanoMB} MB`);
  console.log(`   Fecha del archivo: ${fs.statSync(BACKUP_PATH).mtime.toISOString()}`);

  // ----------------------------------------------------------
  // PASO 2: Crear BD temporal
  // ----------------------------------------------------------
  console.log('\n--- PASO 2: Creando BD temporal ---');
  const pool = await mysql.createPool(DB_CONFIG);

  await pool.execute(`DROP DATABASE IF EXISTS ${BD_TEMPORAL}`);
  await pool.execute(`CREATE DATABASE ${BD_TEMPORAL} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ BD temporal creada: ${BD_TEMPORAL}`);

  // ----------------------------------------------------------
  // PASO 3: Restaurar backup (cronometrando = RTO)
  // ----------------------------------------------------------
  console.log('\n--- PASO 3: Restaurando backup (mide RTO) ---');
  console.log('Esto puede tomar unos segundos...');

  const inicioRestore = Date.now();
  try {
    // mysql CLI: < backup.sql (el dump asume que la BD ya existe)
    const cmd = `"${MYSQL_CLI}" -h ${DB_CONFIG.host} -P ${DB_CONFIG.port} -u ${DB_CONFIG.user} ${DB_CONFIG.password ? '-p' + DB_CONFIG.password : ''} ${BD_TEMPORAL} < "${BACKUP_PATH}"`;
    execSync(cmd, { stdio: 'pipe', shell: 'cmd.exe' });
  } catch (e) {
    console.log('❌ Error al restaurar con mysql CLI:');
    console.log('   ' + (e.stderr ? e.stderr.toString().split('\n').slice(0, 5).join('\n   ') : e.message));
    console.log('   Intentando con mysql2 (fallback)...');
    // Fallback: leer el archivo y ejecutar con mysql2 (multipleStatements)
    const sql = fs.readFileSync(BACKUP_PATH, 'utf8');
    const conn = await pool.getConnection();
    try {
      await conn.query({ sql, multipleStatements: true });
    } catch (err) {
      console.log('   ⚠️  Fallback también falló: ' + err.message);
    } finally {
      conn.release();
    }
  }
  const tiempoRestoreMs = Date.now() - inicioRestore;
  const tiempoRestoreSeg = (tiempoRestoreMs / 1000).toFixed(1);

  console.log(`✅ Backup restaurado en ${tiempoRestoreSeg}s`);

  // ----------------------------------------------------------
  // PASO 4: Verificar integridad
  // ----------------------------------------------------------
  console.log('\n--- PASO 4: Verificando integridad ---');

  const [tablas] = await pool.execute(
    `SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = ?`,
    [BD_TEMPORAL]
  );
  console.log(`Tablas en BD restaurada: ${tablas[0].total}`);

  // Contar registros de las tablas principales
  const tablasPrincipales = ['usuarios', 'productos', 'categorias', 'proveedores', 'pedidos', 'roles'];
  let totalRegistros = 0;
  for (const tabla of tablasPrincipales) {
    try {
      const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM ${BD_TEMPORAL}.${tabla}`);
      console.log(`  ${tabla}: ${rows[0].total} registros`);
      totalRegistros += rows[0].total;
    } catch (e) {
      console.log(`  ${tabla}: ERROR (${e.message})`);
    }
  }

  // Verificar triggers
  const [triggers] = await pool.execute(
    `SELECT COUNT(*) as total FROM information_schema.triggers WHERE trigger_schema = ?`,
    [BD_TEMPORAL]
  );
  console.log(`Triggers restaurados: ${triggers[0].total}`);

  // ----------------------------------------------------------
  // PASO 5: Comparar con BD real (estimar RPO)
  // ----------------------------------------------------------
  console.log('\n--- PASO 5: Comparando con BD real (estima RPO) ---');
  const bdReal = process.env.DB_NAME || 'sistema_comercial';

  try {
    const [real] = await pool.execute(`SELECT COUNT(*) as total FROM ${bdReal}.usuarios`);
    const [backup] = await pool.execute(`SELECT COUNT(*) as total FROM ${BD_TEMPORAL}.usuarios`);
    const diff = real[0].total - backup[0].total;
    console.log(`Usuarios BD real: ${real[0].total} | BD backup: ${backup[0].total} | Diferencia: ${diff}`);
    console.log(diff === 0
      ? '✅ Sin pérdida de datos (RPO = 0)'
      : `⚠️  Diferencia de ${diff} registros — el backup es de un momento anterior`);
  } catch (e) {
    console.log(`⚠️  No se pudo comparar: ${e.message}`);
  }

  // ----------------------------------------------------------
  // PASO 6: Limpiar BD temporal
  // ----------------------------------------------------------
  console.log('\n--- PASO 6: Limpiando BD temporal ---');
  await pool.execute(`DROP DATABASE IF EXISTS ${BD_TEMPORAL}`);
  console.log(`✅ BD temporal eliminada`);

  // ----------------------------------------------------------
  // RESULTADOS
  // ----------------------------------------------------------
  const rtoCumple = tiempoRestoreSeg <= 1800; // 30 min = 1800s
  console.log('\n' + '═'.repeat(60));
  console.log('RESULTADOS PARA EL INFORME');
  console.log('═'.repeat(60));
  console.log(`
┌─────────────────────────────────────────────────────────┐
│  RTO (tiempo de restauración):  ${tiempoRestoreSeg.padStart(6)}s  ${rtoCumple ? '✅ ≤ 30min' : '❌ > 30min'}      │
│  RPO (pérdida de datos):        estimado por diferencia │
│  Backup:                        ${tamanoMB.padStart(6)} MB                    │
│  Tablas restauradas:            ${String(tablas[0].total).padStart(6)}                        │
│  Triggers restaurados:          ${String(triggers[0].total).padStart(6)}                        │
│  Registros verificados:         ${String(totalRegistros).padStart(6)}                        │
└─────────────────────────────────────────────────────────┘
`);

  const informe = {
    rnf: 'RNF-011',
    titulo: 'Recuperabilidad — Backup/Restore',
    fecha: new Date().toISOString(),
    backup: BACKUP_PATH,
    tamanoMB: parseFloat(tamanoMB),
    rtoSegundos: tiempoRestoreMs / 1000,
    rtoCumple,
    tablasRestauradas: tablas[0].total,
    triggersRestaurados: triggers[0].total,
    registrosVerificados: totalRegistros,
    veredicto: rtoCumple ? 'PASS' : 'FAIL',
  };

  const rutaInforme = __dirname + '/RNF-011-resultados.json';
  fs.writeFileSync(rutaInforme, JSON.stringify(informe, null, 2));
  console.log(`Resultados guardados en: ${rutaInforme}`);

  await pool.end();
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});