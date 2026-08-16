/**
 * Port: AnaliticaRepository
 * Define el contrato que cualquier adaptador de persistencia de reportes debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class AnaliticaRepository {
  async obtenerKpis() {
    throw new Error("Método 'obtenerKpis' no implementado");
  }

  async obtenerVentasPorMes(limite) {
    throw new Error("Método 'obtenerVentasPorMes' no implementado");
  }

  async obtenerPedidosPorEstado() {
    throw new Error("Método 'obtenerPedidosPorEstado' no implementado");
  }

  async obtenerProductosMasVendidos(limite) {
    throw new Error("Método 'obtenerProductosMasVendidos' no implementado");
  }

  async obtenerTopClientes(limite) {
    throw new Error("Método 'obtenerTopClientes' no implementado");
  }
}

module.exports = AnaliticaRepository;