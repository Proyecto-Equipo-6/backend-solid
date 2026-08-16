/**
 * Adaptador de infraestructura: DashboardPedidosController
 * Traduce HTTP <-> VerDashboardPedidosUseCase (CU-015).
 */
export class DashboardPedidosController {
  constructor(verDashboardPedidosUseCase) {
    this.verDashboardPedidosUseCase = verDashboardPedidosUseCase;
  }

  async obtener(req, res) {
    try {
      const repartidorId = req.usuario.userId;
      const resultado = await this.verDashboardPedidosUseCase.execute({ repartidorId });
      return res.status(200).json(resultado);
    } catch (error) {
      // FE-001: error de conexión con BD.
      console.error('Error al cargar el dashboard de pedidos:', error);
      return res.status(500).json({ error: 'No se pudo cargar el dashboard. Intente nuevamente' });
    }
  }
}
