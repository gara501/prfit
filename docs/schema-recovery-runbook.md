# Runbook: snapshot y recuperación del schema

Este procedimiento corresponde a la Fase 0 del plan de preparación para
producción. Se ejecuta desde la raíz de PRTracker, donde el proyecto de
Supabase ya está vinculado.

## Qué respalda este procedimiento

El snapshot de schema público contiene tablas, funciones, políticas RLS,
índices, constraints y grants de `public`. No incluye:

- usuarios de `auth.users`;
- datos personales ni sesiones;
- archivos de Storage;
- secretos, claves o variables de entorno.

Es un artefacto para recuperación del esquema y para preparar el
re-baselining, no un backup integral de datos de producción.

## Dónde guardar el snapshot

Guárdalo fuera del repositorio y fuera de una carpeta sincronizada sin
cifrado. Por ejemplo, en un disco cifrado:

```powershell
$backupRoot = "D:\PRTracker-backups"
New-Item -ItemType Directory -Force -Path $backupRoot
```

No uses `docs`, `supabase/migrations` ni ninguna ruta dentro del repositorio.
No subas el archivo resultante a Git.

## Crear el snapshot del schema

Desde `T:\CODE\JSProjects\cardonafit`, ejecuta:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
npm exec -- supabase db dump --linked --schema public --file "$backupRoot\prtracker-public-schema-$stamp.sql"
```

No añadas `--dry-run`: ese modo puede mostrar una credencial temporal de
conexión en el terminal. Tampoco copies el output del comando a tickets,
chats o documentos.

Comprueba que se creó un archivo no vacío:

```powershell
Get-Item "$backupRoot\prtracker-public-schema-$stamp.sql" |
  Select-Object FullName, Length, LastWriteTime
```

## Comprobar el estado antes y después

```powershell
npm exec -- supabase migration list --linked
npm exec -- supabase db advisors --linked --type all --level info
npm run db:types
```

Conserva la salida únicamente en el historial local de trabajo; no contiene un
backup de datos y no sustituye la política de backups/PITR del proyecto.

## Restauración de prueba

Nunca restaures este snapshot sobre el proyecto actual de PRTracker.

Para validarlo se necesita un proyecto Supabase de prueba separado. En la fase
de re-baselining se creará una cadena nueva y reproducible de schema en ese
entorno, se restaurará allí el snapshot y se comprobarán tablas, políticas,
funciones y `npm run db:types` antes de tocar producción.

El proyecto actual conserva sus migraciones aplicadas; no se editarán ni se
insertará un snapshot como una migración nueva al final de la cadena. Esa
estrategia haría que una base vacía fallara antes de llegar al snapshot.
