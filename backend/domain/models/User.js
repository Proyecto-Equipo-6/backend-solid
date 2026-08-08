class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  // Regla de negocio simple (ej. validación)
  isValid() {
    return this.name && this.email && this.email.includes('@');
  }
}

module.exports = User;
