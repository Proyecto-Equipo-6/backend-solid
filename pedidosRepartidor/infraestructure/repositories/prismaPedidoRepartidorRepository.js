import prisma from '../../../config/prisma.js';
import { PedidoRepartidorRepository } from '../../domain/ports/pedidoRepartidorRepository.js';
import { Pedido, ESTADOS_PEDIDO } from '../../domain/models/pedido.js';

// Ajusta este import a donde quede el helper de subida (ver uploadMiddleware.js del proyecto).
import { uploadToCloudinary } from '../../../middleware/uploadMiddleware.js';

const ESTADOS_ACTIVOS_DASHBOARD = [ESTADOS_PEDIDO.ASIGNADO, ESTADOS_PEDIDO.EN_CAMINO];
const ESTADOS_HISTORIAL = [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.NO_ENTREGADO, ESTADOS_PEDIDO.CANCELADO];

/**
 * Traduce una fila de `pedidos` (Prisma, snake_case) al modelo de dominio Pedido (camelCase).
 * `descripcionLogistica` es un campo derivado: se arma a partir de la descripción de los
 * productos del pedido, sin exponer nunca el detalle de esos productos (RN-062).
 */
function aPedidoDeDominio(filaPedido) {
  const notasLogistica = (filaPedido.detalle_pedido || [])
    .map((detalle) => detalle.producto?.descripcion)
    .filter(Boolean);

  return new Pedido({
    idPedido: filaPedido.id_pedido,
    repartidorId: filaPedido.repartidor_id,
    estado: filaPedido.estado,
    cliente: {
      nombre: filaPedido.usuario?.nombre,
      telefono: filaPedido.usuario?.telefono,
    },
    // NOTA: el schema actual no tiene un campo explícito de método de pago.
    // Se infiere a partir del comprobante de pago hasta que se agregue la columna real.
    metodoPago: filaPedido.comprobante_pago_url ? 'Transferencia' : 'Efectivo contra entrega',
    direccionEntrega: filaPedido.direccion_entrega || filaPedido.usuario?.direccion || '',
    total: filaPedido.total ? Number(filaPedido.total) : 0,
    caracteristicasLogistica: notasLogistica.length > 0 ? notasLogistica.join('; ') : null,
    fechaAsignacion: filaPedido.fecha_asignacion,
    fechaEntregaReal: filaPedido.fecha_entrega_real,
  });
}

const INCLUDE_BASICO = {
  usuario: { select: { nombre: true, direccion: true, telefono: true } },
  detalle_pedido: { include: { producto: { select: { descripcion: true } } } },
};

export class PrismaPedidoRepartidorRepository extends PedidoRepartidorRepository {
  async obtenerPedidosAsignadosDelDia(repartidorId, fecha = new Date()) {
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    const pedidos = await prisma.pedidos.findMany({
      where: {
        repartidor_id: repartidorId,
        estado: { in: ESTADOS_ACTIVOS_DASHBOARD },
        fecha_asignacion: { gte: inicioDelDia, lte: finDelDia },
      },
      include: INCLUDE_BASICO,
      orderBy: { fecha_asignacion: 'asc' }, // RN-060
    });

    return pedidos.map(aPedidoDeDominio);
  }

  async obtenerPedidoPorId(idPedido) {
    const pedido = await prisma.pedidos.findUnique({
      where: { id_pedido: Number(idPedido) },
      include: INCLUDE_BASICO,
    });

    return pedido ? aPedidoDeDominio(pedido) : null;
  }

  async actualizarEstadoPedido(idPedido, estadoNuevo, { repartidorId, fotoEvidenciaUrl, observacion }) {
    const pedidoPrevio = await prisma.pedidos.findUnique({ where: { id_pedido: Number(idPedido) } });

    const datosActualizacion = { estado: estadoNuevo };

    if (estadoNuevo === ESTADOS_PEDIDO.ENTREGADO) {
      datosActualizacion.fecha_entrega_real = new Date();
      // RN-066: la URL de la foto de evidencia se reutiliza el mismo campo de comprobante.
      datosActualizacion.comprobante_pago_url = fotoEvidenciaUrl;
    }

    if (estadoNuevo === ESTADOS_PEDIDO.NO_ENTREGADO) {
      datosActualizacion.notas_entrega = observacion;
    }

    const actualizado = await prisma.pedidos.update({
      where: { id_pedido: Number(idPedido) },
      data: datosActualizacion,
      include: INCLUDE_BASICO,
    });

    // RN-068: cada cambio de estado deja un registro de seguimiento auditable.
    await prisma.seguimiento_pedido.create({
      data: {
        pedido_id: Number(idPedido),
        estado_anterior: pedidoPrevio.estado,
        estado_nuevo: estadoNuevo,
        cambiado_por: repartidorId,
        notas: observacion || `Estado actualizado a ${estadoNuevo} por el repartidor`,
      },
    });

    return aPedidoDeDominio(actualizado);
  }

  async obtenerHistorialPedidos(repartidorId, { filtroEstado } = {}) {
    const pedidos = await prisma.pedidos.findMany({
      where: {
        repartidor_id: repartidorId,
        estado: filtroEstado ? filtroEstado : { in: ESTADOS_HISTORIAL },
      },
      include: INCLUDE_BASICO,
      orderBy: { fecha_entrega_real: 'desc' },
    });

    return pedidos.map(aPedidoDeDominio);
  }

  async contarPedidosDelPeriodo(repartidorId) {
    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [totalSemana, totalMes] = await Promise.all([
      prisma.pedidos.count({
        where: {
          repartidor_id: repartidorId,
          estado: { in: ESTADOS_HISTORIAL },
          fecha_entrega_real: { gte: inicioSemana },
        },
      }),
      prisma.pedidos.count({
        where: {
          repartidor_id: repartidorId,
          estado: { in: ESTADOS_HISTORIAL },
          fecha_entrega_real: { gte: inicioMes },
        },
      }),
    ]);

    return { totalSemana, totalMes };
  }
}

// Se re-exporta para que el controlador pueda subir la foto de evidencia sin
// saltarse la capa de infraestructura (no es parte del puerto de dominio).
export { uploadToCloudinary };
