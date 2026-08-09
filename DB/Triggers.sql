-- =============================================================================
-- DISPARADORES (TRIGGERS) PARA SISTEMA_COMERCIAL
-- =============================================================================
USE sistema_comercial;

-- Eliminación previa para evitar duplicados si los vuelves a ejecutar
DROP TRIGGER IF EXISTS trg_usuarios_limpiar_email;
DROP TRIGGER IF EXISTS trg_carrito_validar_stock;
DROP TRIGGER IF EXISTS trg_descontar_stock_venta;
DROP TRIGGER IF EXISTS trg_restaurar_stock_cancelacion;
DROP TRIGGER IF EXISTS trg_auditoria_cambio_stock;

DELIMITER //

-- =============================================================================
-- 1. TABLA: USUARIOS | Limpiar y formatear email
-- Convierte el email a minúsculas automáticamente antes de guardar.
-- =============================================================================
CREATE TRIGGER trg_usuarios_limpiar_email
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    SET NEW.email = LOWER(TRIM(NEW.email));
END //

-- =============================================================================
-- 2. TABLA: CARRITO_DETALLES | Validar stock antes de agregar al carrito
-- Evita que el cliente agregue una cantidad superior al stock en bodega.
-- =============================================================================
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

-- =============================================================================
-- 3. TABLA: PEDIDO_DETALLES | Descontar stock al vender
-- Resta la cantidad vendida del inventario de productos.
-- =============================================================================
CREATE TRIGGER trg_descontar_stock_venta
AFTER INSERT ON pedido_detalles
FOR EACH ROW
BEGIN
    UPDATE productos
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END //

-- =============================================================================
-- 4. TABLA: PEDIDOS | Reintegrar stock si el pedido se cancela
-- Si el pedido pasa a CANCELADO, reabastece las unidades a productos.
-- =============================================================================
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

-- =============================================================================
-- 5. TABLA: PRODUCTOS | Auditoría de inventario
-- Registra automáticamente el cambio en historial_stock si se modifica el stock.
-- =============================================================================
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
            1, -- ID 1 asignado al Administrador / Sistema por defecto
            OLD.stock,
            NEW.stock,
            'Ajuste o movimiento automático de stock'
        );
    END IF;
END //

DELIMITER ;