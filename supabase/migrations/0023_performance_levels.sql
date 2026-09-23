-- Escala de valoración institucional usada para clasificar calificaciones
-- (bajo/básico/alto/superior). El slug identifica cada nivel de forma
-- estable (define su color en la interfaz); el nombre y el rango numérico
-- son editables desde Configuración.
create table public.performance_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  min_score numeric(5, 2) not null,
  max_score numeric(5, 2) not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_score <= max_score)
);

comment on table public.performance_levels is 'Escala de valoración editable (nombre y rango) usada para clasificar calificaciones.';

create trigger set_updated_at
  before update on public.performance_levels
  for each row execute function public.set_updated_at();

insert into public.performance_levels (slug, name, min_score, max_score, sort_order) values
  ('bajo', 'Bajo', 0, 6.9, 1),
  ('basico', 'Básico', 7, 7.9, 2),
  ('alto', 'Alto', 8, 8.9, 3),
  ('superior', 'Superior', 9, 10, 4);

alter table public.performance_levels enable row level security;

create policy "performance_levels_authenticated_select"
  on public.performance_levels for select
  to authenticated
  using (true);

create policy "performance_levels_admin_write"
  on public.performance_levels for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
