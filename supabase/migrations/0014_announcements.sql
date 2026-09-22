create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_url text,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  status public.announcement_status not null default 'publicado',
  audience public.audience_scope not null default 'todos',
  course_id uuid references public.courses (id) on delete set null,
  student_id uuid references public.students (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <> 'curso' or course_id is not null),
  check (audience <> 'estudiante' or student_id is not null),
  check (expires_at is null or expires_at > publish_at)
);

comment on table public.announcements is 'Anuncios institucionales filtrados por audiencia (todos/estudiantes/padres/curso/estudiante).';

create index announcements_status_idx on public.announcements (status);
create index announcements_audience_idx on public.announcements (audience);
create index announcements_course_id_idx on public.announcements (course_id);
create index announcements_student_id_idx on public.announcements (student_id);

create trigger set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();
