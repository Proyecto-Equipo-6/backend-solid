const AnaliticaRepository = require('../../../domain/ports/AnaliticaRepository');

/**
 * Adaptador de Infraestructura: InMemoryAnaliticaRepository
 * Implementa la interfaz (puerto) AnaliticaRepository usando datos fijos.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryAnaliticaRepository extends AnaliticaRepository {
  async obtenerKpis() {
    return {
      usuarios: 14,
      pedidos: 8,
      ventas: 45000000,
      productos: 26,
      series: {
        usuarios: [
          { mes: '2025-01', valor: 2 },
          { mes: '2025-02', valor: 3 },
          { mes: '2025-03', valor: 2 },
          { mes: '2025-04', valor: 4 },
          { mes: '2025-05', valor: 1 },
          { mes: '2025-06', valor: 2 },
        ],
        pedidos: [
          { mes: '2025-01', valor: 1 },
          { mes: '2025-02', valor: 1 },
          { mes: '2025-03', valor: 2 },
          { mes: '2025-04', valor: 2 },
          { mes: '2025-05', valor: 1 },
          { mes: '2025-06', valor: 1 },
        ],
        ventas: [
          { mes: '2025-01', valor: 5000000 },
          { mes: '2025-02', valor: 6000000 },
          { mes: '2025-03', valor: 8000000 },
          { mes: '2025-04', valor: 7000000 },
          { mes: '2025-05', valor: 9000000 },
          { mes: '2025-06', valor: 10000000 },
        ],
        productos: [
          { mes: '2025-01', valor: 4 },
          { mes: '2025-02', valor: 5 },
          { mes: '2025-03', valor: 4 },
          { mes: '2025-04', valor: 6 },
          { mes: '2025-05', valor: 3 },
          { mes: '2025-06', valor: 4 },
        ],
      },
    };
  }

  async obtenerVentasPorMes() {
    return [
      { mes: '2025-06', ventas: 10000000, pedidos: 1 },
      { mes: '2025-05', ventas: 9000000, pedidos: 1 },
      { mes: '2025-04', ventas: 7000000, pedidos: 2 },
      { mes: '2025-03', ventas: 8000000, pedidos: 2 },
      { mes: '2025-02', ventas: 6000000, pedidos: 1 },
      { mes: '2025-01', ventas: 5000000, pedidos: 1 },
      { mes: '2024-12', ventas: 7000000, pedidos: 2 },
      { mes: '2024-11', ventas: 9000000, pedidos: 2 },
      { mes: '2024-10', ventas: 11000000, pedidos: 3 },
      { mes: '2024-09', ventas: 6000000, pedidos: 2 },
      { mes: '2024-08', ventas: 8000000, pedidos: 2 },
      { mes: '2024-07', ventas: 5000000, pedidos: 1 },
    ];
  }

  async obtenerPedidosPorEstado() {
    return [
      { estado: 'ENTREGADO', cantidad: 12, total: 60000000 },
      { estado: 'EN_RUTA', cantidad: 4, total: 18000000 },
      { estado: 'PENDIENTE', cantidad: 3, total: 12000000 },
      { estado: 'CANCELADO', cantidad: 2, total: 8000000 },
    ];
  }

  async obtenerProductosMasVendidos() {
    return [
      { id_producto: 1, nombre: 'Laptop HP Pavilion', sku: 'LAP-HP-001', categoria: 'Computación', unidades: 12, ventas: 18000000 },
      { id_producto: 2, nombre: 'Mouse inalámbrico', sku: 'ACC-MOU-001', categoria: 'Accesorios', unidades: 18, ventas: 3600000 },
      { id_producto: 3, nombre: 'Teclado mecánico', sku: 'ACC-TEC-001', categoria: 'Accesorios', unidades: 10, ventas: 5500000 },
      { id_producto: 4, nombre: 'Monitor 24 pulgadas', sku: 'MON-24-001', categoria: 'Monitores', unidades: 6, ventas: 7200000 },
      { id_producto: 5, nombre: 'Audífonos Bluetooth', sku: 'AUD-BT-001', categoria: 'Audio', unidades: 14, ventas: 4200000 },
    ];
  }

  async obtenerTopClientes() {
    return [
      { id_usuario: 2, nombre_apellido: 'Ana Gómez', email: 'ana.gomez@correo.com', pedidos: 3, total_gastado: 18000000 },
      { id_usuario: 3, nombre_apellido: 'Luis Pérez', email: 'luis.perez@correo.com', pedidos: 2, total_gastado: 12000000 },
      { id_usuario: 4, nombre_apellido: 'María Rojas', email: 'maria.rojas@correo.com', pedidos: 2, total_gastado: 9000000 },
    ];
  }
}

module.exports = InMemoryAnaliticaRepository;