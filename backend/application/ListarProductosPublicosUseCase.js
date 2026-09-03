const Producto = require('../domain/models/Producto');

const LIMITE_POR_DEFECTO = 12; // RN-011: paginación por defecto a 12 ítems

/**
 * Caso de Uso: ListarProductosPublicosUseCase
 * Obtiene los productos activos del catálogo con su ficha técnica
 * (categoría y proveedor). Solo depende de la abstracción (ProductoRepository).
 * RN-011: la paginación se aplica en el servidor (server-side).
 */
class ListarProductosPublicosUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute({ pagina = 1, limite = LIMITE_POR_DEFECTO } = {}) {
    const paginaNumero = Math.max(1, Number(pagina) || 1);
    const limiteNumero = Math.max(1, Number(limite) || LIMITE_POR_DEFECTO);
    const inicio = (paginaNumero - 1) * limiteNumero;

    // RNF-007: paginación en SQL (LIMIT/OFFSET) — ya NO carga todos los
    // productos a memoria. El total se obtiene con COUNT(*) separado.
    const productos = await this.productoRepository.findActivos(limiteNumero, inicio);
    const total = await this.productoRepository.contarActivos();
    const items = productos.map((producto) => {
      const instancia = producto instanceof Producto ? producto : new Producto(producto);
      return {
        id_producto: instancia.id_producto,
        sku: instancia.sku,
        nombre: instancia.nombre,
        descripcion: instancia.descripcion,
        precio: instancia.precio,
        stock: instancia.stock,
        garantia: instancia.garantia,
        imagen_url: instancia.imagen_url,
        estado: instancia.estado,
        categoria: instancia.categoria,
        proveedor: instancia.proveedor,
      };
    });

    return {
      items,
      total,
      pagina: paginaNumero,
      limite: limiteNumero,
      totalPaginas: Math.ceil(total / limiteNumero),
    };
  }
}

module.exports = ListarProductosPublicosUseCase;
