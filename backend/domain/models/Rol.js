class Rol {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  isValid() {
    return Boolean(this.id && this.name && this.name.length <= 30);
  }
}

module.exports = Rol;
