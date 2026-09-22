# Supabase — Panel Escolar

Backend de Panel Escolar: base de datos PostgreSQL, autenticación, Row Level Security (RLS) y Storage, todo gestionado por Supabase.

- **Proyecto:** `panel-escolar` (`ycajreajzzxsbmeuogux`, región `us-east-1`)
- **Panel del proyecto:** https://supabase.com/dashboard/project/ycajreajzzxsbmeuogux

## Estructura

```text
supabase/
├── migrations/       # Migraciones SQL versionadas (una por cambio de esquema), 0001 → 0020
├── functions/
│   └── create-user/  # Edge Function: crea la cuenta de acceso de un estudiante/padre
├── seed.sql          # Catálogo de asignaturas (datos de referencia, no personas)
└── README.md         # Este archivo
```

Cada cambio de esquema se agrega como un **nuevo** archivo `NNNN_descripcion.sql`; nunca se edita una migración ya aplicada. Así la base de datos siempre se puede reconstruir desde cero de forma reproducible.

## Modelo de datos

| Tabla | Contenido |
| --- | --- |
| `school_settings` | Configuración institucional (nombre, escudo, NIT, año lectivo...). Una única fila con `is_active = true`. |
| `profiles` | Rol y datos de aplicación de cada usuario autenticado (1:1 con `auth.users`). |
| `courses` | Cursos/grupos por grado, jornada y año lectivo. |
| `students` | Estudiantes matriculados. `user_id` es nulo hasta que se les crea cuenta de acceso. |
| `guardians` | Padres, madres, tutores o acudientes (personas). |
| `student_guardians` | Relación N:M estudiante↔responsable, con parentesco y acudiente principal. |
| `subjects` | Catálogo de asignaturas. |
| `academic_periods` | Períodos académicos (bimestres/trimestres) por año lectivo. |
| `grades` | Una calificación por estudiante + asignatura + período. |
| `attendance` | Un registro de asistencia por estudiante y día. |
| `absence_justifications` | Solicitudes de justificación de inasistencia (padre/estudiante → admin). |
| `behavior_records` | Convivencia: observaciones, reconocimientos, compromisos, seguimiento. |
| `official_records` | Actas institucionales, con audiencia (todos/estudiantes/padres/curso/estudiante). |
| `announcements` | Anuncios institucionales, con la misma lógica de audiencia. |

No existe ninguna tabla ni columna relacionada con un rol "docente": está fuera de alcance por diseño.

### Funciones auxiliares (`0015_auth_helper_functions.sql`)

Funciones `SECURITY DEFINER`, de solo lectura, usadas dentro de las políticas RLS:

- `current_role()` / `is_admin()` — rol del usuario autenticado.
- `my_student_id()` — el estudiante propio (si el usuario es un estudiante).
- `my_student_ids()` — los estudiantes asociados al padre/acudiente autenticado.
- `can_access_student(id)` — true si el usuario es admin, es ese estudiante, o es su padre/acudiente.
- `can_view_by_audience(audience, course_id, student_id)` — regla de visibilidad compartida por anuncios y actas.
- `safe_uuid(text)` — conversión a `uuid` que nunca lanza excepción (usada en políticas de Storage basadas en rutas).

### RPCs (`0017_justification_approval_rpc.sql`)

- `approve_justification(id, notas)` — solo admin. Aprueba la justificación y refleja automáticamente `justificado` en la asistencia del día correspondiente.
- `reject_justification(id, notas)` — solo admin. Rechaza la justificación.

### Edge Function `create-user` (`supabase/functions/create-user/`)

Único lugar del sistema donde se usa la `service_role key`, y solo dentro de este entorno de servidor (nunca en el frontend). El admin la invoca desde el botón "Crear acceso" en Estudiantes/Padres para dar de alta la cuenta de acceso de un registro que ya existe como dato:

1. Verifica que quien llama esté autenticado y tenga `role = 'admin'` en `profiles` (si no, responde `success: false` sin tocar `auth.users`).
2. Crea el usuario en `auth.users` (con `email_confirm: true`, ya que el admin lo está vouching).
3. Crea su fila en `profiles` con el rol correspondiente.
4. Vincula `students.user_id` o `guardians.user_id` al nuevo usuario.
5. Si el paso 3 falla, revierte el usuario creado en el paso 2 (no deja cuentas huérfanas).

Redesplegar tras un cambio: `mcp__supabase__deploy_edge_function` con `project_id = ycajreajzzxsbmeuogux`, `name = create-user`, `verify_jwt = true`.

## Seguridad (RLS)

Todas las tablas tienen RLS habilitado (`0016_row_level_security.sql`, afinado en `0019`/`0020`). Regla general:

- **admin**: acceso total (lectura y escritura) a todo el sistema.
- **estudiante**: solo lectura de su propia información (`students.user_id = auth.uid()` y todo lo que cuelga de ese `student_id`).
- **padre**: solo lectura de la información de los estudiantes asociados a su cuenta vía `student_guardians`.
- Catálogos sin datos sensibles (`courses`, `subjects`, `academic_periods`, `school_settings`) son de lectura para cualquier usuario autenticado (y `school_settings` también para `anon`, porque el login necesita mostrar el nombre/escudo del colegio antes de iniciar sesión).
- Ningún padre puede ver estudiantes de otro padre, ni un estudiante ver a otro: se verifica con `get_advisors` (linter de seguridad de Supabase) sin hallazgos pendientes tras `0019`.

La seguridad **no depende de React**: aunque el frontend oculte botones, cualquier intento de leer o escribir datos ajenos es rechazado por Postgres.

## Storage

| Bucket | Público | Contenido | Acceso |
| --- | --- | --- | --- |
| `institucion` | Sí (solo lectura) | Escudo/logo del colegio | Todos leen; solo admin escribe |
| `anuncios` | Sí (solo lectura) | Imágenes de anuncios | Todos leen; solo admin escribe |
| `justificaciones` | No | Adjuntos de justificaciones | Admin total; estudiante/padre solo en la carpeta `{student_id}/` de un estudiante al que tengan acceso |
| `actas` | No | Documentos de actas | Admin total; lectura en `{student_id}/` (propio) o `institucional/` (todas las actas de audiencia general) |
| `boletines` | No | Boletines generados en PDF | Admin total; lectura en `{student_id}/` propio |

## Creación del administrador inicial

No existe registro público: **todas** las cuentas las crea el administrador. Para el primer administrador, que aún no existe (no lo puede crear la Edge Function porque hace falta un admin para invocarla — es el único caso que se hace a mano):

1. En el [Dashboard de Supabase](https://supabase.com/dashboard/project/ycajreajzzxsbmeuogux/auth/users) → **Authentication → Users → Add user**, crea tu usuario con tu correo y una contraseña.
2. Pide que te asignen el rol `admin` en `profiles` para ese usuario (una sola vez).

A partir de ahí, todas las demás cuentas (estudiantes y padres) se crean desde la aplicación: en **Estudiantes** o **Padres y acudientes**, el registro sin acceso muestra la acción "Crear acceso", que invoca la Edge Function `create-user` descrita arriba.

## Variables de entorno

Ver [`.env.example`](../.env.example) en la raíz del proyecto. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de este proyecto están documentadas ahí; los valores reales viven únicamente en `.env` (no versionado).
