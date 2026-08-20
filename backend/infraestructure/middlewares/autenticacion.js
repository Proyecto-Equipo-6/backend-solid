const jwt = require('jsonwebtoken');
const ErrorSesionExpirada = require('../../application/errors/ErrorSesionExpirada');

/**
 * Adaptador de Infraestructura: crearAutenticador
 * Factory que crea un middleware de autenticación (JWT).
 * Verifica el token guardado en la cookie httpOnly y adjunta el payload
 * del usuario autenticado a req.usuario (RN-014).
 * También verifica que el token no esté revocado (RN-024 / RF-002.3).
 */
function crearAutenticador(jwtSecret, tokenBlacklistRepository = null) {
  return async function autenticar(req, res, next) {
    let token = req.cookies?.token;

    if (!token && req.headers?.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return next(new ErrorSesionExpirada());
    }

    try {
      const payload = jwt.verify(token, jwtSecret);

      if (tokenBlacklistRepository) {
        const revocado = await tokenBlacklistRepository.estaRevocado(token);
        if (revocado) {
          return next(new ErrorSesionExpirada());
        }
      }

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

/**
 * Adaptador de Infraestructura: crearRequerirRepartidor
 * Factory que crea un middleware que restringe el acceso a usuarios con
 * rol Repartidor (RN-058). Se inyecta el id del rol Repartidor para no
 * acoplarse a un valor fijo (id_rol = 3 en Seed.sql).
 */
function crearRequerirRepartidor(idRolRepartidor = 3) {
  return function requerirRepartidor(req, res, next) {
    if (!req.usuario || Number(req.usuario.id_rol) !== Number(idRolRepartidor)) {
      return res.status(403).json({ error: 'Debes iniciar sesión como Repartidor' });
    }
    return next();
  };
}

/**
 * Adaptador de Infraestructura: crearRequerirAdmin
 * Factory que crea un middleware que restringe el acceso a usuarios con
 * rol Administrador (CU-025). Se inyecta el id del rol Administrador para
 * no acoplarse a un valor fijo (id_rol = 1 en Seed.sql).
 */
function crearRequerirAdmin(idRolAdmin = 1) {
  return function requerirAdmin(req, res, next) {
    if (!req.usuario || Number(req.usuario.id_rol) !== Number(idRolAdmin)) {
      return res.status(403).json({ error: 'Debes iniciar sesión como Administrador' });
    }
    return next();
  };
}

module.exports = crearAutenticador;
module.exports.crearRequerirCliente = crearRequerirCliente;
module.exports.crearRequerirRepartidor = crearRequerirRepartidor;
module.exports.crearRequerirAdmin = crearRequerirAdmin;
