const ProductoRepository = require('../../../domain/ports/ProductoRepository');
const Producto = require('../../../domain/models/Producto');

const ORDENES = {
  menor_precio: (a, b) => a.precio - b.precio,
  mayor_precio: (a, b) => b.precio - a.precio,
  nombre: (a, b) => a.titulo.localeCompare(b.titulo),
};

/**
 * Adaptador de Infraestructura: InMemoryProductoRepository
 * Implementa el puerto ProductoRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryProductoRepository extends ProductoRepository {
  constructor(productos = []) {
    super();
    this.productos = productos.map((p) => new Producto(p));
  }

  _visibles() {
    return this.productos;
  }

  async listar(criterios) {
    let items = this._visibles().slice();

    if (criterios.categoria !== undefined && criterios.categoria !== null && criterios.categoria !== '') {
      items = items.filter((p) => String(p.categoria) === String(criterios.categoria));
    }
    if (criterios.precioMin !== undefined) {
      items = items.filter((p) => p.precio >= criterios.precioMin);
    }
    if (criterios.precioMax !== undefined) {
      items = items.filter((p) => p.precio <= criterios.precioMax);
    }
    if (criterios.soloDisponibles) {
      items = items.filter((p) => p.stock > 0);
    }

    items.sort(ORDENES[criterios.orden] || ORDENES.nombre);

    const total = items.length;
    const offset = (criterios.pagina - 1) * criterios.limite;
    return {
      items: items.slice(offset, offset + criterios.limite),
      total,
      pagina: criterios.pagina,
      limite: criterios.limite,
      totalPaginas: Math.ceil(total / criterios.limite),
    };
  }

  async buscar(termino, filtros) {
    const normalizado = termino.toLowerCase();
    let items = this._visibles().filter((p) => {
      const coincidencia = [p.titulo, p.descripcion, p.proveedor]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(normalizado));
      return coincidencia;
    });

    if (filtros.categoria) {
      items = items.filter((p) => String(p.categoria) === String(filtros.categoria));
    }

    items.sort(ORDENES[filtros.orden] || ORDENES.nombre);

    const total = items.length;
    const offset = (filtros.pagina - 1) * filtros.limite;
    return {
      items: items.slice(offset, offset + filtros.limite),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async sugerencias(termino, maximo = 5) {
    const normalizado = termino.toLowerCase();
    return this._visibles()
      .filter((p) => String(p.titulo).toLowerCase().includes(normalizado))
      .slice(0, maximo);
  }

  async findById(id) {
    return this._visibles().find((p) => String(p.id) === String(id)) || null;
  }
}

module.exports = InMemoryProductoRepository;