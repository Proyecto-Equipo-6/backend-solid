const ErrorValidacion = require('./errors/ErrorValidacion');

const MINIMO_CARACTERES = 3; // RN-012: autocompletado requiere >= 3 caracteres
const MAX_SUGERENCIAS = 5;   // RN-014: máximo 5 sugerencias

/**
 * Caso de Uso: BuscarProductosUseCase
 * Búsqueda reactiva por palabras clave con autocompletado.
 * RN-012: disparo de autocompletado condicionado a 3 o más caracteres.
 * RN-013: se omiten productos/categorías inactivos.
 * RN-014: límite máximo de 5 sugerencias.
 */
class BuscarProductosUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute({ termino, filtros = {} }) {
    const terminoLimpio = this._sanitizarTermino(termino);
    if (terminoLimpio.length < MINIMO_CARACTERES) {
      throw new ErrorValidacion('Por favor, ingresa al menos 3 caracteres para buscar');
    }

    const pagina = Number(filtros.pagina) || 1;
    const limite = Number(filtros.limite) || 12;

    const [sugerencias, resultados] = await Promise.all([
      this.productoRepository.sugerencias(terminoLimpio, MAX_SUGERENCIAS),
      this.productoRepository.buscar(terminoLimpio, { ...filtros, pagina, limite }),
    ]);

    return {
      termino: terminoLimpio,
      sugerencias,
      ...resultados,
    };
  }

  _sanitizarTermino(termino) {
    if (termino === undefined || termino === null) {
      throw new ErrorValidacion('Debes ingresar un término de búsqueda');
    }
    const texto = String(termino).trim();
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}

module.exports = BuscarProductosUseCase;