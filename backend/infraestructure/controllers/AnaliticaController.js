/**
 * Adaptador de Infraestructura: AnaliticaController
 * Maneja las peticiones HTTP de los reportes del panel y las delega al Caso de Uso.
 */
class AnaliticaController {
  constructor(obtenerResumenAnaliticaUseCase) {
    this.obtenerResumenAnaliticaUseCase = obtenerResumenAnaliticaUseCase;
  }

  async obtenerResumen(req, res) {
    try {
      const resumen = await this.obtenerResumenAnaliticaUseCase.execute();
      return res.status(200).json(resumen);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = AnaliticaController;