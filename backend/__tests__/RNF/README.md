# Pruebas RNF (Requisitos No Funcionales)

Suite de verificación de requisitos no funcionales ubicada en
`backend/__tests__/RNF/`. Se ejecuta con Jest (ya configurado en el repo).

## Ejecución

```bash
# Tests unit/static (siempre disponibles, no requieren servicios)
npx jest backend/__tests__/RNF/RNF-003-autenticacion.test.js
npx jest backend/__tests__/RNF/RNF-003-matriz-permisos.test.js
npx jest backend/__tests__/RNF/RNF-008-mantenibilidad.test.js
npx jest backend/__tests__/RNF/RNF-012-auditoria.test.js

# Suite RNF completa (los tests live/Selenium se omiten si no hay servicios)
npm run test:rnf
```

### Servicios requeridos por prueba

| Test | Requiere | Variable de entorno |
|------|----------|---------------------|
| RNF-001, RNF-002, RNF-007, RNF-009 | Backend `:3000` + MySQL sembrado | — |
| RNF-005, RNF-013 | Frontend `:5173` + backend + Chrome/Edge | — |
| RNF-010 | Cloudinary y SMTP configurados (`.env`) | — |
| RNF-007 (carga pesada) | Catálogo de ~5 000 productos | `RNF_LOAD=1` |
| RNF-009 (soak 24 h) | Backend + MySQL estables | `RNF_SOAK_MINUTOS=1440` |
| Cualquiera (forzar fallo si falta servicio) | — | `RNF_FORZAR_LIVE=1` |

Los tests que dependen de servicios vivos verifican la disponibilidad y se
**omiten automáticamente** si el servicio no responde, para no romper `npm test`.

## Mapeo RNF → test

| RNF / Criterio | Test | Tipo |
|----------------|------|------|
| RNF-001 CP-001-01: flujos principales + generación de pedido <= 5s | `RNF-001-rendimiento.test.js` | Live (auto-skip) |
| RNF-001 CP-001-02: confirmación de entrega con evidencias a Cloudinary <= 5s | `RNF-001-rendimiento.test.js` | Live (auto-skip) |
| RNF-001 CP-001-03: comportamiento bajo estrés con carga normal | `RNF-001-rendimiento.test.js` | Live (auto-skip) |
| RNF-002 CP-002-01: cambio confirmado visible en <= 2s | `RNF-002-consistencia.test.js` | Live (auto-skip) |
| RNF-002 CP-002-02: consistencia bajo escrituras concurrentes | `RNF-002-consistencia.test.js` | Live (auto-skip) |
| RNF-002 CP-002-03: estado de pedido visible <= 2s en vistas cliente/repartidor | `RNF-002-consistencia.test.js` | Live (auto-skip) |
| RNF-003 CP-003-01: Cliente no modifica permisos/roles/usuarios | `RNF-003-matriz-permisos.test.js` | Unit |
| RNF-003 CP-003-02: Repartidor o petición sin token quedan bloqueados | `RNF-003-autenticacion.test.js` | Unit |
| RNF-003 CP-003-03: solo Admin gestiona la matriz de permisos | `RNF-003-matriz-permisos.test.js` | Unit |
| RNF-005 CP-005-01: navegación intuitiva, éxito >= 90%, SUS >= 80 | `RNF-005-usabilidad.test.js` + `RNF-005-SUS-checklist.md` | Selenium + manual |
| RNF-007 CP-007-01: sin degradación > 20%, rampa progresiva hasta 200 usuarios | `RNF-007-degradacion.test.js` | Live (opcional `RNF_LOAD=1`) |
| RNF-008 CP-008-01: acoplamiento, duplicación, ciclomática y documentación (Postman) | `RNF-008-mantenibilidad.test.js` | Static |
| RNF-008 CP-008-02: estructura modular aísla y corrige bugs | `RNF-008-mantenibilidad.test.js` | Static |
| RNF-009 CP-009-01: 24 h continuas, integridad transaccional, fallos < 0.1% | `RNF-009-operacion-continua.test.js` | Live (soak) |
| RNF-010 CP-010-01: SMTP/Cloudinary >= 99.5% de éxito (reintentos pendientes) | `RNF-010-interoperabilidad.test.js` | Live (auto-skip) |
| RNF-012 CP-012-01: cobertura de auditoría de operaciones críticas | `RNF-012-auditoria.test.js` | Static + `test.todo` |
| RNF-013 CP-013-01: Chrome y Edge (>= 360px) sin errores de visualización | `RNF-013-navegadores.test.js` | Selenium |

## RNF omitidas (funcionalidad inexistente en el código)

Por decisión del equipo no se generaron pruebas para criterios cuya
funcionalidad aún no existe en el código, para evitar tests que fallan por
ausencia de implementación:

| Criterio | Motivo |
|----------|--------|
| RNF-004 CP-004-01 (middleware de contención: fuerza bruta / SQLi / cuarentena) | No existe middleware de rate-limit ni de detección de inyección SQL |
| RNF-006 CP-006-01 (despliegue por contenedores en múltiples entornos) | No hay Dockerfile / docker-compose en el proyecto |
| RNF-011 CP-011-01 (recuperación ante fallos de BD, RTO <= 30 min, RPO <= 1 h) | No hay scripts de backup/restore |

## Notas de evidencia

- **RNF-002-03**: la vista se actualiza al consultar/recargar (no hay push en
  tiempo real vía sockets); la prueba verifica la propagación del estado por API.
- **RNF-010**: se usa una muestra automatizada (20 Cloudinary / 5 SMTP); la
  corrida oficial de 1 000 peticiones es manual. El mecanismo de reintentos
  ante fallos temporales no está implementado (`test.todo`).
- **RNF-008-01**: la documentación de la API se verifica con la colección
  **Postman** (`postman/*.json`); Swagger no está implementado en el proyecto.
  Las métricas de duplicación y complejidad ciclomática son heurísticas de
  análisis estático (complemento local de SonarQube).
- **RNF-012**: solo existe auditoría de cambios de stock (`historial_stock` +
  triggers). Registro, inicio de sesión, pedidos, comprobantes y perfil están
  pendientes (se listan como `test.todo`).
- **RNF-009**: la corrida oficial de 24 h se ejecuta con
  `RNF_SOAK_MINUTOS=1440 npx jest backend/__tests__/RNF/RNF-009-operacion-continua.test.js`.
  La ejecución predeterminada es un smoke de 0.5 min.
- **RNF-007**: requiere `RNF_LOAD=1` y un catálogo cercano a 5 000 productos
  para el escenario completo; el test reporta la degradación real por etapa.
- **Datos**: algunos tests live mutan la BD (crean pedidos, ajustan stock o
  estados). Para restablecer el estado inicial ejecuta nuevamente
  `DB/Schema.sql`, `DB/Triggers.sql` y `DB/Seed.sql`.