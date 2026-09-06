# CardonaFit

Aplicación web multiusuario para que entrenadores personales gestionen clientes,
planifiquen ciclos de entrenamiento y hagan seguimiento de la ejecución, el
progreso corporal y la aptitud preventiva para la actividad física.

## Stack

- Next.js 16 con App Router y React 19.
- TypeScript estricto.
- Tailwind CSS y componentes accesibles basados en shadcn/ui.
- Supabase Auth, Postgres, Row Level Security y Storage privado.
- Vitest, Testing Library y Biome.
- React PDF para documentos A4 y Archiver para paquetes ZIP por streaming.

## Roles y acceso

CardonaFit no tiene registro público. Las cuentas se crean administrativamente.

- **Admin:** crea, consulta y desactiva cuentas; administra trainers, clientes y
  asignaciones.
- **Trainer:** gestiona sus clientes activos, planificación, rutinas, mediciones,
  progreso e historial preventivo de salud.
- **Client:** consulta y ejecuta su planificación, registra entrenamientos y
  feedback, revisa su progreso y completa su evaluación preventiva.

Un cliente solo puede tener un trainer activo a la vez. Un trainer puede crear
clientes desde su dashboard y quedan vinculados automáticamente.

## Funcionalidades

### Administración y autenticación

- Inicio de sesión sin autorregistro, configuración inicial y recuperación de
  contraseña.
- Protección de rutas y autorización por rol.
- Creación, consulta y desactivación de cuentas.
- Directorio de trainers y clientes.
- Asignación o transferencia transaccional de clientes entre trainers.

### Clientes y seguimiento

- Dashboard del trainer con clientes asignados, actividad reciente y progreso.
- Ficha individual con contacto, edad, rutina vigente, sesiones y mediciones.
- Creación de clientes desde el dashboard del trainer.
- Accesos contextuales para rutinas, mediciones y revisión de salud.

### Catálogo y rutinas

- Catálogo compartido de ejercicios, zonas corporales y equipamiento.
- Creación y edición de ejercicios con enlaces de video.
- Plan semanal de uno a siete días, con replicación de días completos.
- Ejercicios, orden, series, repeticiones, peso, descanso, tempo y notas.
- Escalas RIR/RPE; series de calentamiento, aproximación, trabajo, drop set y
  AMRAP; métodos avanzados y series opcionales.
- Notas permanentes por cliente y ejercicio.
- Plantillas reutilizables.
- Versiones de rutina en borrador, publicadas o archivadas, con clonado,
  publicación transaccional e historial inmutable.
- Clasificación general de intensidad del 1 al 5.

### Periodización

- Planes por macroplan, mesociclos y microciclos semanales.
- Objetivo, calendario y fechas calculadas.
- Bloques de base, hipertrofia, fuerza, potencia, puesta a punto, recuperación o
  enfoque personalizado.
- Volumen e intensidad por bloque y semana.
- Semanas de carga, descarga, recuperación y evaluación.
- Vinculación de rutinas a microciclos.
- Activación y archivado, con un único plan activo por cliente.
- Protección de semanas que ya tienen rutinas vinculadas.

### Ejecución y calendario

- Inicio o recuperación de sesiones pendientes de rutinas publicadas.
- Runner móvil con actualización optimista de series.
- Registro real de carga, repeticiones y cumplimiento.
- Cierre con feedback de energía, esfuerzo, dolor y observaciones.
- Calendario de entrenamientos para trainer y cliente.
- Sustituciones de ejercicios preservando el historial original.

### Progreso y mediciones

- Historial de sesiones, comparaciones e historial por ejercicio.
- Reglas y sugerencias de progresión o descarga.
- Composición corporal por fecha: peso, estatura, porcentaje graso y perímetros.
- Gráficas SVG de evolución sin dependencias externas.

### Gamificación

- Racha semanal de cumplimiento, mejor racha y semana actual.
- Progreso hacia el siguiente nivel.
- Medallas propias de CardonaFit y galería de logros obtenidos o pendientes.

### Salud y aptitud preventiva

- Evaluación preventiva propia de CardonaFit, separada del PAR-Q+ oficial.
- Datos generales, contacto de emergencia y médico opcional.
- Filtro de señales cardiovasculares, metabólicas, articulares y de supervisión.
- Enfermedades, cirugías, lesiones, medicamentos y alergias.
- Embarazo, tabaquismo y nivel de actividad.
- Consentimiento para datos sensibles, declaración de veracidad y firma
  electrónica con fecha y huella del contenido.
- Versiones inmutables con vigencia de 12 meses.
- Revisión del trainer: apto, apto con restricciones o requiere autorización.
- Adjuntos PDF, JPG o PNG en Storage privado.
- Enlace al PAR-Q+ oficial sin copiar ni modificar su formulario.
- Bloqueo de intensidad 4–5 ante alertas críticas pendientes o vencidas.
- Cifrado AES-256-GCM, RLS y auditoría de envíos, revisiones y adjuntos.

La evaluación no diagnostica ni sustituye atención médica. Los textos legales
deben revisarse antes del uso comercial.

### Exportación y reportes

- PDF imprimible de cada versión de rutina, con planificación por día, series,
  intensidad, esfuerzo, tempo, métodos y notas.
- Constructor de reportes de progreso para el trainer, con rango de hasta 24
  meses, adherencia, sesiones, volumen, marcas, ejercicios destacados y
  evolución corporal.
- Modo anonimizado predeterminado para mostrar resultados sin revelar identidad,
  datos médicos ni texto libre.
- Reporte completo sujeto a confirmación de autorización del cliente.
- Descarga por el cliente de un ZIP con su perfil, rutinas, sesiones, series,
  feedback, mediciones, calendario, progresiones, logros, salud y adjuntos.
- Exportación administrativa para atender solicitudes formales de acceso.
- Generación temporal, respuesta `no-store`, límites de tamaño y rango, nombres
  de archivo normalizados y auditoría sin almacenar el contenido exportado.

## Configuración local

Requiere Node.js 22 o superior, npm y un proyecto Supabase.

```bash
npm install
```

Crea `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=TU_SECRET_KEY
MEDICAL_DATA_ENCRYPTION_KEY=UNA_CLAVE_ALEATORIA_DE_32_BYTES_EN_BASE64
```

Genera la clave médica localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

`SUPABASE_SECRET_KEY` y `MEDICAL_DATA_ENCRYPTION_KEY` son secretos exclusivos
del servidor. Nunca deben usar `NEXT_PUBLIC_`, llegar al navegador o subirse a
Git. Perder o cambiar la clave médica sin rotación deja ilegibles los registros.

```bash
npm run dev
```

Abre <http://localhost:3000>.

## Base de datos

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npm run db:types
```

Para comprobar migraciones sin aplicarlas:

```bash
npx supabase db push --dry-run
```

No desactives RLS ni edites una migración ya aplicada.

## Comandos

```bash
npm run dev         # desarrollo
npm run build       # build de producción
npm run lint        # análisis estático y formato
npm run typecheck   # TypeScript sin emitir archivos
npm run test        # pruebas
npm run test:watch  # pruebas en modo watch
npm run db:types    # tipos de Supabase
```

## Documentación adicional

- [Plan e implementación de periodización](docs/training-periodization-plan.md)
- [Evaluación preventiva de salud](docs/health-screening.md)
- [Exportación y reportes](docs/export-reports-plan.md)
