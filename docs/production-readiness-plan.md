# Plan de preparación para producción

## Objetivo

Llevar PRTracker a una beta segura y, después, a producción sin añadir nuevas
funciones de producto durante este trabajo. El orden es deliberado:

1. Contener riesgos de autorización y datos.
2. Endurecer Auth, RLS y funciones SQL.
3. Probar los flujos críticos con usuarios reales por rol.
4. Escalar consultas e índices con evidencia.
5. Configurar operación, recuperación y alertas.

## Estado inicial confirmado

- El proyecto Supabase vinculado y el repositorio tienen las mismas 17
  migraciones versionadas.
- `npm audit --omit=dev` no reporta vulnerabilidades conocidas en dependencias
  de producción.
- TypeScript, los 18 tests existentes y el build pasan.
- El asesor de Supabase reporta ocho advertencias de seguridad, incluida la
  protección contra contraseñas filtradas desactivada y funciones
  `SECURITY DEFINER` ejecutables desde el esquema `public`.
- El repositorio no contiene el baseline que crea las tablas y políticas
  principales: las migraciones actuales parten de un esquema ya existente.

## Fase 0 — Contención, evidencia y baseline

### Progreso

- [x] Proyecto remoto vinculado y 17 migraciones locales/remotas coincidentes.
- [x] Auditoría inicial de seguridad y rendimiento obtenida desde Supabase.
- [x] Auditoría de dependencias de producción sin vulnerabilidades conocidas.
- [x] Método de snapshot del schema identificado mediante el CLI.
- [x] Confirmado: el alta pública de usuarios está desactivada.
- [ ] Diferido: protección contra contraseñas filtradas; requiere plan Pro.
- [ ] Ejecutar snapshot seguro del schema y comprobar su restauración aislada.
- [x] Estrategia de re-baselining aprobada antes de crear migraciones nuevas.

### Alcance

- Confirmar que el alta pública de usuarios esté desactivada. PRTracker usa
  aprovisionamiento por admin o trainer; no requiere registro público.
- Activar en Supabase Auth la protección contra contraseñas filtradas y
  registrar la política final de contraseñas.
- Inventariar roles existentes, perfiles inactivos y cuentas sin perfil válido.
- Guardar un snapshot recuperable del schema remoto, funciones, políticas RLS,
  grants y datos de referencia; no incluir secretos ni datos personales en Git.
- Definir y probar la estrategia de re-baselining en un proyecto aislado.

### Restricción importante

No se debe agregar una migración de baseline al final de la cadena actual: una
base de datos vacía fallaría al ejecutar las migraciones anteriores. La solución
debe ser un bootstrap reproducible o un re-baselining controlado, con el
proyecto remoto actual como fuente canónica y sin editar migraciones aplicadas.

El comando de dump debe ejecutarse sin `--dry-run` en una sesión no registrada:
su modo de simulación puede imprimir credenciales temporales de conexión. El
archivo resultante no se versiona ni se comparte; se cifra y guarda fuera del
repositorio siguiendo la política de backups.

### Criterios de salida

- Settings de Auth documentados y verificados.
- Inventario de usuarios y roles revisado sin exponer PII en el repositorio.
- Estrategia de recreación de entorno aprobada y probada fuera de producción.
- Evidencia actualizada de `migration list` y `db advisors`.

## Fase 1 — P0 de autorización y desactivación

- Crear una nueva migración que asigne siempre `client` desde
  `handle_new_user`; nunca derivar autorización de `raw_user_meta_data`.
- Ajustar las acciones de alta para asignar el rol solamente desde servidor
  privilegiado.
- Auditar y corregir perfiles con roles no legítimos.
- Convertir la desactivación en un proceso completo: estado de perfil,
  revocación/bloqueo de sesiones, asignaciones activas y denegación por RLS de
  todo acceso futuro.
- Centralizar la comprobación de cuenta activa para que todas las políticas
  apliquen la misma regla.

### Criterios de salida

- Un usuario no puede crear ni elevar su rol mediante metadata.
- Una cuenta inactiva no puede leer ni escribir mediante la Data API aunque
  conserve un JWT.
- Admin, trainer y client conservan únicamente los accesos esperados.

## Fase 2 — RLS y funciones SQL expuestas

- Inventariar las funciones `SECURITY DEFINER` y justificar cada una.
- Mover helpers internos al esquema `private` cuando sea posible.
- Revocar ejecución por defecto a `PUBLIC`, `anon` y `authenticated`.
- Conceder permisos mínimos por función y mantener `search_path` seguro.
- Preferir Server Actions autenticadas para operaciones administrativas.
- Consolidar políticas permisivas duplicadas sin reducir la seguridad.

### Criterios de salida

- Cero funciones ejecutables por `anon`.
- Funciones restantes cubiertas por pruebas de actor, rol y objeto objetivo.
- Ningún aviso de seguridad del advisor queda sin justificación documentada.

## Fase 3 — Onboarding y ciclo de vida de cuenta

- Sustituir contraseñas temporales confirmadas automáticamente por invitación o
  flujo de configuración de contraseña.
- Implementar recuperación de contraseña y cambio obligatorio de la contraseña
  inicial.
- Hacer compensable la creación de usuarios: no dejar cuentas Auth, perfiles o
  asignaciones parciales si una etapa falla.
- Configurar URLs de redirección por entorno y habilitar MFA para admins;
  recomendarlo o exigirlo para trainers según la operación.

## Fase 4 — Integridad y pruebas críticas

- Validar en base de datos que un entrenamiento programado corresponde a una
  rutina publicada, su trainer y client, y a un día con ejercicios.
- Hacer transaccional la generación y resolución de progresiones.
- Añadir pruebas de integración RLS con admin, dos trainers, dos clients y una
  cuenta inactiva.
- Añadir pruebas E2E para login, onboarding, rutina, sesión, abandono y cierre
  de entrenamiento. Evaluar `@playwright/test` solo en esta fase.

## Fase 5 — Rendimiento y escalabilidad

- Paginar usuarios admin, clientes trainer, rutinas y catálogo de ejercicios.
- Consultar el detalle del cliente bajo demanda en vez de descargar todo su
  historial desde el dashboard trainer.
- Reemplazar carga completa de historial de sets por agregados SQL y últimas N
  ejecuciones relevantes.
- Añadir índices según patrones observados y comprobar cada uno con
  `EXPLAIN ANALYZE`.
- Resolver avisos de FKs sin índice y revisar el coste de políticas RLS
  múltiples.

## Fase 6 — Operación y salida a producción

- Definir RPO/RTO y configurar backups/PITR según el plan de Supabase.
- Ejecutar una restauración de prueba fuera de producción.
- Configurar monitorización de errores, logs y alertas de Auth, RPC, base de
  datos, migraciones y disponibilidad.
- Añadir CI con npm: formato, lint, tipos, tests, build y, cuando existan,
  pruebas RLS/E2E.
- Migrar `middleware.ts` a `proxy` de Next.js.
- Documentar runbooks de alta/baja, rollback, restauración y rotación de
  secretos.

## Comandos de verificación

```powershell
npm exec -- supabase migration list --linked
npm exec -- supabase db advisors --linked --type all --level info
npm run db:types
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

## Hitos de publicación

- Beta cerrada: fases 0 a 4 completadas y pruebas críticas verdes.
- Producción pública: fases 0 a 6 completadas, restauración probada y alertas
  activas.
