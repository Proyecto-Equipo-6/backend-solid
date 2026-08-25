const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorConflicto = require('./errors/ErrorConflicto');
const { ROL_REPARTIDOR } = require('../constants');
const {
  validarNombreObligatorio,
  validarEmailFormato,
  validarPasswordLongitud,
  validarTelefono,
  validarEmailUnico,
  hashPassword,
} = require('./usuarioValidationsHelper');

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

    validarNombreObligatorio(nombre_apellido);
    validarEmailFormato(email);
    validarPasswordLongitud(password, 'La contraseña debe tener entre 8 y 20 caracteres, una mayúscula, una minúscula y un número');
    validarTelefono(telefono);
    if (id_rol === undefined || !Number(id_rol)) {
      throw new ErrorValidacion('El rol es obligatorio');
    }
    if (tipo_documento && !TIPOS_DOCUMENTO.has(tipo_documento)) {
      throw new ErrorValidacion('Tipo de documento no válido');
    }

    await validarEmailUnico(this.userRepository, email);

    if (numero_documento) {
      const existenteDocumento = await this.userRepository.findByNumeroDocumento(numero_documento);
      if (existenteDocumento) {
        throw new ErrorConflicto('El número de documento ya se encuentra registrado');
      }
    }

    const passwordHash = await hashPassword(password);

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