/**
 * Modelo de Dominio: Banco
 * Representa un banco o monedero virtual para el pago de pedidos.
 */
class Banco {
  constructor({ id_banco = null, id_metodo_pago, nombre, descripcion, numero_cuenta } = {}) {
    this.id_banco = id_banco;
    this.id_metodo_pago = id_metodo_pago;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.numero_cuenta = numero_cuenta;
  }
}

module.exports = Banco;