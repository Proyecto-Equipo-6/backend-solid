const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const { ROL_REPARTIDOR } = require('../constants');

const ESTADOS_PEDIDO_ACTIVOS = ['PENDIENTE', 'CONFIRMADO', 'ASIGNADO', 'EN_CAMINO'];

/**
 * Caso de Uso: ActualizarUsuarioAdminUseCase
 * Permite al administrador editar los datos de un usuario existente.
 * Si el usuario pasa a rol repartidor, asegura que exista su registro
 * en la tabla repartidores (RN-014-01 / EP-010).
 * No permite cambiar el rol de usuarios que tienen datos activos o historial
 * asociado a su rol actual (carrito, pedidos pendientes, historial de pedidos
 * o pedidos activos asignados en el caso de repartidores).
 */
class ActualizarUsuarioAdminUseCase {
  constructor(
    userRepository,
    repartidorRepository = null,
    carritoRepository = null,
    pedidoRepository = null,
    pedidoRepartidorRepository = null
  ) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
    this.carritoRepository = carritoRepository;
    this.pedidoRepository = pedidoRepository;
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
  }

  async execute({ id, ...datos }) {
    const idUsuario = Number(id);
    const usuario = await this.userRepository.findById(idUsuario);
    if (!usuario) {
      throw new ErrorNoEncontrado('Usuario no encontrado');
    }

    const rolResultante = datos.id_rol !== undefined ? Number(datos.id_rol) : Number(usuario.id_rol);
    if (datos.id_rol !== undefined && rolResultante !== Number(usuario.id_rol)) {
      await this.validarCambioDeRol(idUsuario);
    }

    await this.validarDatos(datos, idUsuario);

    const campos = this.construirCamposUsuario(datos);
    const actualizado = await this.userRepository.actualizar(idUsuario, campos);

    if (rolResultante === ROL_REPARTIDOR) {
      await this.asegurarRepartidor(idUsuario);
    }

    const datosPublicos = { ...actualizado };
    delete datosPublicos.password;
    return { usuario: datosPublicos, mensaje: 'Usuario actualizado correctamente.' };
  }

  async validarCambioDeRol(idUsuario) {
    if (this.carritoRepository && typeof this.carritoRepository.contarItems === 'function') {
      const totalItems = await this.carritoRepository.contarItems(idUsuario);
      if (totalItems > 0) {
        throw new ErrorValidacion('No se puede cambiar el rol: el usuario tiene productos en el carrito');
      }
    }

    if (this.pedidoRepository && typeof this.pedidoRepository.obtenerPedidosPorUsuario === 'function') {
      const pedidos = await this.pedidoRepository.obtenerPedidosPorUsuario(idUsuario);
      if (pedidos.length > 0) {
        const tienePendientes = pedidos.some((p) => ESTADOS_PEDIDO_ACTIVOS.includes(p.estado));
        throw new ErrorValidacion(
          tienePendientes
            ? 'No se puede cambiar el rol: el usuario tiene pedidos pendientes'
            : 'No se puede cambiar el rol: el usuario tiene historial de pedidos'
        );
      }
    }

    if (this.pedidoRepartidorRepository) {
      if (typeof this.pedidoRepartidorRepository.contarPedidosActivos === 'function') {
        const activos = await this.pedidoRepartidorRepository.contarPedidosActivos(idUsuario);
        if (activos > 0) {
          throw new ErrorValidacion('No se puede cambiar el rol: el repartidor tiene pedidos activos asignados');
        }
      }
      if (typeof this.pedidoRepartidorRepository.obtenerHistorialPedidos === 'function') {
        const historial = await this.pedidoRepartidorRepository.obtenerHistorialPedidos(idUsuario);
        if (historial.length > 0) {
          throw new ErrorValidacion('No se puede cambiar el rol: el repartidor tiene historial de pedidos');
        }
      }
    }
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