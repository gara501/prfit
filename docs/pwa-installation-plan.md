# Plan de instalación móvil PWA — PRFit

## Objetivo

Permitir que trainers y clientes instalen PRFit desde el navegador en sus
celulares y escritorio, con ícono propio y experiencia `standalone`, sin crear
una aplicación nativa ni depender inicialmente de una tienda de aplicaciones.

La primera entrega prioriza instalación, rapidez y seguridad. El entrenamiento
con escritura completamente offline queda para una fase posterior.

## Estado de implementación

Implementado el 7 de septiembre de 2026:

- Manifiesto web de PRFit con experiencia `standalone` e íconos de 192×192,
  512×512 y `maskable` generados como PNG.
- Metadatos e ícono de Apple para instalación desde Safari.
- Registro de service worker con caché limitada a recursos públicos y pantalla
  offline.
- Control de instalación para Chromium e instrucciones para Safari iOS.
- Indicador de falta de conexión durante el entrenamiento.
- Limpieza de los cachés propios de PRFit antes de cerrar sesión.

Pendiente: persistencia y sincronización de sets en modo completamente offline.

## Alcance de la primera entrega

### Instalación

1. Crear `src/app/manifest.ts` con:
   - `name` y `short_name`: PRFit.
   - descripción de producto.
   - `start_url: "/"` y `scope: "/"`.
   - `display: "standalone"`.
   - colores de tema y fondo basados en los tokens visuales de PRFit.
   - íconos PNG de 192×192 y 512×512, incluyendo variante `maskable`.
2. Añadir el ícono específico para Apple y actualizar los metadatos globales
   para que el nombre e íconos sean consistentes.
3. Crear un componente de instalación accesible:
   - En navegadores Chromium, usar `beforeinstallprompt` cuando esté disponible.
   - En iOS/Safari, mostrar instrucciones breves para “Compartir → Añadir a
     pantalla de inicio”.
   - No volver a mostrar el aviso si la app ya está instalada o el usuario lo
     descartó recientemente.

### Conectividad y caché seguro

1. Registrar un service worker pequeño y mantenido dentro del proyecto.
2. Cachear exclusivamente recursos públicos y versionados:
   - shell visual;
   - fuentes;
   - logo, íconos y otras imágenes públicas.
3. Mostrar una pantalla de conexión no disponible cuando no haya red.
4. Añadir un indicador visible de conectividad en el runner de entrenamiento.

## Exclusiones deliberadas

No se cachearán en el service worker ni en Cache Storage:

- páginas autenticadas de `/client`, `/trainer` o `/admin`;
- respuestas de Supabase;
- mensajes trainer–cliente;
- evaluaciones de salud, documentos médicos o notas privadas;
- tokens de autenticación.

No se implementará escritura offline en la primera entrega. Una sesión de
entrenamiento requerirá conexión para confirmar sus cambios en Supabase.

## Fase posterior: entrenamiento offline

Sólo se iniciará tras validar la necesidad con usuarios reales. Requiere:

1. Persistir cambios de sets de la sesión activa en IndexedDB.
2. Cola de sincronización con identificadores idempotentes.
3. Estados inequívocos: “guardado localmente”, “sincronizando” y
   “sincronizado”.
4. Resolución de conflictos cuando el mismo entrenamiento cambie desde otro
   dispositivo.
5. Limpieza de la cola y de cualquier caché privada al cerrar sesión.

## Seguridad

- Producción debe servirse únicamente por HTTPS.
- La sesión seguirá usando el mecanismo actual de Supabase; la PWA no debe
  duplicar ni mover tokens a otro almacenamiento.
- Al cerrar sesión se eliminarán los cachés propios de la PWA y cualquier dato
  local de la sesión activa.
- La instalación no evita la autenticación: abrir PRFit instalado debe respetar
  las mismas protecciones de rutas y roles que el sitio web.

## Criterios de aceptación

### Android y Chrome

- PRFit cumple los criterios de instalación y puede añadirse a la pantalla de
  inicio.
- Se abre sin controles visibles del navegador y usa el ícono de PRFit.

### iPhone y Safari

- Se muestran instrucciones de instalación comprensibles.
- El ícono y el nombre visible son correctos al añadirla a pantalla de inicio.

### Seguridad y calidad

- Logout elimina cachés y almacenamiento local propios de la PWA.
- Sin red, el usuario recibe una pantalla de estado clara en lugar de un error
  genérico del navegador.
- No se sirven datos autenticados desde caché tras cerrar sesión o cambiar de
  usuario.
- Se validará en 390×844, 768×1024 y 1440×900, además de Chrome Android y
  Safari iOS.

## Orden de implementación

1. Crear y revisar los íconos de aplicación.
2. Implementar manifiesto y metadatos de PRFit.
3. Añadir registro de service worker, cache público y pantalla offline.
4. Implementar el aviso de instalación y las instrucciones para iOS.
5. Añadir limpieza de caché en logout.
6. Probar instalación, actualización, logout y pérdida de conectividad en los
   dispositivos objetivo.
