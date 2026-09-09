-- Rechtsanwalt Donnerfaust – zentrale GitHub-Pages-Datenbank
create table if not exists public.kanzlei_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kanzlei_state enable row level security;
revoke all on table public.kanzlei_state from anon;
revoke all on table public.kanzlei_state from authenticated;
grant select, insert, update on table public.kanzlei_state to anon, authenticated;
drop policy if exists "Kanzlei public read" on public.kanzlei_state;
drop policy if exists "Kanzlei public insert" on public.kanzlei_state;
drop policy if exists "Kanzlei public update" on public.kanzlei_state;
drop policy if exists "Kanzlei authenticated read" on public.kanzlei_state;
drop policy if exists "Kanzlei authenticated insert" on public.kanzlei_state;
drop policy if exists "Kanzlei authenticated update" on public.kanzlei_state;
create policy "Kanzlei public read" on public.kanzlei_state for select to anon, authenticated using (true);
create policy "Kanzlei public insert" on public.kanzlei_state for insert to anon, authenticated with check (true);
create policy "Kanzlei public update" on public.kanzlei_state for update to anon, authenticated using (true) with check (true);
alter table public.kanzlei_state replica identity full;
do $$ begin alter publication supabase_realtime add table public.kanzlei_state; exception when duplicate_object then null; end $$;
