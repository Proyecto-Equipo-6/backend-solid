/**
 * Constantes del sistema — roles, límites, estados.
 * Evita magic numbers en controllers, middlewares y use cases.
 */

// Roles
const ROL_ADMIN = 1;
const ROL_CLIENTE = 2;
const ROL_REPARTIDOR = 3;

// Pedidos
const MONTO_MINIMO_PEDIDO = 200000;
const LIMITE_PEDIDOS_DIARIOS_REPARTIDOR = 3;

// Paginación
const LIMITE_PRODUCTOS_CATALOGO = 12;
const LIMITE_PEDIDOS_ADMIN = 20;
const LIMITE_USUARIOS_ADMIN = 10;

// Uploads
const MAX_TAMANO_FOTO_BYTES = 5 * 1024 * 1024; // 5MB

// Contraseña
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 20;

module.exports = {
  ROL_ADMIN,
  ROL_CLIENTE,
  ROL_REPARTIDOR,
  MONTO_MINIMO_PEDIDO,
  LIMITE_PEDIDOS_DIARIOS_REPARTIDOR,
  LIMITE_PRODUCTOS_CATALOGO,
  LIMITE_PEDIDOS_ADMIN,
  LIMITE_USUARIOS_ADMIN,
  MAX_TAMANO_FOTO_BYTES,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};
