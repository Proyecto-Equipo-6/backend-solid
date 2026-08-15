import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import VerDashboardPedidosUseCase from '../application/verDashboardPedidosUseCase.js';
import Pedido from '../domain/models/Pedido.js';

test('Dashboard devuelve pedidos ASIGNADO del día ordenados de más antiguo a más reciente, usando idUsuario', async () => {
  // Fechas del mismo día, con horas explícitas
  const hoy = new Date();
  const horaTemprana = new Date(hoy);
  horaTemprana.setHours(8, 0, 0, 0); // 8:00 AM

  const horaTarde = new Date(hoy);
  horaTarde.setHours(10, 0, 0, 0); // 10:00 AM

  const pedidos = [
    new Pedido({
      idPedido: 2,
      idUsuario: 10, // repartidorId simulado
      idMetodoPago: 1,
      direccion: 'Calle 45',
      estado: 'ASIGNADO',
      clienteNombre: 'María',
      clienteTelefono: '3001234567',
      caracteristicasLogistica: 'Frágil',
      fechaAsignacion: horaTarde.toISOString(),
      fechaActualizacion: horaTarde.toISOString()
    }),
    new Pedido({
      idPedido: 1,
      idUsuario: 10,
      idMetodoPago: 2,
      direccion: 'Carrera 12',
      estado: 'ASIGNADO',
      clienteNombre: 'Carlos',
      clienteTelefono: '3109876543',
      caracteristicasLogistica: 'Refrigerado',
      fechaAsignacion: horaTemprana.toISOString(),
      fechaActualizacion: horaTemprana.toISOString()
    })
  ];

  const repo = new InMemoryPedidoRepartidorRepository(pedidos);
  const useCase = new VerDashboardPedidosUseCase(repo);
  const dashboard = await useCase.ejecutar(10);

  expect(dashboard.conteoDelDia).toBe(2);
  expect(dashboard.pedidoActivo.idPedido).toBe(1); // el más antiguo
  expect(dashboard.pedidosEnCola).toHaveLength(1);
  expect(dashboard.pedidosEnCola[0].idPedido).toBe(2);
});