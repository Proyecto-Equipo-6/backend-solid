-- =====================================================
-- ARCHIVO: queries.sql
-- DESCRIPCIÓN: Consultas de Reportes, Métricas y Logs
-- BASE DE DATOS: sistema_comercial
-- NOTA: Los strings duplicados se centralizaron en variables de sesión
--       (ej. @FORMATO_FECHA_HORA) para evitar literales repetidos.
-- =====================================================

USE sistema_comercial;

-- Constante de formato de fecha/hora usada en todos los reportes
SET @FORMATO_FECHA_HORA = '%d/%m/%Y %H:%i';

-- =====================================================
-- 1. REPORTE DE VENTAS Y PEDIDOS DETALLADO
-- (Alineado con pedidos, pedido_detalles y metodos_pago)
-- =====================================================
SELECT 
    p.id_pedido                                             AS Pedido_No,
    DATE_FORMAT(p.fecha_pedido, @FORMATO_FECHA_HORA)        AS Fecha_Pedido,
    IFNULL(u.nombre_apellido, 'Cliente Eliminado')          AS Cliente,
    u.tipo_documento                                        AS Tipo_Doc,
    u.numero_documento                                      AS Documento,
    p.direccion_entrega                                     AS Direccion,
    mp.nombre                                               AS Metodo_Pago,
    IFNULL(cat.nombre, 'Sin Categoría')                     AS Categoria,
    IFNULL(prod.nombre, 'Producto Eliminado')               AS Producto,
    prod.sku                                                AS SKU,
    IFNULL(pd.cantidad, 0)                                  AS Cantidad,
    IFNULL(pd.precio_unitario, 0)                           AS Precio_Unitario,
    IFNULL(pd.subtotal, 0)                                  AS Subtotal_Item,
    p.total                                                 AS Total_Pedido,
    p.estado                                                AS Estado_Pedido
FROM pedidos p
INNER JOIN usuarios u           ON p.id_usuario = u.id_usuario
INNER JOIN metodos_pago mp      ON p.id_metodo_pago = mp.id_metodo_pago
LEFT JOIN pedido_detalles pd    ON p.id_pedido = pd.id_pedido
LEFT JOIN productos prod        ON pd.id_producto = prod.id_producto
LEFT JOIN categorias cat        ON prod.id_categoria = cat.id_categoria
ORDER BY p.fecha_pedido DESC;


-- =====================================================
-- 2. REPORTE DE INVENTARIO Y DISPONIBILIDAD
-- =====================================================
SELECT 
    p.id_producto                                           AS ID,
    p.sku                                                   AS SKU,
    p.nombre                                                AS Producto,
    c.nombre                                                AS Categoria,
    IFNULL(prov.razon_social, 'SIN PROVEEDOR')              AS Proveedor,
    prov.nit_proveedor                                      AS NIT_Proveedor,
    p.stock                                                 AS Stock_Disponible,
    CASE 
        WHEN p.stock = 0  THEN 'AGOTADO'
        WHEN p.stock < 10 THEN 'STOCK CRÍTICO'
        ELSE 'DISPONIBLE'
    END                                                     AS Estado_Stock,
    p.precio                                                AS PVP_COP,
    (p.stock * p.precio)                                    AS Valor_Total_Inventario,
    p.garantia                                              AS Garantia,
    CASE WHEN p.estado = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END AS Estado_Producto
FROM productos p
INNER JOIN categorias c       ON p.id_categoria = c.id_categoria
LEFT JOIN proveedores prov    ON p.id_proveedor = prov.id_proveedor
ORDER BY p.stock ASC, p.nombre ASC;


-- =====================================================
-- 3. SEGURIDAD, USUARIOS Y ROLES
-- =====================================================
SELECT 
    u.id_usuario                                            AS ID_Usuario,
    u.nombre_apellido                                       AS Nombre_Completo,
    u.tipo_documento                                        AS Tipo_Doc,
    u.numero_documento                                      AS Documento,
    u.email                                                 AS Email_Login,
    u.telefono                                              AS Telefono,
    IFNULL(r.nombre, 'SIN ROL')                             AS Rol,
    IFNULL(r.descripcion, '—')                              AS Permisos,
    CASE WHEN u.activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END AS Estado_Cuenta,
    DATE_FORMAT(u.fecha_creacion, @FORMATO_FECHA_HORA)         AS Fecha_Registro
FROM usuarios u
LEFT JOIN roles r ON u.id_rol = r.id_rol
ORDER BY r.nombre ASC, u.nombre_apellido ASC;


-- =====================================================
-- 4. ESTADO ACTUAL DE CARRITOS DE COMPRA
-- =====================================================
SELECT 
    c.id_carrito                                            AS ID_Carrito,
    u.nombre_apellido                                       AS Cliente,
    u.email                                                 AS Email_Contacto,
    p.nombre                                                AS Producto_En_Carrito,
    p.sku                                                   AS SKU,
    cd.cantidad                                             AS Cantidad_Solicitada,
    p.precio                                                AS Precio_Unitario,
    (cd.cantidad * p.precio)                                AS Subtotal_Proyectado,
    p.stock                                                 AS Stock_Actual_Bodega,
    CASE
        WHEN p.stock = 0           THEN 'SIN STOCK'
        WHEN p.stock < cd.cantidad THEN 'STOCK INSUFICIENTE'
        ELSE 'LISTO PARA COMPRAR'
    END                                                     AS Disponibilidad,
    DATE_FORMAT(c.fecha_actualizacion, @FORMATO_FECHA_HORA)    AS Ultima_Actividad
FROM carrito c
INNER JOIN usuarios u          ON c.id_usuario = u.id_usuario
INNER JOIN carrito_detalles cd ON c.id_carrito = cd.id_carrito
INNER JOIN productos p         ON cd.id_producto = p.id_producto
ORDER BY c.fecha_actualizacion DESC;


-- =====================================================
-- 5. LOGS Y AUDITORÍA DE MOVIMIENTOS DE INVENTARIO
-- =====================================================
SELECT 
    h.id_historial                                          AS ID_Log,
    DATE_FORMAT(h.fecha_registro, '%d/%m/%Y %H:%i:%s')      AS Fecha_Hora,
    p.nombre                                                AS Producto,
    p.sku                                                   AS SKU,
    u.nombre_apellido                                       AS Admin_Responsable,
    h.cantidad_anterior                                     AS Stock_Previo,
    h.cantidad_nueva                                        AS Stock_Nuevo,
    (h.cantidad_nueva - h.cantidad_anterior)                AS Variacion,
    h.motivo                                                AS Motivo_Ajuste
FROM historial_stock h
INNER JOIN productos p ON h.id_producto = p.id_producto
INNER JOIN usuarios u  ON h.id_admin = u.id_usuario
ORDER BY h.fecha_registro DESC;


-- =====================================================
-- 6. AUDITORÍA DE SEGURIDAD: TOKENS DE RECUPERACIÓN
-- =====================================================
SELECT 
    t.id_token                                              AS ID_Token,
    u.nombre_apellido                                       AS Usuario,
    u.email                                                 AS Email,
DATE_FORMAT(t.fecha_creacion, @FORMATO_FECHA_HORA)         AS Solicitado_El,
DATE_FORMAT(t.expira_en, @FORMATO_FECHA_HORA)              AS Expira_El,
    CASE 
        WHEN t.usado = 1 THEN 'UTILIZADO'
        WHEN t.expira_en < NOW() THEN 'EXPIRADO'
        ELSE 'PENDIENTE / ACTIVO'
    END                                                     AS Estado_Token
FROM tokens_recuperacion t
INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
ORDER BY t.fecha_creacion DESC;


-- =====================================================
-- 7. RESUMEN EJECUTIVO / METRICAS DE VENTAS POR CATEGORÍA
-- =====================================================
SELECT 
    c.nombre                                                AS Categoria,
    COUNT(DISTINCT pd.id_pedido)                            AS Total_Pedidos_Realizados,
    SUM(pd.cantidad)                                        AS Unidades_Vendidas,
    SUM(pd.subtotal)                                        AS Ingresos_Totales_COP
FROM categorias c
INNER JOIN productos p       ON c.id_categoria = p.id_categoria
INNER JOIN pedido_detalles pd ON p.id_producto = pd.id_producto
INNER JOIN pedidos ped       ON pd.id_pedido = ped.id_pedido
WHERE ped.estado IN ('ENTREGADO', 'ASIGNADO', 'EN_CAMINO')
GROUP BY c.id_categoria, c.nombre
ORDER BY Ingresos_Totales_COP DESC;