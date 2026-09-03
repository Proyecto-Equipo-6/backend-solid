/**
 * Middleware de Rate Limiting (anti-fuerza bruta)
 *
 * Limita el número de INTENTOS FALLIDOS de login por IP en una ventana de tiempo.
 * Si se supera el límite, responde con HTTP 429.
 *
 * DIFERENCIA vs express-rate-limit con skipSuccessfulRequests:
 * - express-rate-limit incrementa el contador al pasar el middleware (síncrono)
 *   y lo descuenta en 'finish' (asíncrono). Con ráfagas de logins exitosos
 *   concurrentes (tests live de RNF), el contador sube antes de los descuentos
 *   y bloquea logins legítimos.
 * - Este middleware cuenta SOLO respuestas 401/403 (credenciales incorrectas).
 *   Los logins exitosos (200) NUNCA se cuentan → no afecta tests ni usuarios reales.
 *
 * USO:
 *   const { rateLimiterGeneral, rateLimiterLogin } = require('./rateLimiter');
 *   app.use(rateLimiterGeneral);            // General: 100 req/min
 *   app.use('/api/v1/auth/login', rateLimiterLogin); // Login: 10 fallos/min
 */

const { rateLimit } = require('express-rate-limit');

/**
 * Rate limit general — aplica a TODAS las rutas
 * 100 peticiones por IP en ventana de 1 minuto
 */
const rateLimiterGeneral = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,            // 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
  },
});

/**
 * Registro de intentos fallidos por IP: ip -> { count, resetAt }
 * En memoria (suficiente para un solo proceso; en multi-instancia usar Redis).
 */
const intentosFallidos = new Map();

/**
 * Rate limit para login — cuenta SOLO intentos fallidos (401/403)
 * 10 intentos fallidos por IP en ventana de 1 minuto.
 * Los logins exitosos (200) no se cuentan.
 */
function rateLimiterLogin(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ahora = Date.now();
  const VENTANA_MS = 60 * 1000;
  const MAX_FALLIDOS = 10;

  // Limpiar registro expirado
  const registro = intentosFallidos.get(ip);
  if (registro && ahora > registro.resetAt) {
    intentosFallidos.delete(ip);
  }

  // Bloquear si ya superó el límite
  const actual = intentosFallidos.get(ip);
  if (actual && actual.count >= MAX_FALLIDOS) {
    return res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión. Espera un minuto.',
    });
  }

  // Interceptar la respuesta para contar solo fallos (401/403)
  const jsonOriginal = res.json.bind(res);
  res.json = (cuerpo) => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const reg = intentosFallidos.get(ip) || { count: 0, resetAt: ahora + VENTANA_MS };
      reg.count += 1;
      intentosFallidos.set(ip, reg);
    }
    return jsonOriginal(cuerpo);
  };

  next();
}

module.exports = { rateLimiterGeneral, rateLimiterLogin };