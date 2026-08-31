# Configuración de onboarding en Supabase Auth

Antes de desplegar la fase 3, define `NEXT_PUBLIC_SITE_URL` en cada entorno.
No debe terminar en una barra; por ejemplo, `https://app.ejemplo.com`.

En **Authentication > URL Configuration** de Supabase, registra estas URLs:

- `https://app.ejemplo.com/auth/confirm?next=/auth/setup-password`
- `https://app.ejemplo.com/auth/confirm?next=/auth/reset-password`
- Para desarrollo: `http://localhost:3000/auth/confirm?next=/auth/*`

El dominio y los patrones deben ajustarse al dominio real del entorno. Supabase
ignora `redirectTo` cuando no coincide con la lista permitida.

En **Authentication > Email Templates**, revisa la plantilla **Invite user** y
la de recuperación de contraseña. En producción configura un SMTP propio: el
servicio de correo por defecto tiene límites y no ofrece garantía de entrega.

Una cuenta creada mediante la app recibe una invitación y queda con
`must_change_password = true` hasta guardar su contraseña desde el enlace.
Las cuentas existentes no se fuerzan a cambiarla por esta migración.
