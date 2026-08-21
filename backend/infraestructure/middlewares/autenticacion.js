const jwt = require('jsonwebtoken');
const ErrorSesionExpirada = require('../../application/errors/ErrorSesionExpirada');

/**
 * Extrae el token JWT de la petición.
 * Prioridad: Cookie (web) -> Authorization: Bearer (mobile/API).
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extraerToken(req) {
  // 1) Cookie httpOnly (web tradicional)
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // 2) Cabecera estándar Authorization: Bearer <token> (mobile, SPAs, APIs)
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Adaptador de Infraestructura: crearAutenticador
 * Factory que crea un middleware de autenticación (JWT).
 * Verifica el token en cookie o cabecera Authorization y adjunta
 * el payload del usuario autenticado a req.usuario (RN-014).
 * @param {string} jwtSecret - Secreto para firmar/verificar JWT (obligatorio).
 */
function crearAutenticador(jwtSecret) {
  if (!jwtSecret || typeof jwtSecret !== 'string') {
    throw new Error('JWT_SECRET es obligatorio y debe ser un string no vacío');
  }

  return function autenticar(req, res, next) {
    const token = extraerToken(req);

    if (!token) {
      return next(new ErrorSesionExpirada());
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.usuario = payload;
      return next();
    } catch (error) {
      // En producción evitar loguear detalles del token; solo auditoría genérica
      console.warn('Token de sesión inválido o expirado');
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