const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const ErrorValidacion = require('./errors/ErrorValidacion');

/**
 * Caso de Uso: ActualizarRepartidorAdminUseCase
 * Edita los datos del usuario repartidor y su vehículo.
 */
class ActualizarRepartidorAdminUseCase {
  constructor(userRepository, repartidorRepository) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
  }

  async execute({ id, ...datos }) {
    const idUsuario = Number(id);
    const usuario = await this.userRepository.findById(idUsuario);
    if (!usuario) {
      throw new ErrorNoEncontrado('Repartidor no encontrado');
    }

    await this.validarDatos(datos, idUsuario);

    const campos = this.construirCamposUsuario(datos);
    if (Object.keys(campos).length > 0) {
      await this.userRepository.actualizar(idUsuario, campos);
    }

    const datosRepartidor = this.construirDatosRepartidor(datos);
    let repartidor = null;
    if (Object.keys(datosRepartidor).length > 0) {
      repartidor = await this.repartidorRepository.actualizar(idUsuario, datosRepartidor);
    }

    return { mensaje: 'Repartidor actualizado correctamente.', repartidor };
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
    return campos;
  }

  construirDatosRepartidor(datos) {
    const datosRepartidor = {};
    if (datos.vehiculo !== undefined) datosRepartidor.vehiculo = String(datos.vehiculo).trim();
    if (datos.placa !== undefined) datosRepartidor.placa = String(datos.placa).trim();
    if (datos.estado !== undefined) datosRepartidor.estado = datos.estado;
    return datosRepartidor;
  }
}

module.exports = ActualizarRepartidorAdminUseCase;