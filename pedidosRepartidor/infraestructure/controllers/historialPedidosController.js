/**
 * Adaptador de infraestructura: HistorialPedidosController
 * Traduce HTTP <-> VerHistorialPedidosUseCase (CU-018).
 */
export class HistorialPedidosController {
  constructor(verHistorialPedidosUseCase) {
    this.verHistorialPedidosUseCase = verHistorialPedidosUseCase;
  }

  async obtener(req, res) {
    try {
      const repartidorId = req.usuario.userId;
      // FA-001/FA-002: filtro por estado (Entregado, No entregado, Cancelado) y orden.
      const { estado, orden } = req.query;
      const resultado = await this.verHistorialPedidosUseCase.execute({
        repartidorId,
        filtroEstado: estado || null,
        orden: orden || 'reciente',
      });
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al cargar el historial de pedidos:', error);
      return res.status(500).json({ error: 'No se pudo cargar el historial. Intente nuevamente' });
    }
  }
}
