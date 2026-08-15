/**
 * Adaptador de Infraestructura: CarritoController
 * Maneja las peticiones HTTP del carrito y las delega a los casos de uso.
 * El usuario autenticado ya viene adjuntado por el middleware (req.usuario).
 */
class CarritoController {
  constructor({
    verCarritoUseCase,
    agregarAlCarritoUseCase,
    actualizarCarritoUseCase,
    eliminarDelCarritoUseCase,
  }) {
    this.verCarritoUseCase = verCarritoUseCase;
    this.agregarAlCarritoUseCase = agregarAlCarritoUseCase;
    this.actualizarCarritoUseCase = actualizarCarritoUseCase;
    this.eliminarDelCarritoUseCase = eliminarDelCarritoUseCase;
  }

  async ver(req, res) {
    try {
      const resultado = await this.verCarritoUseCase.execute(req.usuario);
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async agregar(req, res) {
    try {
      const resultado = await this.agregarAlCarritoUseCase.execute(req.usuario, req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const resultado = await this.actualizarCarritoUseCase.execute(
        req.usuario,
        req.params.productoId,
        req.body
      );
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await this.eliminarDelCarritoUseCase.execute(
        req.usuario,
        req.params.productoId
      );
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = CarritoController;