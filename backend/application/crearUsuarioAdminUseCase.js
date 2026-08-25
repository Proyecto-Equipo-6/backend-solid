const ErrorConflicto = require('./errors/ErrorConflicto');
const ErrorValidacion = require('./errors/ErrorValidacion');
const bcrypt = require('bcrypt');
const { ROL_REPARTIDOR } = require('../constants');

const TIPOS_DOCUMENTO = new Set(['CC', 'Pasaporte', 'CE', 'Otro']);

/**
 * Caso de Uso: CrearUsuarioAdminUseCase
 * Permite al administrador crear un usuario con un rol específico.
 * Si el rol es repartidor, crea también su registro en la tabla repartidores.
 */
class CrearUsuarioAdminUseCase {
  constructor(userRepository, repartidorRepository) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
  }

  async execute(datos) {
    const { id_rol, nombre_apellido, tipo_documento, numero_documento, email, password, telefono, direccion } = datos;

    if (!nombre_apellido || !String(nombre_apellido).trim()) {
      throw new ErrorValidacion('El nombre es obligatorio');
    }
    if (!email || !String(email).includes('@')) {
      throw new ErrorValidacion('Correo electrónico inválido');
    }
    if (!password || String(password).length < 8) {
      throw new ErrorValidacion('La contraseña debe tener al menos 8 caracteres');
    }
    if (!telefono || !/^\d{10}$/.test(String(telefono))) {
      throw new ErrorValidacion('El teléfono debe tener exactamente 10 dígitos');
    }
    if (id_rol === undefined || !Number(id_rol)) {
      throw new ErrorValidacion('El rol es obligatorio');
    }
    if (tipo_documento && !TIPOS_DOCUMENTO.has(tipo_documento)) {
      throw new ErrorValidacion('Tipo de documento no válido');
    }

    const existenteEmail = await this.userRepository.findByEmail(email);
    if (existenteEmail) {
      throw new ErrorConflicto('El correo electrónico ya se encuentra registrado');
    }

    if (numero_documento) {
      const existenteDocumento = await this.userRepository.findByNumeroDocumento(numero_documento);
      if (existenteDocumento) {
        throw new ErrorConflicto('El número de documento ya se encuentra registrado');
      }
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(String(password), saltRounds);

    const guardado = await this.userRepository.save({
      id_rol: Number(id_rol),
      nombre_apellido: String(nombre_apellido).trim(),
      tipo_documento: tipo_documento || 'CC',
      numero_documento: numero_documento || null,
      email: String(email).trim(),
      password: passwordHash,
      telefono: String(telefono).trim(),
      direccion: direccion || null,
      activo: 1,
    });

    if (Number(id_rol) === ROL_REPARTIDOR) {
      const idUsuario = guardado.id ?? guardado.id_usuario;
      await this.repartidorRepository.crear({ id_usuario: idUsuario });
    }

    const datosPublicos = { ...guardado };
    delete datosPublicos.password;
    return { usuario: datosPublicos, mensaje: 'Usuario creado correctamente.' };
  }
}

module.exports = CrearUsuarioAdminUseCase;