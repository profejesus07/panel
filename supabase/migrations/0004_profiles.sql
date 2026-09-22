-- Perfil de aplicación asociado 1:1 a auth.users. La creación de usuarios
-- (auth.users + profiles) la realiza siempre una Edge Function con
-- privilegios de servicio, nunca el cliente: por eso aquí no hay un
-- trigger que autocree filas en profiles al insertar en auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos de aplicación y rol de cada usuario autenticado.';

create index profiles_role_idx on public.profiles (role);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
