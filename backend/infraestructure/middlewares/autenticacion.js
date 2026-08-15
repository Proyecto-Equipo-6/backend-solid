const jwt = require('jsonwebtoken');

/**
 * Middleware: autenticar
 * Verifica el token JWT de la cookie 'token' y adjunta el usuario al request.
 */
function autenticar(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No has iniciado sesión' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id_usuario: payload.id_usuario,
      id_rol: payload.id_rol,
      email: payload.email,
      nombre_apellido: payload.nombre_apellido,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

/**
 * Middleware: requerirCliente
 * Restringe el acceso a usuarios con rol Cliente (RN-039).
 */
function requerirCliente(req, res, next) {
  if (!req.usuario || req.usuario.id_rol !== 2) {
    return res.status(403).json({ error: 'Debes iniciar sesión como Cliente' });
  }
  return next();
}

module.exports = { autenticar, requerirCliente };