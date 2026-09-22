create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  document_type public.document_type not null,
  document_number text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, document_number)
);

comment on table public.guardians is 'Padres, madres, tutores o acudientes. Una persona puede estar asociada a varios estudiantes.';

create index guardians_user_id_idx on public.guardians (user_id);

create trigger set_updated_at
  before update on public.guardians
  for each row execute function public.set_updated_at();

-- Relación N:M entre estudiantes y responsables, con parentesco y acudiente principal
create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  guardian_id uuid not null references public.guardians (id) on delete cascade,
  relationship public.guardian_relationship not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, guardian_id)
);

comment on table public.student_guardians is 'No asume una única estructura familiar: un estudiante puede tener varios responsables y viceversa.';

create index student_guardians_student_id_idx on public.student_guardians (student_id);
create index student_guardians_guardian_id_idx on public.student_guardians (guardian_id);

-- A lo sumo un acudiente principal por estudiante
create unique index student_guardians_one_primary
  on public.student_guardians (student_id)
  where is_primary;
