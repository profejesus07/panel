# Panel Escolar

Sistema web de gestión y administración escolar: institución, estudiantes, padres/acudientes, cursos, calificaciones, asistencia, justificaciones, convivencia, actas, anuncios y boletines — con tres roles (**administrador**, **estudiante**, **padre**) y seguridad basada en Row Level Security de PostgreSQL.

> **Estado del proyecto:** en desarrollo activo. Este README se actualiza al final de cada fase. Ver [Estado actual](#estado-actual) para el detalle de lo ya implementado.

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
├── .github/workflows/     # CI (lint + build); despliegue se agrega en fase de deploy
├── public/                 # Estáticos (favicon, etc.)
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes base reutilizables (Button, Card, Input, ...)
│   │   └── layout/           # Sidebar, Navbar
│   ├── layouts/             # AuthLayout, AdminLayout, PortalLayout
│   ├── pages/
│   │   ├── admin/            # Páginas del panel de administración
│   │   ├── estudiante/       # Páginas del portal del estudiante
│   │   ├── padre/            # Páginas del portal del padre/acudiente
│   │   └── auth/              # Login, recuperación de contraseña
│   ├── hooks/                # Hooks reutilizables
│   ├── services/             # Acceso a datos (Supabase) por dominio
│   ├── lib/                  # Cliente de Supabase
│   ├── types/                # Tipos TypeScript (incl. tipos generados de la BD)
│   ├── utils/                # Utilidades puras (validación, formateo, errores)
│   ├── contexts/             # Contexto de autenticación
│   ├── routes/                # Definición de rutas y protección por rol
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/           # Migraciones SQL versionadas
│   ├── seed.sql               # Datos de prueba para desarrollo
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

Las migraciones SQL versionadas viven en `supabase/migrations/` (20 archivos: esquema, RLS, funciones, Storage) y el catálogo de asignaturas en `supabase/seed.sql`. Ver [`supabase/README.md`](supabase/README.md) para el detalle completo.

## Git y GitHub

El proyecto se versiona con Git desde su inicialización, con commits pequeños y descriptivos (`feat:`, `fix:`, `chore:`, ...). Archivos como `.env`, credenciales y claves nunca se incluyen en el repositorio (ver `.gitignore`).

Para conectar el repositorio local con GitHub:

```bash
git remote add origin <url-de-tu-repositorio>
git branch -M main
git push -u origin main
```

## Despliegue

Preparado para desplegarse en **Vercel** (recomendado para SPAs de React) o **GitHub Pages**. La configuración de despliegue y los secrets de CI/CD se documentan aquí al completar esa fase del proyecto.

## Estado actual

**Fase 1 — Inicialización: completada.**

- Proyecto Vite + React + TypeScript + Tailwind CSS v4 configurado.
- ESLint configurado.
- Arquitectura de carpetas creada.
- Sistema de autenticación (contexto, rutas protegidas por sesión y por rol) implementado a nivel de frontend, listo para conectarse a Supabase Auth.
- Interfaz de login, layout administrativo con sidebar/navbar responsive, y dashboard inicial con estados vacíos.
- Esqueleto de navegación completo para los tres portales (admin/estudiante/padre) con las secciones que se irán habilitando fase a fase.
- CI en GitHub Actions (lint + build).

**Fase 2 — Supabase: completada.**

- Proyecto Supabase real creado y conectado (`panel-escolar`, `us-east-1`).
- 14 tablas con relaciones normalizadas, constraints e índices (ver [`supabase/README.md`](supabase/README.md)).
- Row Level Security habilitado y verificado en las 14 tablas: admin con acceso total, estudiante limitado a su propia información, padre limitado a sus estudiantes asociados — sin hallazgos pendientes en el linter de seguridad de Supabase.
- Storage configurado: 5 buckets (institución, anuncios, justificaciones, actas, boletines) con políticas por carpeta.
- RPCs `approve_justification` / `reject_justification` para aprobar/rechazar justificaciones de forma atómica.
- Tipos TypeScript (`src/types/database.types.ts`) generados desde el esquema real.
- Catálogo de asignaturas sembrado vía `supabase/seed.sql`.

**Pendiente** (fases siguientes): lógica completa de autenticación end-to-end (incluye crear el primer administrador — ver `supabase/README.md`), módulos de administración (estudiantes, padres, cursos, calificaciones, asistencia, justificaciones, convivencia, actas, anuncios, boletines), portales de estudiante y padre, y despliegue a producción.

## Solución de problemas

**La app compila pero el login no funciona / aparece un aviso amarillo.**
Faltan las variables de entorno de Supabase. Verifica que exista un archivo `.env` (no solo `.env.example`) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` completos, y reinicia `npm run dev`.

**Cambié `.env` y no se refleja.**
Vite solo lee variables de entorno al iniciar el servidor de desarrollo: reinicia `npm run dev` después de modificar `.env`.

**Error de tipos al compilar (`npm run build`).**
Ejecuta `npm run lint` para más detalle y revisa que las importaciones usen el alias `@/` (equivalente a `src/`) definido en `vite.config.ts` y `tsconfig.app.json`.
