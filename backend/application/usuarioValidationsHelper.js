/**
 * Helpers de validación compartidos para la gestión de usuarios.
 * Se extraen aquí las validaciones comunes entre creación y edición
 * de usuarios (clientes, repartidores, etc.) para reducir duplicación
 * y mejorar mantenibilidad (SonarQube).
 */

const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorConflicto = require('./errors/ErrorConflicto');
const bcrypt = require('bcrypt');

function validarNombreObligatorio(nombre) {
  if (!nombre || !String(nombre).trim()) {
    throw new ErrorValidacion('El nombre es obligatorio');
  }
}

function validarEmailFormato(email) {
  if (!email || !String(email).includes('@')) {
    throw new ErrorValidacion('Correo electrónico inválido');
  }
}

function validarPasswordLongitud(password, mensaje) {
  if (
    !password ||
    String(password).length < 8 ||
    String(password).length > 20 ||
    !/[A-Z]/.test(String(password)) ||
    !/[a-z]/.test(String(password)) ||
    !/\d/.test(String(password))
  ) {
    throw new ErrorValidacion(mensaje);
  }
}

function validarTelefono(telefono) {
  if (!telefono || !/^\d{10}$/.test(String(telefono))) {
    throw new ErrorValidacion('El teléfono debe tener exactamente 10 dígitos');
  }
}

async function validarEmailUnico(userRepository, email) {
  const existente = await userRepository.findByEmail(email);
  if (existente) {
    throw new ErrorConflicto('El correo electrónico ya se encuentra registrado');
  }
}

async function hashPassword(password) {
  const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  return bcrypt.hash(String(password), saltRounds);
}

module.exports = {
  validarNombreObligatorio,
  validarEmailFormato,
  validarPasswordLongitud,
  validarTelefono,
  validarEmailUnico,
  hashPassword,
};
