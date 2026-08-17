const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Caso de Uso: ObtenerResumenAnaliticaUseCase
 * Construye el resumen de reportes del panel administrativo a partir de
 * las consultas agregadas del repositorio (inner joins de la base de datos).
 * Solo depende de la abstracción (AnaliticaRepository).
 */
class ObtenerResumenAnaliticaUseCase {
  constructor(analiticaRepository) {
    this.analiticaRepository = analiticaRepository;
  }

  async execute() {
    const [kpis, ventasPorMes, pedidosPorEstado, productosMasVendidos, topClientes] =
      await Promise.all([
        this.analiticaRepository.obtenerKpis(),
        this.analiticaRepository.obtenerVentasPorMes(12),
        this.analiticaRepository.obtenerPedidosPorEstado(),
        this.analiticaRepository.obtenerProductosMasVendidos(10),
        this.analiticaRepository.obtenerTopClientes(5),
      ]);

    const configuracionKpis = [
      { id: 'usuarios', titulo: 'Usuarios', tipo: 'numero', total: kpis.usuarios, serie: kpis.series.usuarios },
      { id: 'pedidos', titulo: 'Pedidos', tipo: 'numero', total: kpis.pedidos, serie: kpis.series.pedidos },
      { id: 'ventas', titulo: 'Ventas', tipo: 'moneda', total: kpis.ventas, serie: kpis.series.ventas },
      { id: 'productos', titulo: 'Productos', tipo: 'numero', total: kpis.productos, serie: kpis.series.productos },
    ];

    return {
      kpis: configuracionKpis.map((configuracion) => ({
        id: configuracion.id,
        titulo: configuracion.titulo,
        valor: configuracion.total,
        delta: calcularDelta(configuracion.serie),
        subtitulo: 'Últimos 6 meses',
        tipo: configuracion.tipo,
        serie: configuracion.serie.map((punto) => punto.valor),
      })),
      ventasPorMes: ventasPorMes.slice().reverse().map((punto) => ({
        mes: punto.mes,
        rotulo: rotuloMes(punto.mes),
        ventas: punto.ventas,
        pedidos: punto.pedidos,
      })),
      pedidosPorEstado,
      productosMasVendidos,
      topClientes,
    };
  }
}

function calcularDelta(serie) {
  if (!Array.isArray(serie) || serie.length < 2) return 0;
  const anterior = serie[serie.length - 2].valor;
  const actual = serie[serie.length - 1].valor;
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - anterior) / anterior) * 100);
}

function rotuloMes(mes) {
  const indice = Number.parseInt(String(mes).slice(5, 7), 10) - 1;
  return MESES_CORTO[indice] || mes;
}

module.exports = ObtenerResumenAnaliticaUseCase;