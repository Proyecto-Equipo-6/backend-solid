/**
 * Helpers compartidos de Pedido para tests (backend/__tests__/helpers/).
 * Evita duplicar el literal `new Pedido({...})` en cada archivo de test
 * (causa del fallo de "Duplicated Lines on New Code" en SonarCloud).
 *
 * Uso:
 *   const { crearPedido } = require('../../helpers/pedidos');
 *   crearPedido({ estado: 'EN_CAMINO' });
 *   crearPedido({ id_pedido: 2, id_usuario: 101, total: 30000 });
 */
const Pedido = require('../../../domain/models/Pedido.js');

/**
 * Crea un Pedido con valores por defecto, sobrescribibles con `overrides`.
 * @param {Object} overrides - Campos a reemplazar sobre los defaults.
 * @returns {Pedido}
 */
const crearPedido = (overrides = {}) => new Pedido({
  id_pedido: 1,
  id_usuario: 10,
  id_repartidor: 10,
  id_metodo_pago: 1,
  direccion_entrega: 'Calle 123',
  total: 50000,
  estado: 'ASIGNADO',
  comprobante_url: null,
  observaciones: null,
  motivo_cancelacion: null,
  fecha_pedido: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
  clienteNombre: 'María',
  clienteTelefono: '3001234567',
  caracteristicasLogistica: 'Frágil',
  ...overrides,
});

module.exports = { crearPedido };