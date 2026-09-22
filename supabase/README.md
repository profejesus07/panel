# Supabase — Panel Escolar

Este directorio contiene todo lo relacionado con el backend de Supabase: migraciones SQL versionadas, datos de prueba y notas de configuración.

## Estructura

```text
supabase/
├── migrations/   # Migraciones SQL versionadas (una por cambio de esquema)
├── seed.sql      # Datos de prueba opcionales para desarrollo/demo
└── README.md     # Este archivo
```

## Estado actual

El esquema de base de datos (tablas, relaciones, RLS, Storage) se implementa en la **Fase 2** del proyecto y se documentará en detalle aquí una vez creado: modelo de datos, políticas de seguridad por rol y pasos para aplicar las migraciones contra un proyecto Supabase real.

## Cómo se gestionarán las migraciones

Cada cambio de esquema se agrega como un nuevo archivo en `migrations/` con el formato `NNNN_descripcion.sql`, nunca modificando una migración ya aplicada. Esto permite reconstruir la base de datos desde cero de forma reproducible, tanto en local (Supabase CLI) como en el proyecto de producción.
