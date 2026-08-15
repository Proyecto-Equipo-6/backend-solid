const ErrorValidacion = require('./errors/ErrorValidacion');

const LIMITE_POR_DEFECTO = 12; // RN-011: paginación por defecto a 12 ítems

const ORDENES_VALIDOS = new Set([
  'menor_precio',
  'mayor_precio',
  'nombre',
]);

/**
 * Caso de Uso: ListarProductosUseCase
 * Explora el catálogo público con filtros dinámicos y paginación server-side.
 * RN-009: solo categorías y productos activos.
 * RN-011: límite de paginación por defecto.
 */
class ListarProductosUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute(filtros = {}) {
    const pagina = this._normalizarPagina(filtros.pagina);
    const limite = this._normalizarLimite(filtros.limite);
    const orden = this._normalizarOrden(filtros.orden);

    if (filtros.precioMin !== undefined && filtros.precioMax !== undefined) {
      if (filtros.precioMin > filtros.precioMax) {
        throw new ErrorValidacion('El precio mínimo no puede ser mayor al precio máximo');
      }
    }

    const criterios = {
      categoria: filtros.categoria,
      precioMin: filtros.precioMin !== undefined ? Number(filtros.precioMin) : undefined,
      precioMax: filtros.precioMax !== undefined ? Number(filtros.precioMax) : undefined,
      soloDisponibles: filtros.soloDisponibles === 'true' || filtros.soloDisponibles === true,
      orden,
      pagina,
      limite,
    };

    return this.productoRepository.listar(criterios);
  }

  _normalizarPagina(valor) {
    const pagina = Number(valor) || 1;
    if (!Number.isInteger(pagina) || pagina < 1) {
      throw new ErrorValidacion('El número de página debe ser un entero mayor o igual a 1');
    }
    return pagina;
  }

  _normalizarLimite(valor) {
    const limite = valor ? Number(valor) : LIMITE_POR_DEFECTO;
    if (!Number.isInteger(limite) || limite < 1) {
      throw new ErrorValidacion('El límite debe ser un entero mayor o igual a 1');
    }
    return limite;
  }

  _normalizarOrden(valor) {
    const orden = valor ?? 'nombre';
    if (!ORDENES_VALIDOS.has(orden)) {
      throw new ErrorValidacion('Criterio de ordenamiento no válido');
    }
    return orden;
  }
}

module.exports = ListarProductosUseCase;