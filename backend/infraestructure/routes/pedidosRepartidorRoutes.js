const { Router } = require('express');
const InMemoryPedidoRepartidorRepository = require('../repositories/in-memory/InMemoryPedidoRepartidorRepository');
const crearDashboardPedidosController = require('../controllers/dashboardPedidosController');
const crearDetallePedidoController = require('../controllers/detallePedidoController');
const crearActualizarEstadoPedidoController = require('../controllers/actualizarEstadoPedidoController');

// Datos de prueba (simulan dos pedidos ASIGNADO para el repartidor con id_usuario = 10)
const pedidosDePrueba = [
  {
    idPedido: 1,
    idUsuario: 10,
    idMetodoPago: 1,
    direccion: 'Calle 123',
    estado: 'ASIGNADO',
    clienteNombre: 'María',
    clienteTelefono: '3001234567',
    caracteristicasLogistica: 'Frágil',
    fechaAsignacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  },
  {
    idPedido: 2,
    idUsuario: 10,
    idMetodoPago: 2,
    direccion: 'Carrera 45',
    estado: 'ASIGNADO',
    clienteNombre: 'Carlos',
    clienteTelefono: '3109876543',
    caracteristicasLogistica: 'Refrigerado',
    fechaAsignacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  }
];

// Instancia única del repositorio in-memory
const pedidoRepo = new InMemoryPedidoRepartidorRepository(pedidosDePrueba);

// Crear controladores inyectando el mismo repositorio
const dashboardController = crearDashboardPedidosController(pedidoRepo);
const detalleController = crearDetallePedidoController(pedidoRepo);
const actualizarEstadoController = crearActualizarEstadoPedidoController(pedidoRepo);

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/pedidos/:pedidoId/detalle', detalleController);
router.patch('/pedidos/:pedidoId/estado', actualizarEstadoController);

module.exports = router;