# Roadmap de producto fitness

## Objetivo

Fortalecer el ciclo principal de PRTracker:

**Planificar → ejecutar → evaluar → ajustar**

El roadmap cubre las funciones de prioridad alta y media acordadas. Cada fase debe entregarse como un cambio independiente, con su propia migración, políticas RLS, pruebas y verificación.

## Orden de implementación

| Fase | Alcance | Tamaño relativo |
| --- | --- | --- |
| 0 | Calidad, tipos y contratos base | S |
| 1 | Versionado inmutable de planes | L |
| 2 | RIR/RPE, tipos de set y notas técnicas | L |
| 3 | Finalización y feedback de sesión | M |
| 4 | Historial por ejercicio | M |
| 5 | Progresión automática configurable | L |
| 6 | Calendario y adherencia | L |
| 7 | Sustituciones de ejercicios | M |
| 8 | Integración final en dashboards | M |

Aunque el versionado se clasificó inicialmente como prioridad media, debe preceder al historial y la progresión. Actualmente guardar un plan elimina y recrea sus ejercicios; una sesión histórica necesita conservar exactamente la versión que se ejecutó.

## Fase 0 — Preparación técnica

- Generar tipos TypeScript desde el esquema remoto de Supabase.
- Corregir el baseline de lint en los clientes de Supabase y el middleware.
- Configurar Vitest y React Testing Library.
- Documentar escalas de esfuerzo, energía y molestia.
- Normalizar pesos en kilogramos en la persistencia.
- Mantener Playwright fuera de esta fase; se evaluará cuando existan flujos multirol estables.

### Estado

- [x] Baseline de lint corregido.
- [x] Vitest y React Testing Library configurados.
- [x] Contratos de escalas y peso documentados y probados.
- [x] Generador seguro de tipos agregado mediante `npm run db:types`.
- [x] Repositorio vinculado al proyecto remoto y `src/types/database.ts` generado.

## Fase 1 — Versionado inmutable de planes

Mantener `routines` como una versión concreta y agregar `plan_id`, `version_number`, `status`, `published_at` y `supersedes_routine_id`.

Los planes existentes se convierten en versión 1. Un borrador puede editarse; un plan publicado queda inmutable. Editar una versión publicada crea un nuevo borrador y las sesiones pasadas siguen apuntando al `routine_id` que ejecutaron.

Funciones previstas: `save_routine_draft`, `clone_routine_version` y `publish_routine_version`. No se permitirá eliminar un plan con sesiones asociadas.

### Estado

- [x] Migración aditiva con `plan_id`, número de versión, estado, fecha de publicación y relación con la versión anterior.
- [x] Backfill de los planes existentes como versión publicada 1.
- [x] Borradores editables; versiones publicadas y archivadas inmutables mediante trigger de base de datos.
- [x] Acciones de crear borrador, publicar, archivar y clonar versión.
- [x] Cliente restringido a iniciar exclusivamente versiones publicadas activas.
- [x] Migración aplicada y verificada contra el proyecto remoto.

## Fase 2 — Datos reales de entrenamiento

Agregar a los sets planificados rango de repeticiones, RIR o RPE objetivo, tipo de set, tempo e indicador de set opcional. Tipos iniciales: calentamiento, aproximación, trabajo, drop set y AMRAP.

Los sets ejecutados deben separar valores planificados y reales e incluir RIR/RPE real, notas y motivo de incumplimiento. El trainer elegirá una escala principal para que el cliente solo registre una durante la sesión.

Las indicaciones específicas vivirán en `routine_exercises`; las permanentes de un cliente para un ejercicio vivirán en una relación trainer–cliente–ejercicio.

### Estado

- [x] Rango de repeticiones, RIR/RPE objetivo, tipo de set, tempo y opcionalidad en sets planificados.
- [x] Snapshot de prescripción y valores reales, esfuerzo, notas y motivo de ajuste en sets ejecutados.
- [x] Escala única RIR o RPE definida por cada plan y respetada por el runner del cliente.
- [x] Indicaciones por rutina y notas persistentes trainer–cliente–ejercicio protegidas con RLS.
- [x] Migración aplicada al proyecto remoto, tipos regenerados y contrato cubierto por pruebas unitarias.

## Fase 3 — Finalización y feedback

### Estado

- [x] Estados de sesión, inicio, fin y duración registrados en `workout_sessions`.
- [x] Cierre transaccional: solo se completa cuando todos los sets están marcados y una sesión cerrada no puede alterarse.
- [x] Feedback opcional de energía, RPE, molestias y nota del cliente, separado de los mensajes trainer-cliente.
- [x] Tabla de mensajes preparada con RLS para ambos participantes de una asignación activa.
- [x] Interfaz de sesión actualizada para completar o abandonar, con feedback accesible y sin bloquear el cierre.
- [x] Migración `20260831005326_add_session_completion_and_feedback.sql` aplicada y tipos regenerados.

Agregar a `workout_sessions` los estados `in_progress`, `completed` y `abandoned`, además de fechas de inicio y finalización y duración.

Crear feedback con energía previa, RPE general, nivel y descripción opcional de molestias y nota del cliente. Los mensajes entre trainer y cliente se almacenarán aparte del feedback cuantitativo. El feedback opcional nunca debe bloquear el cierre.

## Fase 4 — Historial por ejercicio

### Estado

- [x] Historial disponible para client y trainer, limitado por las políticas RLS de cliente propio o asignación activa.
- [x] Directorio de ejercicios con sesiones finalizadas, volumen de trabajo, carga máxima y 1RM estimado.
- [x] Detalle paginado por sesiones, sets, RIR/RPE, calentamientos visibles y excluidos del volumen principal.
- [x] Mejores sets por rango de repeticiones, comparación con la sesión anterior y gráfico reutilizando el componente SVG existente.
- [x] Índice parcial por ejercicio y set completado; consultas de lectura con `SECURITY INVOKER` y sin acceso `anon`.
- [x] Migración `20260831022255_add_exercise_history_queries.sql` aplicada y tipos regenerados.

Crear vistas para cliente y trainer con sesiones anteriores, mejor peso, mejor set por rango de repeticiones, volumen, estimación de 1RM con fórmula visible, RIR/RPE histórico y comparación con la sesión anterior.

Los calentamientos quedarán excluidos del volumen principal por defecto. Las consultas serán paginadas e indexadas por cliente, ejercicio y fecha. El gráfico SVG existente se extraerá como componente reutilizable.

## Fase 5 — Progresión configurable

### Estado

- [x] Reglas por bloque de ejercicio: progresión doble, incremento fijo y control manual.
- [x] Configuración de incremento, sesiones exitosas, esfuerzo objetivo, deload por fallos y reducción porcentual.
- [x] Sugerencias auditables con estrategia, motivo, valores propuestos y estado pendiente/aplicada/descartada.
- [x] Aplicación transaccional exclusiva sobre el borrador más reciente del mismo plan; nunca modifica una rutina publicada.
- [x] Reglas copiadas al clonar una versión y RLS reforzado para validar rutina, bloque, cliente y trainer.
- [x] Migraciones `20260831024115_add_routine_progressions.sql` y `20260831024542_tighten_progression_rls.sql` aplicadas; tipos regenerados.

Primera entrega: progresión doble, incremento fijo y control manual. Las reglas definirán incremento, sesiones exitosas requeridas, esfuerzo objetivo y reducción opcional tras fallos.

El resultado será una sugerencia auditable. Nunca modificará automáticamente un plan publicado; al aceptarla se aplicará al siguiente borrador.

## Fase 6 — Calendario y adherencia

### Estado

- [x] Sesiones programadas con estados programada, completada, omitida, reprogramada y cancelada.
- [x] Trainer programa sesiones concretas desde rutinas publicadas; cliente puede iniciar u omitir las propias.
- [x] Una sesión real vinculada actualiza automáticamente el evento programado al completarse.
- [x] Calendario del cliente con adherencia transparente: sesiones completadas/elegibles y sets registrados.
- [x] Sesiones futuras y canceladas excluidas del denominador de adherencia.
- [x] Migración `20260831024844_add_scheduled_workouts.sql` aplicada y tipos regenerados.

Crear programación semanal y sesiones programadas con estados programada, completada, omitida, reprogramada y cancelada.

La adherencia se mostrará como `sesiones completadas / sesiones elegibles`. Las sesiones futuras y canceladas no entran en el denominador. También se mostrarán sets previstos frente a completados, sin puntuaciones opacas.

## Fase 7 — Sustituciones

El trainer podrá definir alternativas autorizadas. El cliente solo podrá elegir esas alternativas y el cambio afectará únicamente sets pendientes.

Cada set conservará el ejercicio previsto, el ejecutado y la sustitución seleccionada. Una función transaccional validará la alternativa y la relación trainer–cliente.

## Fase 8 — Integración en dashboards

El trainer verá próxima sesión, adherencia, último entrenamiento, feedback, molestias, progresiones pendientes y versión activa. El cliente verá próxima sesión, calendario, historial, progresiones aceptadas y feedback.

El administrador conservará acceso operativo a cuentas y asignaciones, pero no a comentarios, esfuerzo o molestias.

## Seguridad y migraciones

- No modificar migraciones aplicadas.
- Crear una migración nueva por fase.
- Habilitar RLS al crear cada tabla.
- Cliente: únicamente sus propios datos.
- Trainer: únicamente clientes para los que `is_active_trainer_of()` sea verdadero.
- Administrador: mínimo privilegio e información operativa.
- Funciones con `security invoker` salvo justificación explícita.
- Políticas de actualización con `USING` y `WITH CHECK`.
- Grants explícitos para tablas expuestas al Data API.

## Verificación por fase

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

Las fases con datos también deben probar una base local limpia, regenerar tipos y validar cliente propio, cliente ajeno, trainer activo y trainer no asignado.
