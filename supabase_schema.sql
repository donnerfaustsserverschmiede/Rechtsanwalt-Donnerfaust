-- Rechtsanwalt Donnerfaust – zentrale GitHub-Pages-Datenbank
-- Einmalig im Supabase SQL Editor ausführen.

create table if not exists public.kanzlei_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kanzlei_state enable row level security;

revoke all on table public.kanzlei_state from anon;
revoke all on table public.kanzlei_state from authenticated;
grant select, insert, update on table public.kanzlei_state to authenticated;

drop policy if exists "Kanzlei authenticated read" on public.kanzlei_state;
drop policy if exists "Kanzlei authenticated insert" on public.kanzlei_state;
drop policy if exists "Kanzlei authenticated update" on public.kanzlei_state;

create policy "Kanzlei authenticated read"
on public.kanzlei_state for select to authenticated
using (true);

create policy "Kanzlei authenticated insert"
on public.kanzlei_state for insert to authenticated
with check (true);

create policy "Kanzlei authenticated update"
on public.kanzlei_state for update to authenticated
using (true) with check (true);

-- Realtime für die zentrale Zustandszeile aktivieren.
alter table public.kanzlei_state replica identity full;

-- Falls die Tabelle bereits Mitglied der Publication ist, kann dieser Befehl einen Fehler melden.
-- Dann ist nichts weiter zu tun.
do $$
begin
  alter publication supabase_realtime add table public.kanzlei_state;
exception when duplicate_object then
  null;
end $$;

-- Die Kanzlei-App arbeitet bewusst mit einer einzigen JSONB-Zustandszeile.
-- Dadurch bleibt die bestehende GitHub-Pages-App kompatibel, während alle Benutzer
-- denselben zentralen Datenstand sehen. RLS erlaubt ausschließlich angemeldeten Benutzern Zugriff.
