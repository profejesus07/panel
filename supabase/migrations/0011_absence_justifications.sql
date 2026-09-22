create table public.absence_justifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  submitted_by uuid not null references auth.users (id) on delete cascade,
  absence_date date not null,
  reason text not null,
  description text,
  attachment_url text,
  status public.justification_status not null default 'pendiente',
  reviewed_by uuid references auth.users (id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.absence_justifications is 'Solicitudes de justificación de inasistencia enviadas por padre o estudiante.';

create index absence_justifications_student_id_idx on public.absence_justifications (student_id);
create index absence_justifications_status_idx on public.absence_justifications (status);
