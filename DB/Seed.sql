USE sistema_comercial;

-- =====================================================
-- METODOS DE PAGO
-- =====================================================
INSERT INTO metodos_pago (id_metodo_pago, nombre, descripcion, requiere_comprobante, activo) VALUES
(1, 'Efectivo / Contraentrega', 'Pago en efectivo al momento de recibir el pedido', 0, 1),
(2, 'Transferencia / Nequi / Daviplata', 'Pago mediante transferencia bancaria o monedero virtual', 1, 1);

-- =====================================================
-- 1. ROLES
-- =====================================================
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'Administrador', 'Control total del sistema'),
(2, 'Cliente',       'Usuario registrado con acceso a compras'),
(3, 'Repartidor',    'Encargado de entregar pedidos a domicilio');

-- =====================================================
-- 2. USUARIOS
-- =====================================================
INSERT INTO usuarios (id_usuario, id_rol, nombre_apellido, tipo_documento, numero_documento, email, password, telefono, direccion) VALUES
(1, 1, 'Sebastian Admin', 'CC', '1010', 'admin@remate.com', '$2b$10$FmvdWkpOie1MECB/paY9a.D1XyitCgIDj1g4XIZGqXvgIR4sVNGh6', '3001000001', 'Calle 100 #15-20, Medellín'),
(2, 2, 'Juan Cliente',    'CC', '2020', 'juan@email.com',   '$2b$10$FmvdWkpOie1MECB/paY9a.D1XyitCgIDj1g4XIZGqXvgIR4sVNGh6', '3002000002', 'Calle 10 # 5-20, Medellín'),
(3, 2, 'Maria Compra',    'CC', '3030', 'maria@email.com',  '$2b$10$FmvdWkpOie1MECB/paY9a.D1XyitCgIDj1g4XIZGqXvgIR4sVNGh6', '3003000003', 'Carrera 45 # 12-10, Medellín'),
(4, 2, 'Carlos Venta',    'CC', '4040', 'carlos@email.com', '$2b$10$FmvdWkpOie1MECB/paY9a.D1XyitCgIDj1g4XIZGqXvgIR4sVNGh6', '3004000004', 'Av. El Poblado # 3-15, Medellín'),
(5, 3, 'Luis Repartidor', 'CC', '6060', 'luis@remate.com',  '$2b$10$FmvdWkpOie1MECB/paY9a.D1XyitCgIDj1g4XIZGqXvgIR4sVNGh6', '3006000006', 'Transversal 39 # 77-50, Medellín');

-- =====================================================
-- 3. CATEGORIAS
-- =====================================================
INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES 
(1, 'Cocina',      'Artículos y utensilios para la cocina'), 
(2, 'Hogar',       'Elementos de decoración y confort para el hogar'), 
(3, 'Electrónica', 'Dispositivos y accesorios electrónicos'), 
(4, 'Muebles',     'Mobiliario para interior y exterior'), 
(5, 'Jardín',      'Herramientas y decoración para jardines');

-- =====================================================
-- 4. PROVEEDORES
-- =====================================================
INSERT INTO proveedores (id_proveedor, nit_proveedor, razon_social, telefono, email, estado) VALUES 
(1, '900123456-1', 'Mega Plásticos S.A.S.',     '6041234567', 'contacto@megaplasticos.com', 1),
(2, '800987654-2', 'Importaciones Sol LTDA',    '6049876543', 'ventas@importacionessol.com', 1),
(3, '700111222-3', 'Distribuidora Hogar S.A.',  '6045554411', 'comercial@distribuidorahogar.com', 1),
(4, '600333444-4', 'Tecno S.A.',                '6043332211', 'soporte@tecno.com', 1),
(5, '500555666-5', 'Muebles Pro Colombia',      '6049998877', 'info@mueblespro.com', 1);

-- =====================================================
-- 5. PRODUCTOS
-- =====================================================
INSERT INTO productos (id_producto, sku, id_categoria, id_proveedor, nombre, descripcion, precio, stock, garantia, imagen_url) VALUES
(1, 'COC-UTEN-01', 1, 1, 'Juego Utensilios Pro', 'Juego completo de utensilios de cocina en silicona resistente al calor', 250000.00, 100, '6 meses', NULL),
(2, 'HOG-MASA-02', 2, 2, 'Masajeador Corporal', 'Masajeador eléctrico con infrarrojo y 5 cabezales intercambiables', 220000.00, 50, '12 meses', NULL),
(3, 'ELE-PARL-03', 3, 4, 'Parlante BT Pro',      'Parlante bluetooth portátil contra el agua con batería de 12 horas', 350000.00, 30, '12 meses', NULL),
(4, 'MUE-SILL-04', 4, 5, 'Silla Rattan Set',    'Set de 2 sillas de rattan sintético para exteriores', 450000.00, 20, '24 meses', NULL),
(5, 'JAR-MATE-05', 5, 3, 'Set Materas Barro',   'Set de 3 materas artesanales de barro cocido', 210000.00, 80, 'Sin garantía', NULL);

-- =====================================================
-- 6. CARRITO & CARRITO_DETALLES
-- =====================================================
INSERT INTO carrito (id_carrito, id_usuario) VALUES
(1, 2),
(2, 3),
(3, 4);

INSERT INTO carrito_detalles (id_carrito, id_producto, cantidad) VALUES
(1, 1, 1),
(1, 2, 1),
(2, 4, 1),
(3, 3, 1);

-- =====================================================
-- 7. PEDIDOS (Suma de montos >= $200.000 para cumplir CHK)
-- =====================================================
INSERT INTO pedidos (id_pedido, id_usuario, id_metodo_pago, direccion_entrega, total, estado, observaciones) VALUES
(1, 2, 1, 'Calle 10 # 5-20, Medellín',        250000.00, 'ENTREGADO',              'Entregado en portería'),
(2, 3, 2, 'Carrera 45 # 12-10, Medellín',     350000.00, 'ASIGNADO',               'Pedido asignado a repartidor'),
(3, 4, 1, 'Av. El Poblado # 3-15, Medellín',   450000.00, 'EN_CAMINO',              'Llamar antes de entregar'),
(4, 3, 2, 'Calle 80 # 23-45, Medellín',       220000.00, 'CANCELADO',              'Cancelado a solicitud del cliente'),
(5, 2, 1, 'Calle 10 # 5-20, Medellín',        210000.00, 'NO_ENTREGADO',           'Cliente no se encontraba en el domicilio');

-- =====================================================
-- 8. PEDIDO_DETALLES
-- =====================================================
INSERT INTO pedido_detalles (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 250000.00, 250000.00),
(2, 3, 1, 350000.00, 350000.00),
(3, 4, 1, 450000.00, 450000.00),
(4, 2, 1, 220000.00, 220000.00),
(5, 5, 1, 210000.00, 210000.00);

-- =====================================================
-- 9. HISTORIAL_STOCK
-- =====================================================
INSERT INTO historial_stock (id_producto, id_admin, cantidad_anterior, cantidad_nueva, motivo) VALUES
(1, 1, 0, 100, 'Carga de inventario inicial'),
(2, 1, 0,  50, 'Carga de inventario inicial'),
(3, 1, 0,  30, 'Carga de inventario inicial'),
(4, 1, 0,  20, 'Carga de inventario inicial'),
(5, 1, 0,  80, 'Carga de inventario inicial');