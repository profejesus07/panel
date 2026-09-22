# Panel Escolar

Sistema web de gestión y administración escolar: institución, estudiantes, padres/acudientes, cursos, calificaciones, asistencia, justificaciones, convivencia, actas, anuncios y boletines — con tres roles (**administrador**, **estudiante**, **padre**) y seguridad basada en Row Level Security de PostgreSQL.

> **Estado del proyecto:** funcionalmente completo (Fases 1–6). Solo falta la Fase 7 (publicar en GitHub y desplegar a producción), que requiere una acción tuya. Ver [Estado actual](#estado-actual).

## Tabla de contenido

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Configuración de Supabase](#configuración-de-supabase)
- [Ejecución local](#ejecución-local)
- [Migraciones y seed](#migraciones-y-seed)
- [Git y GitHub](#git-y-github)
- [Despliegue](#despliegue)
- [Estado actual](#estado-actual)
- [Solución de problemas](#solución-de-problemas)

## Arquitectura

Aplicación SPA (Single Page Application) en React que se conecta directamente a Supabase (PostgreSQL + Auth + Storage) desde el cliente. No existe un backend intermedio: toda la seguridad de acceso a datos se garantiza mediante **Row Level Security (RLS)** en la base de datos, no solo mediante la interfaz.

Roles del sistema:

- **admin** — control total del sistema (un único administrador).
- **estudiante** — acceso únicamente a su propia información académica.
- **padre** — acceso únicamente a la información de los estudiantes que tiene asociados.

No existe rol de docente: no está previsto en el alcance de este proyecto.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Ruteo | React Router v7 |
| Iconos | lucide-react |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Lint | ESLint (typescript-eslint) |
| CI | GitHub Actions |

## Estructura del proyecto

```text
panel-escolar/
├── .github/workflows/     # CI (lint + build en cada push)
├── public/                 # Estáticos (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── ui/              # Kit base reutilizable (Button, Card, Modal, Table, Tabs, ...)
│   │   ├── layout/           # Sidebar, Navbar
│   │   ├── admin/             # Widgets propios del admin (StudentPicker, AudienceFields, ...)
│   │   ├── portal/            # Vistas de solo lectura compartidas por ambos portales
│   │   └── shared/             # Compartido entre admin y portales (ReportCardPreview)
│   ├── layouts/             # AuthLayout, AdminLayout, PortalLayout
│   ├── pages/
│   │   ├── admin/            # 12 módulos de administración
│   │   ├── estudiante/       # Portal del estudiante (8 páginas)
│   │   ├── padre/            # Portal del padre/acudiente (8 páginas)
│   │   └── auth/              # Login, recuperación de contraseña
│   ├── hooks/                # Hooks reutilizables (useListQuery, useSimpleQuery, ...)
│   ├── services/             # Acceso a datos (Supabase) por dominio
│   ├── lib/                  # Cliente de Supabase
│   ├── types/                # Tipos TypeScript (incl. tipos generados de la BD)
│   ├── utils/                # Utilidades puras (validación, labels, errores, audiencia)
│   ├── contexts/             # Auth, Toast, Confirm, hijo activo (portal padre)
│   ├── routes/                # Definición de rutas, protección por rol, code-splitting
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/           # 21 migraciones SQL versionadas
│   ├── functions/
│   │   └── create-user/       # Edge Function: crea accesos de estudiante/padre
│   ├── seed.sql               # Catálogo de asignaturas
│   └── README.md
├── .env.example
└── README.md
```

## Instalación

Requisitos: Node.js 20+ y npm.

```bash
npm install
```

## Variables de entorno

Copia el archivo de ejemplo y complétalo con los datos de tu proyecto Supabase:

```bash
cp .env.example .env
```

| Variable | Descripción | ¿Pública? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (Project Settings → API) | Sí — segura para el frontend |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` del proyecto | Sí — el acceso real lo controla RLS, no esta clave |

**Nunca** se debe usar la `service_role key` de Supabase en el frontend: otorga acceso total a la base de datos saltándose RLS. Si en el futuro se necesita una operación con privilegios elevados, se implementa como función/RPC segura del lado de Supabase, nunca exponiendo esa clave en el cliente.

Sin estas variables, la aplicación compila y se ejecuta igualmente (útil para revisar la interfaz), pero el inicio de sesión mostrará un aviso indicando que Supabase no está configurado.

## Configuración de Supabase

El proyecto Supabase de Panel Escolar (`panel-escolar`, región `us-east-1`) ya existe y las 20 migraciones de `supabase/migrations/` ya están aplicadas contra él — no hace falta crear un proyecto nuevo ni volver a aplicarlas para empezar a desarrollar. Ver [`supabase/README.md`](supabase/README.md) para el detalle completo del modelo de datos, RLS y Storage.

Para trabajar localmente:

1. Copia `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a tu `.env` (pídeselas a quien tenga acceso al proyecto, o tómalas de *Supabase Dashboard → Project Settings → API*).
2. Crea tu usuario administrador inicial desde el Dashboard de Supabase (**Authentication → Users → Add user**) — no existe registro público, así que este es el único paso manual. Ver la sección "Creación del administrador inicial" en [`supabase/README.md`](supabase/README.md).
3. Si necesitas modificar el esquema, agrega una **nueva** migración en `supabase/migrations/` (nunca edites una ya aplicada) y aplícala contra el proyecto.

## Ejecución local

```bash
npm run dev       # servidor de desarrollo
npm run build      # build de producción (verifica tipos + compila)
npm run lint        # ESLint
npm run preview     # sirve el build de producción localmente
```

## Migraciones y seed

Las migraciones SQL versionadas viven en `supabase/migrations/` (21 archivos: esquema, RLS, funciones, Storage, ajustes de seguridad/rendimiento) y el catálogo de asignaturas en `supabase/seed.sql`. Ver [`supabase/README.md`](supabase/README.md) para el detalle completo.

## Git y GitHub

El proyecto se versiona con Git desde su inicialización, con commits pequeños y descriptivos (`feat:`, `fix:`, `perf:`, `chore:`, ...) — uno por módulo o unidad de trabajo coherente, nunca todo el proyecto junto. Archivos como `.env`, credenciales y claves nunca se incluyen en el repositorio (ver `.gitignore`).

**Repositorio:** https://github.com/profejesus07/panel (privado). CI en GitHub Actions (lint + build) corre en cada push a `main`.

## Despliegue

Se despliega en **Vercel** (recomendado para SPAs de React, y compatible con el repositorio privado sin costo — GitHub Pages gratuito solo funciona con repositorios públicos). Variables de entorno a configurar en el proveedor de hosting: las mismas de [Variables de entorno](#variables-de-entorno) (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — nunca la `service_role key`.

Para desplegar en Vercel: importa el repositorio desde [vercel.com/new](https://vercel.com/new), configura las dos variables de entorno anteriores, y Vercel detecta automáticamente que es un proyecto Vite (comando de build `npm run build`, carpeta de salida `dist`).

## Estado actual

**Fases 1–7: completadas.** El proyecto está publicado en GitHub y listo para desplegarse.

- **Fase 1 — Inicialización:** Vite + React 19 + TypeScript + Tailwind CSS v4 + ESLint, arquitectura de carpetas, CI en GitHub Actions.
- **Fase 2 — Supabase:** proyecto real (`panel-escolar`, `us-east-1`), 14 tablas normalizadas, RLS verificado con el linter de seguridad de Supabase (sin hallazgos pendientes), 5 buckets de Storage, RPCs de aprobación de justificaciones.
- **Fase 3 — Autenticación:** login, logout, recuperación de contraseña, contexto de sesión, rutas protegidas por sesión y por rol — verificado contra el proyecto real.
- **Fase 4 — Administración:** los 12 módulos completos (Institución, Estudiantes, Padres, Cursos, Configuración, Calificaciones, Asistencia, Justificaciones, Convivencia, Actas, Anuncios, Boletines), cada uno con CRUD, búsqueda, paginación y confirmación de acciones destructivas. Incluye la Edge Function `create-user` para que el admin cree accesos de estudiante/padre sin exponer la `service_role key`.
- **Fase 5 — Portales:** portal del estudiante (8 secciones) y portal del padre (8 secciones, con selector de hijo cuando tiene varios), ambos de solo lectura salvo el envío de justificaciones.
- **Fase 6 — Calidad:** responsive verificado en escritorio/móvil, estados de carga/vacíos/error en todas las páginas, code-splitting por rol (el bundle inicial bajó de 648 KB a un núcleo de 510 KB + fragmentos por página bajo demanda), revisión final de seguridad y rendimiento sin hallazgos pendientes.

**Pendiente — requiere que tú:**
1. Crees tu usuario administrador en el [Dashboard de Supabase](https://supabase.com/dashboard/project/ycajreajzzxsbmeuogux/auth/users) (ver [`supabase/README.md`](supabase/README.md)) — es el único paso manual que queda para poder usar la aplicación con datos reales.
2. Si quieres desplegar a producción, importes el repositorio en Vercel (ver [Despliegue](#despliegue)).

## Solución de problemas

**La app compila pero el login no funciona / aparece un aviso amarillo.**
Faltan las variables de entorno de Supabase. Verifica que exista un archivo `.env` (no solo `.env.example`) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` completos, y reinicia `npm run dev`.

**Cambié `.env` y no se refleja.**
Vite solo lee variables de entorno al iniciar el servidor de desarrollo: reinicia `npm run dev` después de modificar `.env`.

**Error de tipos al compilar (`npm run build`).**
Ejecuta `npm run lint` para más detalle y revisa que las importaciones usen el alias `@/` (equivalente a `src/`) definido en `vite.config.ts` y `tsconfig.app.json`.
