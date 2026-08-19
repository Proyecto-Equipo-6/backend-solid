-- =============================================================================
-- SISTEMA_COMERCIAL — ARCHIVO COMPLETO (Schema + Triggers + Seed)
-- =============================================================================
-- Creado: 2026-08-17
-- Propósito: ejecutar TODO en un solo archivo desde MySQL Workbench para
--            levantar la base de datos de pruebas.
--
-- NOTA: Para re-crear desde cero, descomenta la línea DROP DATABASE.
--       ⚠️ Es DESTRUCTIVO: borra la BD actual.
-- =============================================================================

-- DROP DATABASE IF EXISTS sistema_comercial;

-- =============================================================================
-- SCHEMA
-- =============================================================================
CREATE DATABASE IF NOT EXISTS sistema_comercial
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_comercial;

-- 1. TABLA: ROLES
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NULL
) ENGINE=InnoDB;

-- 2. TABLA: USUARIOS
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

-- 3. TABLA: TOKENS_RECUPERACION
CREATE TABLE tokens_recuperacion (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABLA: CATEGORIAS
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. TABLA: PROVEEDORES
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nit_proveedor VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(100) NOT NULL,
    telefono VARCHAR(10) NOT NULL,
    email VARCHAR(100) NOT NULL,
    imagen_url VARCHAR(255) NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5.1 TABLA: REPARTIDORES
CREATE TABLE repartidores (
    id_repartidor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    vehiculo VARCHAR(50) NULL,
    placa VARCHAR(20) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repartidores_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. TABLA: METODOS_PAGO
-- NOTA: Métodos de pago disponibles: 1 = Efectivo / Contraentrega, 2 = Nequi.
CREATE TABLE metodos_pago (
    id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    requiere_comprobante TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. TABLA: PRODUCTOS
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

-- 8. TABLA: HISTORIAL_STOCK
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

-- 9. TABLA: CARRITO
CREATE TABLE carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. TABLA: CARRITO_DETALLES
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

-- 11. TABLA: PEDIDOS
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    direccion_entrega VARCHAR(255) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'CONFIRMADO',
        'ASIGNADO',
        'EN_CAMINO',
        'ENTREGADO',
        'NO_ENTREGADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    id_repartidor INT NULL,
    comprobante_url VARCHAR(255) NULL,
    observaciones TEXT NULL,
    motivo_cancelacion VARCHAR(255) NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_metodo_pago FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_repartidor FOREIGN KEY (id_repartidor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_pedido_monto_minimo CHECK (total >= 200000.00)
) ENGINE=InnoDB;

-- 12. TABLA: PEDIDO_DETALLES
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

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX idx_productos_busqueda ON productos (estado, id_categoria, precio);
CREATE INDEX idx_productos_sku ON productos (sku);
CREATE INDEX idx_pedidos_usuario ON pedidos (id_usuario, estado);
CREATE INDEX idx_tokens_expiracion ON tokens_recuperacion (token, expira_en, usado);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
DROP TRIGGER IF EXISTS trg_usuarios_limpiar_email;
DROP TRIGGER IF EXISTS trg_carrito_validar_stock;
DROP TRIGGER IF EXISTS trg_descontar_stock_venta;
DROP TRIGGER IF EXISTS trg_restaurar_stock_cancelacion;
DROP TRIGGER IF EXISTS trg_auditoria_cambio_stock;

DELIMITER //

CREATE TRIGGER trg_usuarios_limpiar_email
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    SET NEW.email = LOWER(TRIM(NEW.email));
END //

CREATE TRIGGER trg_carrito_validar_stock
BEFORE INSERT ON carrito_detalles
FOR EACH ROW
BEGIN
    DECLARE stock_disponible INT;

    SELECT stock INTO stock_disponible
    FROM productos
    WHERE id_producto = NEW.id_producto;

    IF NEW.cantidad > stock_disponible THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: La cantidad solicitada supera el stock disponible en bodega.';
    END IF;
END //

CREATE TRIGGER trg_descontar_stock_venta
AFTER INSERT ON pedido_detalles
FOR EACH ROW
BEGIN
    UPDATE productos
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END //

CREATE TRIGGER trg_restaurar_stock_cancelacion
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF OLD.estado != 'CANCELADO' AND NEW.estado = 'CANCELADO' THEN
        UPDATE productos p
        INNER JOIN pedido_detalles pd ON p.id_producto = pd.id_producto
        SET p.stock = p.stock + pd.cantidad
        WHERE pd.id_pedido = NEW.id_pedido;
    END IF;
END //

CREATE TRIGGER trg_auditoria_cambio_stock
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF OLD.stock <> NEW.stock THEN
        INSERT INTO historial_stock (
            id_producto,
            id_admin,
            cantidad_anterior,
            cantidad_nueva,
            motivo
        )
        VALUES (
            NEW.id_producto,
            1,
            OLD.stock,
            NEW.stock,
            'Ajuste o movimiento automático de stock'
        );
    END IF;
END //

DELIMITER ;

-- =============================================================================
-- SEED (datos de prueba)
-- =============================================================================
-- METODOS DE PAGO (1 = Efectivo / Contraentrega, 2 = Nequi)
INSERT INTO metodos_pago (id_metodo_pago, nombre, descripcion, requiere_comprobante, activo) VALUES
(1, 'Efectivo / Contraentrega', 'Pago en efectivo al momento de recibir el pedido', 0, 1),
(2, 'Nequi', 'Pago por Nequi', 0, 1);

-- ROLES
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'Administrador', 'Control total del sistema'),
(2, 'Cliente',       'Usuario registrado con acceso a compras'),
(3, 'Repartidor',    'Encargado de entregar pedidos a domicilio');

-- USUARIOS
INSERT INTO usuarios (id_usuario, id_rol, nombre_apellido, tipo_documento, numero_documento, email, password, telefono, direccion) VALUES
(1, 1, 'Sebastian Admin', 'CC', '1010', 'admin@remate.com', '$2b$10$U7YUBuLdLuOd9BQxrziLwOLirD8zRE4eShDeW4BboMwtRSN2bRll.', '3001000001', 'Calle 100 #15-20, Medellín'),
(2, 2, 'Juan Cliente',    'CC', '2020', 'juan@email.com',   '$2b$10$U7YUBuLdLuOd9BQxrziLwOLirD8zRE4eShDeW4BboMwtRSN2bRll.', '3002000002', 'Calle 10 # 5-20, Medellín'),
(3, 2, 'Maria Compra',    'CC', '3030', 'maria@email.com',  '$2b$10$U7YUBuLdLuOd9BQxrziLwOLirD8zRE4eShDeW4BboMwtRSN2bRll.', '3003000003', 'Carrera 45 # 12-10, Medellín'),
(4, 2, 'Carlos Venta',    'CC', '4040', 'carlos@email.com', '$2b$10$U7YUBuLdLuOd9BQxrziLwOLirD8zRE4eShDeW4BboMwtRSN2bRll.', '3004000004', 'Av. El Poblado # 3-15, Medellín'),
(5, 3, 'Luis Repartidor', 'CC', '6060', 'luis@remate.com',  '$2b$10$U7YUBuLdLuOd9BQxrziLwOLirD8zRE4eShDeW4BboMwtRSN2bRll.', '3006000006', 'Transversal 39 # 77-50, Medellín');

-- REPARTIDORES (vinculados a usuarios con rol 3)
INSERT INTO repartidores (id_repartidor, id_usuario, vehiculo, placa, activo) VALUES
(1, 5, 'Moto Honda CB190', 'ABC123', 1);

-- CATEGORIAS
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES
(1, 'Cocina',      'Artículos y utensilios para la cocina'),
(2, 'Hogar',       'Elementos de decoración y confort para el hogar'),
(3, 'Electrónica', 'Dispositivos y accesorios electrónicos'),
(4, 'Muebles',     'Mobiliario para interior y exterior'),
(5, 'Jardín',      'Herramientas y decoración para jardines');

-- PROVEEDORES
INSERT INTO proveedores (id_proveedor, nit_proveedor, razon_social, telefono, email, estado) VALUES
(1, '900123456-1', 'Mega Plásticos S.A.S.',     '6041234567', 'contacto@megaplasticos.com', 1),
(2, '800987654-2', 'Importaciones Sol LTDA',    '6049876543', 'ventas@importacionessol.com', 1),
(3, '700111222-3', 'Distribuidora Hogar S.A.',  '6045554411', 'comercial@distribuidorahogar.com', 1),
(4, '600333444-4', 'Tecno S.A.',                '6043332211', 'soporte@tecno.com', 1),
(5, '500555666-5', 'Muebles Pro Colombia',      '6049998877', 'info@mueblespro.com', 1);

-- PRODUCTOS
INSERT INTO productos (id_producto, sku, id_categoria, id_proveedor, nombre, descripcion, precio, stock, garantia, imagen_url) VALUES
(1, 'COC-UTEN-01', 1, 1, 'Juego Utensilios Pro', 'Juego completo de utensilios de cocina en silicona resistente al calor', 250000.00, 100, '6 meses', NULL),
(2, 'HOG-MASA-02', 2, 2, 'Masajeador Corporal', 'Masajeador eléctrico con infrarrojo y 5 cabezales intercambiables', 220000.00, 50, '12 meses', NULL),
(3, 'ELE-PARL-03', 3, 4, 'Parlante BT Pro',      'Parlante bluetooth portátil contra el agua con batería de 12 horas', 350000.00, 30, '12 meses', NULL),
(4, 'MUE-SILL-04', 4, 5, 'Silla Rattan Set',    'Set de 2 sillas de rattan sintético para exteriores', 450000.00, 20, '24 meses', NULL),
(5, 'JAR-MATE-05', 5, 3, 'Set Materas Barro',   'Set de 3 materas artesanales de barro cocido', 210000.00, 80, 'Sin garantía', NULL);

-- CARRITO & CARRITO_DETALLES
INSERT INTO carrito (id_carrito, id_usuario) VALUES
(1, 2),
(2, 3),
(3, 4);

INSERT INTO carrito_detalles (id_carrito, id_producto, cantidad) VALUES
(1, 1, 1),
(1, 2, 1),
(2, 4, 1),
(3, 3, 1);

-- PEDIDOS (todos con id_metodo_pago = 1: Efectivo / Contraentrega)
INSERT INTO pedidos (id_pedido, id_usuario, id_metodo_pago, direccion_entrega, total, estado, id_repartidor, observaciones) VALUES
(1, 2, 1, 'Calle 10 # 5-20, Medellín',        250000.00, 'ENTREGADO',              NULL, 'Entregado en portería'),
(2, 3, 1, 'Carrera 45 # 12-10, Medellín',     350000.00, 'ASIGNADO',               5,    'Pedido asignado a repartidor'),
(3, 4, 1, 'Av. El Poblado # 3-15, Medellín',   450000.00, 'EN_CAMINO',              5,    'Llamar antes de entregar'),
(4, 3, 1, 'Calle 80 # 23-45, Medellín',       220000.00, 'CANCELADO',              NULL, 'Cancelado a solicitud del cliente'),
(5, 2, 1, 'Calle 10 # 5-20, Medellín',        210000.00, 'NO_ENTREGADO',           NULL, 'Cliente no se encontraba en el domicilio');

-- PEDIDO_DETALLES
INSERT INTO pedido_detalles (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 250000.00, 250000.00),
(2, 3, 1, 350000.00, 350000.00),
(3, 4, 1, 450000.00, 450000.00),
(4, 2, 1, 220000.00, 220000.00),
(5, 5, 1, 210000.00, 210000.00);

-- HISTORIAL_STOCK
INSERT INTO historial_stock (id_producto, id_admin, cantidad_anterior, cantidad_nueva, motivo) VALUES
(1, 1, 0, 100, 'Carga de inventario inicial'),
(2, 1, 0,  50, 'Carga de inventario inicial'),
(3, 1, 0,  30, 'Carga de inventario inicial'),
(4, 1, 0,  20, 'Carga de inventario inicial'),
(5, 1, 0,  80, 'Carga de inventario inicial');