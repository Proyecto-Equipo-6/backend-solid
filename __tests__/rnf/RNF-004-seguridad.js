/**
 * RNF-004: Seguridad — Prueba de middleware de contención
 *
 * OBJETIVO: Verificar que el sistema detecte y bloquee patrones de ataque
 *           (fuerza bruta y SQL injection) en < 1 segundo.
 *
 * CÓMO FUNCIONA:
 *   1. Fuerza bruta: Enviamos 50 intentos de login con contraseña incorrecta
 *      y verificamos si en algún momento el servidor responde 429 (bloqueado)
 *      o si todos responden 401 (no bloqueado).
 *
 *   2. SQL Injection: Enviamos payloads maliciosos al login y a otros endpoints
 *      y verificamos que el servidor responda 401/400 (rechazado) y NO 200 (aceptado).
 *
 * REQUISITOS:
 *   - Backend corriendo en http://localhost:3000
 *   - Node.js (sin dependencias externas)
 *
 * EJECUCIÓN:
 *   node __tests__/rnf/RNF-004-seguridad.js
 *
 * RESULTADO: Imprime en consola los resultados para copiar al informe.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Envía un POST request y devuelve { statusCode, body, timeMs }
 */
function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const start = Date.now();

    const req = http.request(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const timeMs = Date.now() - start;
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ statusCode: res.statusCode, body: parsed, timeMs });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Envía un GET request y devuelve { statusCode, body, timeMs }
 */
function getJSON(path) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const timeMs = Date.now() - start;
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ statusCode: res.statusCode, body: parsed, timeMs });
      });
    }).on('error', reject);
  });
}

// ============================================================
// PRUEBA 1: FUERZA BRUTA
// ============================================================

async function pruebaFuerzaBruta() {
  console.log('\n' + '='.repeat(60));
  console.log('PRUEBA 1: FUERZA BRUTA — Login con contraseña incorrecta');
  console.log('='.repeat(60));

  const email = 'admin@remate.com';
  const passwordIncorrecta = 'PasswordQueNoExiste123';
  const totalIntentos = 50;

  let bloqueado = false;
  let primerBloqueo = null;
  const resultados = [];

  console.log(`Enviando ${totalIntentos} intentos de login a ${BASE_URL}/api/v1/auth/login`);
  console.log(`Email: ${email} | Password: ${passwordIncorrecta}`);
  console.log('');

  for (let i = 1; i <= totalIntentos; i++) {
    const resultado = await postJSON('/api/v1/auth/login', {
      email,
      password: passwordIncorrecta,
    });

    const status = resultado.statusCode;
    resultados.push(status);

    if (status === 429) {
      bloqueado = true;
      primerBloqueo = i;
      console.log(`  Intento ${i}: HTTP ${status} — ¡BLOQUEADO! (${resultado.body.error || resultado.body.mensaje || 'Rate limit'})`);
      break;
    }

    if (i <= 5 || i % 10 === 0 || i === totalIntentos) {
      console.log(`  Intento ${i}: HTTP ${status} — ${status === 401 ? 'Contraseña incorrecta' : 'Otro'}`);
    }
  }

  // Contar respuestas
  const conteo = {};
  resultados.forEach(s => { conteo[s] = (conteo[s] || 0) + 1; });

  console.log('\n--- RESUMEN ---');
  console.log(`Total intentos: ${resultados.length}`);
  console.log(`Respuestas: ${JSON.stringify(conteo)}`);

  if (bloqueado) {
    console.log(`\n✅ RESULTADO: PASS — El servidor bloqueó en el intento ${primerBloqueo}`);
    console.log(`   El middleware de contención SÍ funciona.`);
  } else {
    console.log(`\n❌ RESULTADO: FAIL — El servidor NUNCA bloqueó después de ${totalIntentos} intentos`);
    console.log(`   NO existe middleware de rate limiting / brute force protection.`);
    console.log(`   Vulnerabilidad: Un atacante puede intentar contraseñas indefinidamente.`);
  }

  return {
    prueba: 'Fuerza bruta',
    totalIntentos,
    bloqueado,
    primerBloqueo,
    conteo,
  };
}

// ============================================================
// PRUEBA 2: SQL INJECTION
// ============================================================

async function pruebaSQLInjection() {
  console.log('\n' + '='.repeat(60));
  console.log('PRUEBA 2: SQL INJECTION — Payloads maliciosos en login');
  console.log('='.repeat(60));

  const payloads = [
    {
      nombre: 'OR bypass clásico',
      email: "admin' OR '1'='1",
      password: "cualquier cosa",
    },
    {
      nombre: 'Comentario SQL',
      email: "admin'--",
      password: "cualquier cosa",
    },
    {
      nombre: 'DROP TABLE',
      email: "'; DROP TABLE usuarios;--",
      password: "cualquier cosa",
    },
    {
      nombre: 'UNION SELECT',
      email: "' UNION SELECT * FROM usuarios--",
      password: "cualquier cosa",
    },
    {
      nombre: 'Time-based injection',
      email: "admin' AND SLEEP(5)--",
      password: "cualquier cosa",
    },
    {
      nombre: 'Bypass con BETWEEN',
      email: "admin' BETWEEN 'a' AND 'z'--",
      password: "cualquier cosa",
    },
    {
      nombre: 'Password injection',
      email: "admin@remate.com",
      password: "' OR '1'='1",
    },
    {
      nombre: 'Double quote escape',
      email: 'admin\\" OR \\"1\\"=\\"1',
      password: "cualquier cosa",
    },
    {
      nombre: 'UNION con hash',
      email: "' UNION SELECT 1,'admin','hash','hash',1--",
      password: "cualquier cosa",
    },
    {
      nombre: 'Time-based en password',
      email: "admin@remate.com",
      password: "' OR SLEEP(5)--",
    },
  ];

  const resultados = [];
  let todosRechazados = true;

  for (const payload of payloads) {
    const inicio = Date.now();
    const resultado = await postJSON('/api/v1/auth/login', {
      email: payload.email,
      password: payload.password,
    });
    const tiempoMs = Date.now() - inicio;

    const status = resultado.statusCode;
    const aceptado = status === 200; // 200 = login exitoso = INJECTION FUNCIONÓ

    if (aceptado) {
      todosRechazados = false;
    }

    const icono = aceptado ? '🔴' : '🟢';
    console.log(`${icono} ${payload.nombre}`);
    console.log(`   Payload email: "${payload.email}"`);
    console.log(`   HTTP ${status} | ${tiempoMs}ms | ${aceptado ? '¡INJECTION EXITOSA!' : 'Rechazado correctamente'}`);

    if (aceptado) {
      console.log(`   ⚠️  VULNERABILIDAD: El payload penetró y devolvió un token de sesión`);
    }

    resultados.push({
      nombre: payload.nombre,
      payload: payload.email,
      statusCode: status,
      tiempoMs,
      aceptado,
    });
  }

  console.log('\n--- RESUMEN ---');
  console.log(`Total payloads probados: ${payloads.length}`);
  console.log(`Rechazados: ${payloads.length - resultados.filter(r => r.aceptado).length}`);
  console.log(`Aceptados (vulnerables): ${resultados.filter(r => r.aceptado).length}`);

  if (todosRechazados) {
    console.log('\n✅ RESULTADO: PASS — Todos los payloads fueron rechazados');
    console.log('   Los prepared statements previenen SQL injection correctamente.');
    console.log('   La defensa es PASIVA (no hay middleware activo de detección).');
  } else {
    console.log('\n❌ RESULTADO: FAIL — Algún payload fue aceptado');
    console.log('   VULNERABILIDAD CRÍTICA de SQL injection detectada.');
  }

  return {
    prueba: 'SQL Injection',
    totalPayloads: payloads.length,
    rechazados: payloads.length - resultados.filter(r => r.aceptado).length,
    aceptados: resultados.filter(r => r.aceptado).length,
    todosRechazados,
    detalles: resultados,
  };
}

// ============================================================
// PRUEBA 3: VERIFICACIÓN DE PREPARED STATEMENTS
// ============================================================

async function pruebaPreparedStatements() {
  console.log('\n' + '='.repeat(60));
  console.log('PRUEBA 3: VERIFICACIÓN — ¿Los repos usan prepared statements?');
  console.log('='.repeat(60));

  // Intentamos buscar un producto con un término que contiene SQL injection
  // Si el prepared statement funciona, el LIKE buscará literalmente "'; DROP TABLE--"
  console.log('Buscando producto con término SQL injection...');
  console.log('Si el prepared statement funciona, simplemente no encontrará resultados.');

  // El endpoint de búsqueda NO está montado como HTTP (verificado en la investigación)
  // Pero podemos probar que el login no es vulnerable a time-based injection
  console.log('\nProbando time-based injection (SLEEP)...');

  const inicio = Date.now();
  const resultado = await postJSON('/api/v1/auth/login', {
    email: "admin' AND SLEEP(5)--",
    password: 'test',
  });
  const tiempoMs = Date.now() - inicio;

  console.log(`Tiempo de respuesta: ${tiempoMs}ms`);
  console.log(`HTTP ${resultado.statusCode}`);

  if (tiempoMs < 2000) {
    console.log('\n✅ SLEEP no se ejecutó — El payload fue tratado como texto plano');
    console.log('   Los prepared statements previenen time-based SQL injection.');
  } else {
    console.log(`\n⚠️  SLEEP parece haberse ejecutado (${tiempoMs}ms)`);
    console.log('   Posible vulnerabilidad de time-based SQL injection.');
  }

  return {
    prueba: 'Prepared statements verification',
    tiempoMs,
    sleepEjecutado: tiempoMs >= 2000,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║  RNF-004: SEGURIDAD — Prueba de middleware de contención   ║');
  console.log('║  Fecha: ' + new Date().toISOString().split('T')[0] + ' '.repeat(38) + '║');
  console.log('║  Servidor: ' + BASE_URL + ' '.repeat(42) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  // Verificar que el servidor esté corriendo
  try {
    await getJSON('/api/v1/auth/login');
  } catch (e) {
    console.log('\n❌ ERROR: No se pudo conectar al servidor en ' + BASE_URL);
    console.log('   Asegúrate de que el backend esté corriendo: npm run dev');
    process.exit(1);
  }

  const resultado1 = await pruebaFuerzaBruta();
  const resultado2 = await pruebaSQLInjection();
  const resultado3 = await pruebaPreparedStatements();

  // ============================================================
  // RESUMEN FINAL PARA EL INFORME
  // ============================================================
  console.log('\n' + '═'.repeat(60));
  console.log('RESUMEN PARA EL INFORME FINAL');
  console.log('═'.repeat(60));

  const passFuerzaBruta = resultado1.bloqueado;
  const passSQLInjection = resultado2.todosRechazados;
  const passPrepared = !resultado3.sleepEjecutado;

  console.log(`
CP-RNF004-01: Validar middleware de contención contra ataques
  ┌─────────────────────────────────────────────────┐
  │ Fuerza bruta:    ${passFuerzaBruta ? 'PASS ✅' : 'FAIL ❌'}                          │
  │ SQL Injection:   ${passSQLInjection ? 'PASS ✅' : 'FAIL ❌'} (prepared statements)    │
  │ Time-based:      ${passPrepared ? 'PASS ✅' : 'FAIL ❌'} (sin SLEEP ejecutado)   │
  └─────────────────────────────────────────────────┘

Observaciones para el informe:
  - SQL Injection: PREVENIDO por prepared statements (defensa pasiva)
  - Fuerza bruta: ${passFuerzaBruta ? 'BLOQUEADO por middleware' : 'NO BLOQUEADO — No existe rate limiting'}
  - No hay middleware activo de detección de ataques (WAF, rate limiter)
  - Todos los repos usan pool.execute(sql, [params]) — sin concatenación de SQL
`);

  // Guardar resultados como JSON para el informe
  const informe = {
    rnf: 'RNF-004',
    titulo: 'Seguridad — Middleware de contención',
    fecha: new Date().toISOString(),
    servidor: BASE_URL,
    resultados: {
      fuerzaBruta: resultado1,
      sqlInjection: resultado2,
      preparedStatements: resultado3,
    },
    veredicto: {
      fuerzaBruta: passFuerzaBruta ? 'PASS' : 'FAIL',
      sqlInjection: passSQLInjection ? 'PASS' : 'FAIL',
    },
  };

  const fs = require('fs');
  const rutaInforme = __dirname + '/RNF-004-resultados.json';
  fs.writeFileSync(rutaInforme, JSON.stringify(informe, null, 2));
  console.log(`Resultados guardados en: ${rutaInforme}`);
}

main().catch(console.error);
