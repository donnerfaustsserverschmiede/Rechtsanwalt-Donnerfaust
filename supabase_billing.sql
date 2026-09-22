-- Rechnungen + Kassen-Freigaben fuer Rechtsanwalt Donnerfaust
create table if not exists public.shared_invoice_access (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invoice_number text not null,
  snapshot jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

alter table public.shared_invoice_access enable row level security;

drop policy if exists "Public can read active shared invoices" on public.shared_invoice_access;
create policy "Public can read active shared invoices"
on public.shared_invoice_access for select to anon
using (active = true and (expires_at is null or expires_at > now()));

drop policy if exists "Public can create shared invoices" on public.shared_invoice_access;
create policy "Public can create shared invoices"
on public.shared_invoice_access for insert to anon
with check (active = true);

grant select, insert on table public.shared_invoice_access to anon;
grant select, insert on table public.shared_invoice_access to authenticated;

create index if not exists shared_invoice_access_token_idx on public.shared_invoice_access(token);
create index if not exists shared_invoice_access_invoice_number_idx on public.shared_invoice_access(invoice_number);
