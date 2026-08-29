/**
 * Helper para generar SKU de producto de forma determinista.
 * Regla: 3 primeras letras de la categoría + 4 primeras del nombre
 * + número = total de productos + 1. Ej: Cocina + "Licuadora" → COC-LICU-6.
 */

function normalizarTexto(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

async function generarSkuSistema(categoriaRepo, productoRepo, idCategoria, nombre) {
  const categoria = await categoriaRepo.buscarPorId(idCategoria);
  const prefijoCategoria = normalizarTexto(categoria ? categoria.nombre : '').slice(0, 3);
  const prefijoNombre = normalizarTexto(nombre).slice(0, 4);

  const total = await productoRepo.contar();
  let numero = total + 1;
  let sku = `${prefijoCategoria}-${prefijoNombre}-${numero}`;

  while (await productoRepo.buscarPorSKU(sku)) {
    numero += 1;
    sku = `${prefijoCategoria}-${prefijoNombre}-${numero}`;
  }

  return sku;
}

module.exports = { normalizarTexto, generarSkuSistema };