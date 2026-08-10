import { PedidoNoEncontradoError } from '../../domain/errors/pedidoErrors.js';

/**
 * Adaptador de infraestructura: DetallePedidoController
 * Traduce HTTP <-> VerDetallePedidoUseCase (CU-016).
 */
export class DetallePedidoController {
  constructor(verDetallePedidoUseCase) {
    this.verDetallePedidoUseCase = verDetallePedidoUseCase;
  }

  async obtener(req, res) {
    try {
      const repartidorId = req.usuario.userId;
      const { idPedido } = req.params;
      const detalle = await this.verDetallePedidoUseCase.execute({ idPedido, repartidorId });
      return res.status(200).json(detalle);
    } catch (error) {
      if (error instanceof PedidoNoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error al cargar el detalle del pedido:', error);
      return res.status(500).json({ error: 'No se pudieron cargar los detalles del pedido' });
    }
  }
}
