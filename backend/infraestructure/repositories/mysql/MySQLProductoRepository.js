const ProductoRepository = require('../../../domain/ports/ProductoRepository');
const pool = require('../../database/db');

const ORDENES_SQL = {
  menor_precio: 'p.precio ASC',
  mayor_precio: 'p.precio DESC',
  nombre: 'p.nombre ASC',
};

function aProductoPublico(fila) {
  return {
    id: fila.id_producto,
    titulo: fila.nombre,
    descripcion: fila.descripcion,
    categoria: fila.categoria,
    precio: Number(fila.precio),
    stock: Number(fila.stock),
    garantia: fila.garantia,
    imagen: fila.imagen_url,
    proveedor: fila.proveedor,
    destacado: false,
  };
}

const BASE_JOIN = `
  FROM productos p
  INNER JOIN categorias c ON p.id_categoria = c.id_categoria
  LEFT JOIN proveedores prov ON p.id_proveedor = prov.id_proveedor
  WHERE p.estado = 1 AND c.estado = 1
`;

class MySQLProductoRepository extends ProductoRepository {
  async listar(criterios) {
    const { categoria, precioMin, precioMax, soloDisponibles, orden, pagina, limite } = criterios;

    const condiciones = [];
    const parametros = [];

    if (categoria) {
      condiciones.push('c.id_categoria = ?');
      parametros.push(Number(categoria));
    }
    if (precioMin !== undefined && precioMin !== null && !Number.isNaN(precioMin)) {
      condiciones.push('p.precio >= ?');
      parametros.push(precioMin);
    }
    if (precioMax !== undefined && precioMax !== null && !Number.isNaN(precioMax)) {
      condiciones.push('p.precio <= ?');
      parametros.push(precioMax);
    }
    if (soloDisponibles) {
      condiciones.push('p.stock > 0');
    }

    const where = condiciones.length ? ` AND ${condiciones.join(' AND ')}` : '';
    const ordenSql = ORDENES_SQL[orden] || ORDENES_SQL.nombre;
    const offset = (pagina - 1) * limite;

    const [filas] = await pool.execute(
      `SELECT p.*, c.nombre AS categoria, prov.razon_social AS proveedor ${BASE_JOIN}${where} ORDER BY ${ordenSql} LIMIT ? OFFSET ?`,
      [...parametros, limite, offset]
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total ${BASE_JOIN}${where}`,
      parametros
    );

    return {
      items: filas.map(aProductoPublico),
      total: Number(total),
      pagina,
      limite,
      totalPaginas: Math.ceil(Number(total) / limite),
    };
  }

  async buscar(termino, filtros) {
    const condiciones = [];
    const parametros = [];

    condiciones.push('(LOWER(p.nombre) LIKE LOWER(?) OR LOWER(p.descripcion) LIKE LOWER(?) OR LOWER(prov.razon_social) LIKE LOWER(?))');
    parametros.push(`%${termino}%`, `%${termino}%`, `%${termino}%`);

    if (filtros.categoria) {
      condiciones.push('c.id_categoria = ?');
      parametros.push(Number(filtros.categoria));
    }

    const where = ` AND ${condiciones.join(' AND ')}`;
    const offset = (filtros.pagina - 1) * filtros.limite;
    const ordenSql = ORDENES_SQL[filtros.orden] || ORDENES_SQL.nombre;

    const [filas] = await pool.execute(
      `SELECT p.*, c.nombre AS categoria, prov.razon_social AS proveedor ${BASE_JOIN}${where} ORDER BY ${ordenSql} LIMIT ? OFFSET ?`,
      [...parametros, filtros.limite, offset]
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total ${BASE_JOIN}${where}`,
      parametros
    );

    return {
      items: filas.map(aProductoPublico),
      total: Number(total),
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(Number(total) / filtros.limite),
    };
  }

  async sugerencias(termino, maximo = 5) {
    const [filas] = await pool.execute(
      `SELECT p.*, c.nombre AS categoria, prov.razon_social AS proveedor ${BASE_JOIN}
       AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(prov.razon_social) LIKE LOWER(?))
       ORDER BY p.nombre ASC LIMIT ?`,
      [`%${termino}%`, `%${termino}%`, maximo]
    );
    return filas.map(aProductoPublico);
  }

  async findById(id) {
    const [filas] = await pool.execute(
      `SELECT p.*, c.nombre AS categoria, prov.razon_social AS proveedor ${BASE_JOIN}
       AND p.id_producto = ? LIMIT 1`,
      [Number(id)]
    );
    return filas[0] ? aProductoPublico(filas[0]) : null;
  }
}

module.exports = MySQLProductoRepository;