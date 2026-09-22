create table public.school_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  nit text,
  address text,
  phone text,
  email text,
  website text,
  academic_year text not null,
  motto text,
  city text,
  state text,
  country text not null default 'Colombia',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.school_settings is 'Configuración institucional. Debe existir una única fila con is_active = true.';

-- Garantiza que solo exista una configuración institucional activa a la vez
create unique index school_settings_single_active
  on public.school_settings (is_active)
  where is_active;

create trigger set_updated_at
  before update on public.school_settings
  for each row execute function public.set_updated_at();
