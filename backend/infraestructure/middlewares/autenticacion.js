const jwt = require('jsonwebtoken');
const ErrorSesionExpirada = require('../../application/errors/ErrorSesionExpirada');

/**
 * Adaptador de Infraestructura: crearAutenticador
 * Factory que crea un middleware de autenticación (JWT).
 * Verifica el token guardado en la cookie httpOnly y adjunta el payload
 * del usuario autenticado a req.usuario (RN-014).
 */
function crearAutenticador(jwtSecret) {
  return function autenticar(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
      return next(new ErrorSesionExpirada());
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.usuario = payload;
      return next();
    } catch (error) {
      console.error('Token de sesión inválido o expirado:', error.message);
      return next(new ErrorSesionExpirada());
    }
  };
}

/**
 * Adaptador de Infraestructura: crearRequerirCliente
 * Factory que crea un middleware que restringe el acceso a usuarios con
 * rol Cliente (RN-039). Se inyecta el id del rol Cliente para no acoplarse
 * a un valor fijo.
 */
function crearRequerirCliente(idRolCliente = 2) {
  return function requerirCliente(req, res, next) {
    if (!req.usuario || Number(req.usuario.id_rol) !== Number(idRolCliente)) {
      return res.status(403).json({ error: 'Debes iniciar sesión como Cliente' });
    }
    return next();
  };
}

module.exports = crearAutenticador;
module.exports.crearRequerirCliente = crearRequerirCliente;
