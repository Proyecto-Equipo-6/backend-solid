class CrearCategoriaUseCase {
  constructor(categoriaRepo) {
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar({ nombre, descripcion = '', estado = 'Activo' }) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios'); // FA-002
    }

    const existente = await this.categoriaRepo.buscarPorNombre(nombre.trim());
    if (existente) {
      throw new Error('Ya existe una categoría con ese nombre'); // RN-092 / FA-001
    }

    // Convertir estado string a numérico si es necesario
    const estadoNumerico = estado === 'Activo' ? 1 : estado === 'Inactivo' ? 0 : estado;

    return await this.categoriaRepo.guardar({
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      estado: estadoNumerico
    });
  }
}

module.exports = CrearCategoriaUseCase;