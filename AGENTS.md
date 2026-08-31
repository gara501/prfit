# AGENTS.md

## Proyecto

App de control de rutinas de ejercicio, multi-usuario, con tres roles: **admin**, **trainer** (entrenador) y **client** (cliente). El admin crea cuentas de trainers y clients; un trainer también puede crear cuentas client desde su dashboard y quedan asignadas automáticamente a él. No hay auto-registro público. Un entrenador puede tener varios clientes y un cliente solo tiene un entrenador activo a la vez. El entrenador diseña rutinas y registra composición corporal; el cliente ejecuta las rutinas y registra sus sesiones de entrenamiento reales.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Postgres, RLS, Storage).

## Product direction

This is a serious workout tracking application.

The interface should feel:

- focused
- calm
- precise
- athletic without being aggressive
- modern without following short-lived trends
- optimized for frequent daily use

## Implementation rules

- Use TypeScript with strict typing.
- Use npm exclusively.
- Use existing shadcn/ui primitives before creating new primitives.
- Use semantic design tokens instead of hard-coded colors.
- Design mobile-first.
- Optimize active-workout flows for one-handed operation.
- Keep touch targets at least 44 by 44 pixels where practical.
- Use spacing and typography as the primary hierarchy mechanisms.
- Use one visually dominant primary action per view.
- Use Lucide icons consistently.
- Icons must communicate meaning, not serve as decoration.
- Every interactive component must support appropriate hover, focus,
  active, disabled, loading and error states.
- Preserve visible keyboard focus.
- Preserve WCAG AA color contrast.
- Prefer domain components such as WorkoutCard and ExerciseSetRow over
  generic wrappers with unclear purpose.
- Keep business logic out of visual primitives.
- Do not modify unrelated features during a UI task.

## Comandos

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- TypeScript: `npm run typecheck`
- Tests: `npm run test`
- Tests en watch: `npm run test:watch`
- Tipos de Supabase: `npm run db:types` (requiere proyecto vinculado o credenciales del CLI)

## Estructura del proyecto

```
src/
├── middleware.ts                       # valida la sesión y protege rutas privadas
├── app/
│   ├── (auth)/login/                   # inicio de sesión; no hay registro público
│   ├── admin/                          # administración de usuarios
│   ├── trainer/                        # área del entrenador
│   ├── client/                         # área del cliente
│   └── profile/                        # perfil del usuario autenticado
├── components/                         # componentes de UI reutilizables
├── hooks/                              # hooks personalizados
├── lib/
│   ├── auth/                           # autorización reutilizable por rol
│   └── supabase/
│       ├── client.ts                   # Client Components (publishable key)
│       ├── server.ts                   # Server Components/Actions (cookies)
│       ├── middleware.ts               # refresco y validación de sesión
│       └── admin.ts                    # auth.admin.*; secret key, solo servidor
└── types/
    └── database.ts                     # pendiente de generar con Supabase CLI
```

## UI design rules

- Treat shadcn/ui as source-owned accessible primitives, not as a visual theme. Its configuration lives in `components.json`, primitives live in `src/components/ui`, and shared class composition uses `cn()` from `src/lib/utils.ts`.
- Use an existing shadcn/ui primitive before creating a new primitive. Add only the individual component needed for the current feature; never run broad component generation or migration commands.
- Preserve the CardonaFit visual language: Nunito, Geist Mono, warm neutral surfaces, slate text, restrained orange emphasis and semantic green/red states. Do not ship default shadcn styling unchanged.
- Use semantic tokens from `src/app/globals.css` for colors, typography, spacing, radii, borders, focus rings and elevation. Do not introduce hard-coded colors in application components; data visualizations are the exception when a token cannot express the series meaning.
- Design mobile-first.
- Optimize active workout flows for one-handed interaction.
- Keep a consistent 4px spacing foundation.
- Prefer spacing and typography over shadows for hierarchy.
- Use one clear primary action per view.
- Every interactive component must support hover, focus, active,
  disabled and loading states.
- Use direct Lucide icon imports only; do not add another icon package or import from a Lucide barrel assembled inside the project.
- Icons must communicate meaning, not serve as decoration. Icon-only controls require an accessible name.
- Preserve Server Components by default. A shadcn primitive does not justify adding `"use client"`; add a client boundary only for state, browser APIs or event handling.
- Avoid nested cards unless the hierarchy genuinely requires them.
- Avoid generic motivational copy and invented user data.
- Do not add gradients, glassmorphism or decorative blobs.
- Do not redesign unrelated areas while implementing a feature.
- Check the result at mobile, tablet and desktop sizes.
- Preserve WCAG AA contrast, visible keyboard focus, visible form labels and logical focus order. Respect `prefers-reduced-motion`; workout controls should target at least 44x44 CSS pixels when space permits.
- Do not add Motion, Recharts, React Hook Form, Zod, Storybook or another UI system unless the feature has a documented need that the current stack cannot satisfy.

## Convenciones de código

- Componentes en PascalCase, archivos `.tsx`.
- Hooks personalizados empiezan con `use`.
- Server Component por defecto; solo agregar `"use client"` cuando el componente necesite hooks de estado, eventos, o interactividad.
- Nada de lógica de Supabase directo en componentes de UI: pasa por `lib/supabase` o por hooks en `hooks/`.
- Usar TypeScript estricto, evitar `any`. Tipar contra `types/database.ts`.
- Nombres de columnas y tablas en la base de datos: **snake_case** (convención de Postgres). El código TypeScript puede mapear a camelCase si se desea, pero el schema SQL siempre en snake_case.

## Base de datos (Supabase)

Tablas principales:
- `profiles` (extiende `auth.users`, incluye `role`: `admin` | `trainer` | `client`, `email`, `phone` y `birth_date`)
- `trainer_clients` (relación entrenador-cliente, solo un `is_active = true` por cliente)
- `body_zones`, `equipment`, `exercises` (catálogo, editable por cualquier entrenador), `exercise_body_zones`, `exercise_equipment`
- `routines`, `routine_exercises`, `routine_exercise_sets` (planificación, la escribe el entrenador)
- `workout_sessions`, `workout_session_sets` (ejecución real, la escribe el cliente; el entrenador solo lee)
- `body_compositions` (mediciones, las escribe y corrige solo el entrenador; el cliente solo lee)

Reglas importantes:
- RLS habilitado en **todas** las tablas desde el día 1. No desactivar RLS para "probar más rápido".
- Migraciones en `/supabase/migrations`, generadas con el CLI de Supabase. No editar el schema a mano en el dashboard sin después generar/sincronizar la migración correspondiente.
- Autenticación 100% delegada a `auth.users` de Supabase. Nunca crear una tabla propia de usuarios/contraseñas.
- Las funciones helper `is_active_trainer_of(client_id)` e `is_admin()` ya existen en la base de datos. Úsalas en políticas RLS nuevas en vez de repetir su lógica.
- `list_client_assignments()` devuelve al admin todos los clientes y al trainer solo sus clientes o los que están libres. `assign_client_to_trainer(client_id, trainer_id)` realiza el vínculo o la transferencia de forma transaccional: el admin puede transferir; un trainer solo puede asignarse clientes sin entrenador.
- `list_client_assignments()` solo revela email, teléfono y rutina activa al admin o al trainer que tenga el vínculo activo; los datos de contacto de clientes libres permanecen ocultos para otros trainers.
- `deactivate_user_profile(user_id)` permite al admin desactivar trainers o clients, impide desactivar admins o la cuenta propia y cierra sus vínculos activos en `trainer_clients` dentro de la misma transacción.
- `routines` representa una versión concreta de un plan. `plan_id` agrupa las versiones; `status` es `draft`, `published` o `archived`. Una versión publicada o archivada es inmutable.
- `save_routine_draft(...)`, `clone_routine_version(...)`, `publish_routine_version(...)` y `archive_routine_version(...)` gestionan el ciclo de vida en transacciones `SECURITY INVOKER`; el cliente normal conserva el contexto del usuario y todas las operaciones siguen sujetas a RLS.
- El CRUD de rutinas vive en `/trainer/routines`; solo los borradores se pueden editar o eliminar. Publicar un borrador archiva la versión publicada anterior del mismo `plan_id` en una sola operación.
- `routines` representa el plan semanal y `routine_exercises.day_number` identifica la rutina concreta de cada día (1–7). Todo día incluido en `days_at_week` debe contener al menos un ejercicio; el editor permite replicar un día completo en los demás.
- El dashboard `/trainer` reúne los clientes asignados, su ficha de actividad y progreso, y los accesos para crear rutinas o mediciones con el cliente preseleccionado. La creación de un client desde esta pantalla usa `auth.admin.createUser` solo en una Server Action, completa el profile y crea el vínculo activo con el trainer autenticado; si falla una etapa posterior, elimina la cuenta recién creada para no dejar usuarios huérfanos.
- `start_workout_session(routine_id, day_number)` solo permite iniciar versiones publicadas activas, crea o recupera la sesión pendiente de un día concreto y copia únicamente los ejercicios y series de ese día. `workout_sessions.day_number` conserva qué rutina diaria se ejecutó; `workout_session_sets.routine_exercise_id` conserva el bloque prescrito y usa `ON DELETE SET NULL` para no destruir el historial cuando el plan cambie.
- El runner de `/client/sessions/[sessionId]` usa el cliente de navegador con publishable key: actualiza sets de forma optimista y deja que RLS limite cada escritura a sesiones del cliente autenticado.
- El trainer registra y corrige controles corporales en `/trainer/measurements`. Sólo puede escribir mediciones de clientes asignados activamente y existe un único control por cliente y fecha.
- El dashboard `/client` combina rutinas, sesiones y el histórico RLS de `body_compositions`; los charts SVG no dependen de librerías externas.
- Las funciones `SECURITY DEFINER` deben fijar `SET search_path = public`.
- El trigger `handle_new_user` crea `profiles` desde `auth.users` y lee el rol de `raw_user_meta_data` durante la creación administrativa.

## Visual constraints

Avoid:

- purple or blue marketing gradients
- glassmorphism
- decorative background blobs
- excessive shadows
- excessive rounded cards
- cards nested inside cards
- unnecessary badges
- generic motivational copy
- arbitrary dashboard metrics
- oversized headings
- decorative icons
- animations without user value
- making every section visually identical
- centering all content
- fabricated user data

## Verification

For meaningful UI changes:

- run lint
- run type checking
- run relevant tests
- run the production build
- review at 390x844, 768x1024 and 1440x900
- check loading, empty, populated and error states
- check keyboard navigation
- report commands that could not be executed

## Qué NO debe hacer el agente

- No hardcodear URLs o keys de Supabase: deben venir de `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`).
- No usar `SUPABASE_SECRET_KEY` en código que llegue al navegador (Client Components) bajo ninguna circunstancia. El cliente de `admin.ts` solo se usa en servidor y únicamente cuando el cliente normal + RLS no puede resolver la operación.
- No hacer commits automáticos.
- No modificar migraciones ya aplicadas en `/supabase/migrations`; solo agregar nuevas.
- No desactivar RLS ni crear políticas `using (true)` como atajo, salvo que se discuta explícitamente por qué esa tabla debe ser pública.
- No mezclar cliente de servidor y cliente de navegador en el archivo equivocado (Server Component → `lib/supabase/server.ts`; Client Component → `lib/supabase/client.ts`).
