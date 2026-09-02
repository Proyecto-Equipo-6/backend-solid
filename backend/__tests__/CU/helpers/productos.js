/**
 * Helpers compartidos de Producto/Categoría/Proveedor para tests.
 * Extrae lo idéntico de CU-023 (CRUDProductos) para evitar duplicación.
 */
const CrearCategoriaUseCase = require('../../../application/crearCategoriaUseCase.js');

/**
 * Crea una categoría vía use case y la devuelve.
 * @param {Object} repoCategoria - repositorio InMemory de categorías
 * @param {string} nombre - nombre de la categoría (default 'Aseo')
 * @returns {Promise<Object>} categoría creada
 */
async function crearCategoria(repoCategoria, nombre = 'Aseo') {
  const useCase = new CrearCategoriaUseCase(repoCategoria);
  return await useCase.ejecutar({ nombre, descripcion: 'Productos de limpieza' });
}

/**
 * Inserta un proveedor directamente en el repositorio InMemory.
 * @param {Object} repoProveedor - repositorio InMemory de proveedores
 * @param {number} id - id_proveedor (default 1)
 * @param {string} nombre - razón social (default 'Proveedor Test')
 */
function crearProveedor(repoProveedor, id = 1, nombre = 'Proveedor Test') {
  repoProveedor.proveedores.push({
    id_proveedor: id,
    nit_proveedor: '900123456-7',
    razon_social: nombre,
    telefono: '6012345678',
    email: 'proveedor@test.com',
    estado: 1,
    fecha_creacion: new Date().toISOString()
  });
}

module.exports = { crearCategoria, crearProveedor };