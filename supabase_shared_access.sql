-- Externe Akteneinsicht
-- Einmalig im Supabase SQL Editor ausführen.
create table if not exists public.shared_case_access (
  token text primary key,
  file_number text not null,
  snapshot jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shared_case_access enable row level security;

drop policy if exists "public can read active shared cases" on public.shared_case_access;
create policy "public can read active shared cases"
on public.shared_case_access for select
to anon
using (active = true);

-- Die Kanzlei-App nutzt den Publishable/Anon-Key. Erlaubt das Erstellen einer Freigabe.
drop policy if exists "public can create shared cases" on public.shared_case_access;
create policy "public can create shared cases"
on public.shared_case_access for insert
to anon
with check (active = true);

-- Optional: alte Freigaben können später durch die Kanzlei deaktiviert werden.
