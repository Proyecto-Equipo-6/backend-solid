const InMemoryRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryRepartidorRepository.js');
const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const ConsultarRepartidoresUseCase = require('../../application/consultarRepartidoresUseCase.js');
const { crearPedido } = require('../helpers/pedidos');

describe('Módulo Consultar Repartidores (CU-021)', () => {
  test('Visualizar solo repartidores activos con métricas', async () => {
  const repoRepartidores = new InMemoryRepartidorRepository([
    { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' },
    { id_usuario: 20, nombre: 'María', apellidos: 'Gómez', telefono: '3012345678', email: 'maria@example.com', estado: 'INACTIVO' }
  ]);

  const hoy = new Date();
  const pedido1 = crearPedido({
    id_pedido: 1,
    id_repartidor: 10,
    estado: 'ENTREGADO',
    fecha_pedido: hoy.toISOString(),
  });

  const repoPedidos = new InMemoryPedidoRepartidorRepository([pedido1]);
  const useCase = new ConsultarRepartidoresUseCase(repoRepartidores, repoPedidos);
  const lista = await useCase.ejecutar();

  expect(lista).toHaveLength(1);
  expect(lista[0].id_repartidor).toBe(10);
  expect(lista[0].pedidos_hoy).toBe(1);
  expect(lista[0].pedidos_semana).toBe(1);
  expect(lista[0].pedidos_mes).toBe(1);
});

test('FA-002: El filtro "Todos" muestra activos e inactivos', async () => {
  const repoRepartidores = new InMemoryRepartidorRepository([
    { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' },
    { id_usuario: 20, nombre: 'María', apellidos: 'Gómez', telefono: '3012345678', email: 'maria@example.com', estado: 'INACTIVO' }
  ]);
  const repoPedidos = new InMemoryPedidoRepartidorRepository();
  const useCase = new ConsultarRepartidoresUseCase(repoRepartidores, repoPedidos);

  const lista = await useCase.ejecutar({ estado: 'Todos' });
  expect(lista).toHaveLength(2);
});

  test('Buscar por ID o nombre', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' },
      { id_usuario: 20, nombre: 'María', apellidos: 'Gómez', telefono: '3012345678', email: 'maria@example.com', estado: 'DISPONIBLE' }
    ]);
    const repoPedidos = new InMemoryPedidoRepartidorRepository();
    const useCase = new ConsultarRepartidoresUseCase(repoRepartidores, repoPedidos);
    
    const resultado = await useCase.ejecutar({ termino: 'María' });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id_repartidor).toBe(20);
  });

  test('Búsqueda sin coincidencias devuelve lista vacía', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' }
    ]);
    const repoPedidos = new InMemoryPedidoRepartidorRepository();
    const useCase = new ConsultarRepartidoresUseCase(repoRepartidores, repoPedidos);
    
    const resultado = await useCase.ejecutar({ termino: 'NoExiste' });
    expect(resultado).toHaveLength(0);
  });

  test('Ver historial de pedidos de un repartidor en orden descendente', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' }
    ]);

    const pedidoViejo = crearPedido({
      id_pedido: 1,
      id_repartidor: 10,
      estado: 'ENTREGADO',
      fecha_pedido: new Date('2026-08-14').toISOString(),
    });

    const pedidoReciente = crearPedido({
      id_pedido: 2,
      id_repartidor: 10,
      estado: 'ENTREGADO',
      fecha_pedido: new Date('2026-08-16').toISOString(),
    });

    const repoPedidos = new InMemoryPedidoRepartidorRepository([pedidoViejo, pedidoReciente]);
    const historial = await repoPedidos.obtenerHistorialPedidos(10);

    expect(historial).toHaveLength(2);
    expect(historial[0].id_pedido).toBe(2); // Más reciente primero (orden descendente)
    expect(historial[1].id_pedido).toBe(1);
  });

  test('Respuesta controlada con guion cuando falla el cálculo de métricas', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'DISPONIBLE' }
    ]);

    // Mocks simulando fallas críticas del servidor de base de datos
    const pedidoRepoFalso = {
      contarPedidosDeHoyParaMetrica: () => { throw new Error('Fallo crítico simulado'); },
      contarPedidosDelPeriodo: () => { throw new Error('Fallo crítico simulado'); }
    };

    const useCase = new ConsultarRepartidoresUseCase(repoRepartidores, pedidoRepoFalso);
    const lista = await useCase.ejecutar();

    expect(lista[0].pedidos_hoy).toBe('-');
    expect(lista[0].pedidos_semana).toBe('-');
    expect(lista[0].pedidos_mes).toBe('-');
  });
});
