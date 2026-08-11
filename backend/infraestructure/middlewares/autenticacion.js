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

module.exports = crearAutenticador;
