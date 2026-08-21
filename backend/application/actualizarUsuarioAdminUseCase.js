const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const { ROL_REPARTIDOR } = require('../constants');

/**
 * Caso de Uso: ActualizarUsuarioAdminUseCase
 * Permite al administrador editar los datos de un usuario existente.
 * Si el usuario pasa a rol repartidor, asegura que exista su registro
 * en la tabla repartidores (RN-014-01 / EP-010).
 */
class ActualizarUsuarioAdminUseCase {
  constructor(userRepository, repartidorRepository) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
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

    const rolResultante = datos.id_rol !== undefined ? Number(datos.id_rol) : Number(usuario.id_rol);
    if (rolResultante === ROL_REPARTIDOR) {
      await this.asegurarRepartidor(idUsuario);
    }

    const datosPublicos = { ...actualizado };
    delete datosPublicos.password;
    return { usuario: datosPublicos, mensaje: 'Usuario actualizado correctamente.' };
  }

  async asegurarRepartidor(idUsuario) {
    const existente = await this.repartidorRepository.buscarPorId(idUsuario);
    if (!existente) {
      await this.repartidorRepository.crear({ id_usuario: idUsuario });
    }
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