-- DROP DATABASE sistema_comercial ;
-- =============================================================================
-- BASE DE DATOS OPTIMIZADA Y NORMALIZADA
-- =============================================================================
CREATE DATABASE IF NOT EXISTS sistema_comercial
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
    
USE sistema_comercial;

-- =============================================================================
-- 1. TABLA: ROLES
-- =============================================================================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NULL
) ENGINE=InnoDB;

-- =============================================================================
-- 2. TABLA: USUARIOS
-- =============================================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL DEFAULT 1,
    nombre_apellido VARCHAR(50) NOT NULL,
    tipo_documento ENUM('CC', 'Pasaporte', 'CE', 'Otro') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(10) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- 3. TABLA: TOKENS_RECUPERACION
-- =============================================================================
CREATE TABLE tokens_recuperacion (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 4. TABLA: CATEGORIAS
-- =============================================================================
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 5. TABLA: PROVEEDORES
-- =============================================================================
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nit_proveedor VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(100) NOT NULL,
    telefono VARCHAR(10) NOT NULL,
    email VARCHAR(100) NOT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 6. TABLA: METODOS_PAGO
-- =============================================================================
CREATE TABLE metodos_pago (
    id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    requiere_comprobante TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 7. TABLA: PRODUCTOS
-- =============================================================================
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(30) NOT NULL UNIQUE,
    id_categoria INT NOT NULL,
    id_proveedor INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    garantia VARCHAR(100) NULL DEFAULT 'Sin garantía',
    imagen_url VARCHAR(255) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_categorias FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    CONSTRAINT fk_productos_proveedores FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT,
    CONSTRAINT chk_precio_positivo CHECK (precio > 0),
    CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0)
) ENGINE=InnoDB;

-- =============================================================================
-- 8. TABLA: HISTORIAL_STOCK
-- =============================================================================
CREATE TABLE historial_stock (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_admin INT NOT NULL,
    cantidad_anterior INT NOT NULL,
    cantidad_nueva INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_productos FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_historial_admin FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- 9. TABLA: CARRITO
-- =============================================================================
CREATE TABLE carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 10. TABLA: CARRITO_DETALLES
-- =============================================================================
CREATE TABLE carrito_detalles (
    id_detalle_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalles_carrito FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    CONSTRAINT uq_carrito_producto UNIQUE (id_carrito, id_producto),
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad >= 1)
) ENGINE=InnoDB;

-- =============================================================================
-- 11. TABLA: PEDIDOS (Incluye el estado NO_ENTREGADO)
-- =============================================================================
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    direccion_entrega VARCHAR(255) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM(
        'PENDIENTE', 
        'PENDIENTE_VERIFICACION', 
        'PAGO_APROBADO', 
        'EN_RUTA', 
        'ENTREGADO', 
        'NO_ENTREGADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    comprobante_url VARCHAR(255) NULL,
    observaciones TEXT NULL,
    motivo_cancelacion VARCHAR(255) NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_metodo_pago FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago) ON DELETE RESTRICT,
    CONSTRAINT chk_pedido_monto_minimo CHECK (total >= 200000.00)
) ENGINE=InnoDB;

-- =============================================================================
-- 12. TABLA: PEDIDO_DETALLES
-- =============================================================================
CREATE TABLE pedido_detalles (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_pedidodetalles_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pedidodetalles_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================================
CREATE INDEX idx_productos_busqueda ON productos (estado, id_categoria, precio);
CREATE INDEX idx_productos_sku ON productos (sku);
CREATE INDEX idx_pedidos_usuario ON pedidos (id_usuario, estado);
CREATE INDEX idx_tokens_expiracion ON tokens_recuperacion (token, expira_en, usado);