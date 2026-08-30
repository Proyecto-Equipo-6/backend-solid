import InMemoryRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryRepartidorRepository.js';
import InMemoryPedidoRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import CambiarEstadoOperativoRepartidorUseCase from '../../application/cambiarEstadoOperativoRepartidorUseCase.js';
const { crearPedido } = require('../helpers/pedidos');

describe('Gestión de Estado Operativo de Repartidor', () => {
  test('Cambiar estado de Inactivo a Disponible', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'INACTIVO' }
    ]);
    const repoPedidos = new InMemoryPedidoRepartidorRepository();

    const useCase = new CambiarEstadoOperativoRepartidorUseCase(repoRepartidores, repoPedidos);
    const repartidor = await useCase.ejecutar(10, 'DISPONIBLE');

    expect(repartidor.estado).toBe('DISPONIBLE');
  });

  test('Bloquear cambio a Inactivo si tiene pedidos EN_CAMINO', async () => {
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, nombre: 'Juan', apellidos: 'Pérez', telefono: '3001234567', email: 'juan@example.com', estado: 'OCUPADO' }
    ]);

    // Pedido en estado EN_CAMINO asignado al repartidor 10
    const pedido = crearPedido({
      id_pedido: 1,
      id_repartidor: 10,
      estado: 'EN_CAMINO',
    });

    const repoPedidos = new InMemoryPedidoRepartidorRepository([pedido]);
    const useCase = new CambiarEstadoOperativoRepartidorUseCase(repoRepartidores, repoPedidos);

    await expect(
      useCase.ejecutar(10, 'INACTIVO')
    ).rejects.toThrow('No se puede inactivar un repartidor con entregas pendientes sin finalizar');
  });
});