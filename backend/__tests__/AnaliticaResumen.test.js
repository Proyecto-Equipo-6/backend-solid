const ObtenerResumenAnaliticaUseCase = require('../application/ObtenerResumenAnaliticaUseCase');
const InMemoryAnaliticaRepository = require('../infraestructure/repositories/in-memory/InMemoryAnaliticaRepository');

describe('ObtenerResumenAnaliticaUseCase', () => {
  it('construye los KPIs con deltas a partir de las series', async () => {
    const casoUso = new ObtenerResumenAnaliticaUseCase(new InMemoryAnaliticaRepository());

    const resumen = await casoUso.execute();

    expect(resumen.kpis).toHaveLength(4);
    const usuarios = resumen.kpis.find((kpi) => kpi.id === 'usuarios');
    const ventas = resumen.kpis.find((kpi) => kpi.id === 'ventas');

    expect(usuarios.valor).toBe(14);
    expect(usuarios.tipo).toBe('numero');
    expect(usuarios.serie).toEqual([2, 3, 2, 4, 1, 2]);
    expect(usuarios.delta).toBe(100);

    expect(ventas.valor).toBe(45000000);
    expect(ventas.tipo).toBe('moneda');
    expect(ventas.delta).toBe(11);
  });

  it('ordena las ventas por mes de forma ascendente con rótulo en español', async () => {
    const casoUso = new ObtenerResumenAnaliticaUseCase(new InMemoryAnaliticaRepository());

    const resumen = await casoUso.execute();

    expect(resumen.ventasPorMes).toHaveLength(12);
    expect(resumen.ventasPorMes[0].mes).toBe('2024-07');
    expect(resumen.ventasPorMes[0].rotulo).toBe('Jul');
    expect(resumen.ventasPorMes[11].mes).toBe('2025-06');
    expect(resumen.ventasPorMes[11].rotulo).toBe('Jun');
  });

  it('incluye pedidos por estado, productos más vendidos y top clientes', async () => {
    const casoUso = new ObtenerResumenAnaliticaUseCase(new InMemoryAnaliticaRepository());

    const resumen = await casoUso.execute();

    expect(resumen.pedidosPorEstado[0]).toEqual({ estado: 'ENTREGADO', cantidad: 12, total: 60000000 });
    expect(resumen.productosMasVendidos).toHaveLength(5);
    expect(resumen.productosMasVendidos[0].nombre).toBe('Laptop HP Pavilion');
    expect(resumen.topClientes).toHaveLength(3);
    expect(resumen.topClientes[0].nombre_apellido).toBe('Ana Gómez');
    expect(resumen.topClientes[0].total_gastado).toBe(18000000);
  });

  it('devuelve delta 0 si la serie no tiene al menos dos meses', async () => {
    const repositorio = new InMemoryAnaliticaRepository();
    repositorio.obtenerKpis = async () => ({
      usuarios: 5,
      pedidos: 1,
      ventas: 1000000,
      productos: 3,
      series: {
        usuarios: [{ mes: '2025-06', valor: 5 }],
        pedidos: [{ mes: '2025-06', valor: 1 }],
        ventas: [{ mes: '2025-06', valor: 1000000 }],
        productos: [{ mes: '2025-06', valor: 3 }],
      },
    });
    const casoUso = new ObtenerResumenAnaliticaUseCase(repositorio);

    const resumen = await casoUso.execute();

    expect(resumen.kpis[0].delta).toBe(0);
  });
});