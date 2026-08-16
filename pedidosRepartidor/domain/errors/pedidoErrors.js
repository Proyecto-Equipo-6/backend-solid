/**
 * Errores de dominio del módulo "Pedidos del repartidor".
 * Se usan en los casos de uso para señalar violaciones a las reglas de negocio
 * (RN-058 a RN-076) sin acoplarse a códigos HTTP: eso lo traduce el controlador.
 */

class DomainError extends Error {
  constructor(message, codigo) {
    super(message);
    this.name = this.constructor.name;
    this.codigo = codigo;
  }
}

// FE-002 / PC-001: no hay sesión activa o el repartidor no existe.
class RepartidorNoAutenticadoError extends DomainError {
  constructor(mensaje = 'El repartidor no está autenticado.') {
    super(mensaje, 'REPARTIDOR_NO_AUTENTICADO');
  }
}

// FE-002 (CU-016) / FE-001 (CU-017): el pedido no existe o no pertenece al repartidor.
class PedidoNoEncontradoError extends DomainError {
  constructor(mensaje = 'El pedido ya no está disponible.') {
    super(mensaje, 'PEDIDO_NO_ENCONTRADO');
  }
}

// RN-065 / RN-070: intento de saltar estados o de modificar un pedido ya cerrado.
class TransicionEstadoInvalidaError extends DomainError {
  constructor(mensaje = 'No se puede cambiar el pedido a ese estado.') {
    super(mensaje, 'TRANSICION_INVALIDA');
  }
}

// RN-066 / FA-001 (CU-017): falta la foto obligatoria para marcar "Entregado".
class EvidenciaFotograficaRequeridaError extends DomainError {
  constructor(mensaje = 'La foto es obligatoria para confirmar la entrega.') {
    super(mensaje, 'EVIDENCIA_REQUERIDA');
  }
}

// RN-067: falta la observación obligatoria para marcar "No entregado".
class ObservacionRequeridaError extends DomainError {
  constructor(mensaje = 'Debes registrar una observación para marcar el pedido como no entregado.') {
    super(mensaje, 'OBSERVACION_REQUERIDA');
  }
}

export {
  DomainError,
  RepartidorNoAutenticadoError,
  PedidoNoEncontradoError,
  TransicionEstadoInvalidaError,
  EvidenciaFotograficaRequeridaError,
  ObservacionRequeridaError,
};
