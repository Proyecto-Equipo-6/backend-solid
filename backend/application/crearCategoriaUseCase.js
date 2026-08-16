// Convierte el estado textual a su valor numérico (1=Activo, 0=Inactivo).
function convertirEstado(estado) {
  if (estado === 'Activo') return 1;
  if (estado === 'Inactivo') return 0;
  return estado;
}

class CrearCategoriaUseCase {
  constructor(categoriaRepo) {
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar({ nombre, descripcion = '', estado = 'Activo' }) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios');
    }

    // Validar que el nombre no contenga números ni símbolos
    const regexNombre = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
    if (!regexNombre.test(nombre.trim())) {
      throw new Error('El nombre solo debe contener letras y espacios');
    }

    const existente = await this.categoriaRepo.buscarPorNombre(nombre.trim());
    if (existente) {
      throw new Error('Ya existe una categoría con ese nombre');
    }

    const estadoNumerico = convertirEstado(estado);

    return await this.categoriaRepo.guardar({
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      estado: estadoNumerico
    });
  }
}

module.exports = CrearCategoriaUseCase;