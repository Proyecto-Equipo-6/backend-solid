/**
 * Script de seed del backend.
 * Genera el hash bcrypt de las contraseñas de prueba en tiempo de ejecución
 * para evitar commitear hashes al repositorio (SonarQube S8215).
 *
 * Uso: npm run seed   (desde la raíz de backend-solid)
 * Requiere haber ejecutado previamente DB/Schema.sql y DB/Triggers.sql.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const PASSWORD_SEED = process.env.SEED_PASSWORD || 'admin123';
const RUTA_SEED = path.join(__dirname, 'Seed.sql');
const MARCADOR = /SET @PASSWORD_SEED\s*=\s*'[^']*';?/;

async function main() {
  const hash = await bcrypt.hash(PASSWORD_SEED, 10);

  const sql = fs
    .readFileSync(RUTA_SEED, 'utf8')
    .replace(MARCADOR, `SET @PASSWORD_SEED = '${hash}';`);

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_comercial',
    multipleStatements: true,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    await conexion.query(sql);
    console.log(
      `Seed completado correctamente. Usuarios de prueba con contraseña "${PASSWORD_SEED}" (hash generado en runtime, no se commitea).`
    );
  } finally {
    await conexion.end();
  }
}

main().catch((error) => {
  console.error('Error ejecutando el seed:', error.message);
  process.exit(1);
});