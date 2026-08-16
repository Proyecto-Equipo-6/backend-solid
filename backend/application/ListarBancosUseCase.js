const Banco = require('../domain/models/Banco');

/**
 * Caso de Uso: ListarBancosUseCase
 * Obtiene los bancos y monederos activos para mostrarlos como opciones de pago.
 * Solo depende de la abstracción (BancoRepository).
 */
class ListarBancosUseCase {
  constructor(bancoRepository) {
    this.bancoRepository = bancoRepository;
  }

  async execute() {
    const bancos = await this.bancoRepository.findActivos();
    return bancos.map((banco) => {
      const instancia = banco instanceof Banco ? banco : new Banco(banco);
      return {
        id_banco: instancia.id_banco,
        id_metodo_pago: instancia.id_metodo_pago,
        nombre: instancia.nombre,
        descripcion: instancia.descripcion,
        numero_cuenta: instancia.numero_cuenta,
      };
    });
  }
}

module.exports = ListarBancosUseCase;