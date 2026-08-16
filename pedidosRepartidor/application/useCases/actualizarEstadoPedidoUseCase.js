import { ESTADOS_PEDIDO } from '../../domain/models/pedido.js';
import {
  PedidoNoEncontradoError,
  EvidenciaFotograficaRequeridaError,
  ObservacionRequeridaError,
} from '../../domain/errors/pedidoErrors.js';

/**
 * CU-017 · Actualizar estado del pedido
 * Objetivo: mover el pedido por el flujo Asignado -> En camino -> Entregado,
 * o registrarlo como "No entregado" cuando ocurre una excepción de entrega
 * (RN-065 a RN-070).
 */
export class ActualizarEstadoPedidoUseCase {
  constructor(pedidoRepartidorRepository, servicioNotificaciones = null) {
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
    // FP-006/FP-014/RN-068: cada cambio de estado notifica al cliente.
    // Se inyecta como puerto opcional para no acoplar el caso de uso a sockets/email.
    this.servicioNotificaciones = servicioNotificaciones;
  }

  async execute({ idPedido, repartidorId, estadoNuevo, fotoEvidenciaUrl, observacion }) {
    const pedido = await this.pedidoRepartidorRepository.obtenerPedidoPorId(idPedido);

    // FE-001/PC-002: no existe o no está asignado a este repartidor.
    if (!pedido || !pedido.perteneceA(repartidorId)) {
      throw new PedidoNoEncontradoError('El pedido ya no está disponible.');
    }

    // RN-065/RN-070: valida la transición contra la máquina de estados del dominio.
    pedido.validarTransicionA(estadoNuevo);

    // RN-066/FA-001: la foto es obligatoria para marcar "Entregado".
    if (estadoNuevo === ESTADOS_PEDIDO.ENTREGADO && !fotoEvidenciaUrl) {
      throw new EvidenciaFotograficaRequeridaError();
    }

    // RN-067: la observación es obligatoria para marcar "No entregado".
    if (estadoNuevo === ESTADOS_PEDIDO.NO_ENTREGADO && !observacion) {
      throw new ObservacionRequeridaError();
    }

    const pedidoActualizado = await this.pedidoRepartidorRepository.actualizarEstadoPedido(
      idPedido,
      estadoNuevo,
      { repartidorId, fotoEvidenciaUrl, observacion }
    );

    // RN-068: notificar al cliente en cada cambio (FE-002: si falla, no revierte el estado).
    if (this.servicioNotificaciones) {
      try {
        await this.servicioNotificaciones.notificarCambioEstado(pedidoActualizado);
      } catch (error) {
        // El estado ya quedó persistido; el fallo de notificación solo se audita.
        console.error('No se pudo notificar el cambio de estado:', error);
      }
    }

    return pedidoActualizado;
  }
}
