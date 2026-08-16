-- CU-017 (RN-067/RN-069) necesita un estado "NO_ENTREGADO" que hoy no existe
-- en el enum pedidos_estado del schema.prisma actual. Este script agrega el
-- valor sin tocar los demás. Ajusta el nombre del enum si tu motor lo generó distinto.

ALTER TABLE pedidos
  MODIFY COLUMN estado ENUM(
    'PENDIENTE',
    'CONFIRMADO',
    'EN_REVISION',
    'APROBADO',
    'RECHAZADO',
    'ASIGNADO',
    'EN_CAMINO',
    'ENTREGADO',
    'NO_ENTREGADO',
    'CANCELADO',
    'DISPONIBLE'
  ) NULL DEFAULT 'PENDIENTE';

-- Luego, en prisma/schema.prisma agrega el valor al enum pedidos_estado:
--
-- enum pedidos_estado {
--   PENDIENTE
--   CONFIRMADO
--   EN_REVISION
--   APROBADO
--   RECHAZADO
--   ASIGNADO
--   EN_CAMINO
--   ENTREGADO
--   NO_ENTREGADO   -- nuevo
--   CANCELADO
--   DISPONIBLE
-- }
--
-- y corre: npx prisma migrate dev --name add_no_entregado_estado
