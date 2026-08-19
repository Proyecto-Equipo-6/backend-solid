const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: ActualizarUsuarioAdminUseCase
 * Permite al administrador editar los datos de un usuario existente.
 */
class ActualizarUsuarioAdminUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ id, ...datos }) {
    const idUsuario = Number(id);
    const usuario = await this.userRepository.findById(idUsuario);
    if (!usuario) {
      throw new ErrorNoEncontrado('Usuario no encontrado');
    }

    await this.validarDatos(datos, idUsuario);

    const campos = this.construirCamposUsuario(datos);
    const actualizado = await this.userRepository.actualizar(idUsuario, campos);
    const datosPublicos = { ...actualizado };
    delete datosPublicos.password;
    return { usuario: datosPublicos, mensaje: 'Usuario actualizado correctamente.' };
  }

  async validarDatos(datos, idUsuario) {
    if (datos.nombre_apellido !== undefined && !String(datos.nombre_apellido).trim()) {
      throw new ErrorValidacion('El nombre es obligatorio');
    }
    if (datos.telefono !== undefined && !/^\d{10}$/.test(String(datos.telefono))) {
      throw new ErrorValidacion('El teléfono debe tener exactamente 10 dígitos');
    }
    if (datos.email !== undefined) {
      if (!String(datos.email).includes('@')) {
        throw new ErrorValidacion('Correo electrónico inválido');
      }
      const existente = await this.userRepository.findByEmail(datos.email);
      if (existente && Number(existente.id_usuario ?? existente.id) !== idUsuario) {
        throw new ErrorValidacion('El correo electrónico ya se encuentra registrado');
      }
    }
  }

  construirCamposUsuario(datos) {
    const campos = {};
    if (datos.nombre_apellido !== undefined) campos.nombre_apellido = String(datos.nombre_apellido).trim();
    if (datos.email !== undefined) campos.email = String(datos.email).trim();
    if (datos.telefono !== undefined) campos.telefono = String(datos.telefono).trim();
    if (datos.direccion !== undefined) campos.direccion = datos.direccion || null;
    if (datos.tipo_documento !== undefined) campos.tipo_documento = datos.tipo_documento;
    if (datos.numero_documento !== undefined) campos.numero_documento = datos.numero_documento || null;
    if (datos.id_rol !== undefined) campos.id_rol = Number(datos.id_rol);
    if (datos.activo !== undefined) campos.activo = datos.activo ? 1 : 0;
    return campos;
  }
}

module.exports = ActualizarUsuarioAdminUseCase;