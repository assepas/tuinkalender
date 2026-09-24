-- Tuinkalender: plantendata (catalogus) + gesynchroniseerde, deelbare tuinen.
--
-- Beveiliging zit volledig in Row Level Security: de browser gebruikt de
-- publieke publishable key (rol anon/authenticated), dus alles wat hier niet expliciet is toegestaan, kan
-- niemand. Het verbergen van admin-schermen in de UI is alleen cosmetisch.
--
-- Catalogus-data staat als `json` (niet `jsonb`): `json` bewaart de
-- sleutelvolgorde, zodat export terug naar data/**.json leesbaar blijft en
-- de editor de velden in dezelfde volgorde toont als de bronbestanden.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Alleen je eigen rij zien (zo weet de client of jij admin bent). Er is
-- bewust geen insert/update/delete-policy: admins voeg je toe via de
-- SQL-editor in het Supabase-dashboard.
create policy "admins: eigen rij lezen" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Catalogus: soorten, taaktypes, regio's
-- ---------------------------------------------------------------------------

create table public.species (
  id text primary key,
  data json not null
    check (json_typeof(data) = 'object' and data->>'id' = id and data->>'name' is not null),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create table public.task_types (
  id text primary key,
  sort integer not null default 0,
  data json not null
    check (json_typeof(data) = 'object' and data->>'id' = id and data->>'label' is not null),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create table public.regions (
  id text primary key,
  data json not null
    check (json_typeof(data) = 'object' and data->>'id' = id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create function public.touch_catalog_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger species_touch before insert or update on public.species
  for each row execute function public.touch_catalog_row();
create trigger task_types_touch before insert or update on public.task_types
  for each row execute function public.touch_catalog_row();
create trigger regions_touch before insert or update on public.regions
  for each row execute function public.touch_catalog_row();

alter table public.species enable row level security;
alter table public.task_types enable row level security;
alter table public.regions enable row level security;

-- Iedereen (ook zonder account) mag de catalogus lezen; alleen admins schrijven.
create policy "species: iedereen leest" on public.species
  for select to anon, authenticated using (true);
create policy "species: admin schrijft" on public.species
  for insert to authenticated with check (public.is_admin());
create policy "species: admin wijzigt" on public.species
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "species: admin verwijdert" on public.species
  for delete to authenticated using (public.is_admin());

create policy "task_types: iedereen leest" on public.task_types
  for select to anon, authenticated using (true);
create policy "task_types: admin schrijft" on public.task_types
  for insert to authenticated with check (public.is_admin());
create policy "task_types: admin wijzigt" on public.task_types
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "task_types: admin verwijdert" on public.task_types
  for delete to authenticated using (public.is_admin());

create policy "regions: iedereen leest" on public.regions
  for select to anon, authenticated using (true);
create policy "regions: admin schrijft" on public.regions
  for insert to authenticated with check (public.is_admin());
create policy "regions: admin wijzigt" on public.regions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "regions: admin verwijdert" on public.regions
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tuinen, leden en uitnodigingen
-- ---------------------------------------------------------------------------

create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mijn tuin' check (length(trim(name)) > 0),
  -- Het volledige tuin-document, zelfde vorm als de localStorage-versie
  -- (zie data/schema/garden.schema.json en src/lib/domain/migrate.js).
  data jsonb not null check (jsonb_typeof(data -> 'plantings') = 'array'),
  -- Optimistic concurrency: de client werkt bij met `where version = <gelezen>`;
  -- de trigger hoogt hem op. 0 bijgewerkte rijen = iemand anders was eerder.
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create function public.bump_garden_version()
returns trigger
language plpgsql
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger gardens_bump before update on public.gardens
  for each row execute function public.bump_garden_version();

create table public.garden_members (
  garden_id uuid not null references public.gardens on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  -- Kopie van het e-mailadres bij het lid worden, zodat leden elkaar in de
  -- ledenlijst kunnen zien zonder toegang tot auth.users.
  email text,
  created_at timestamptz not null default now(),
  primary key (garden_id, user_id)
);

create index garden_members_user_idx on public.garden_members (user_id);

create table public.garden_invites (
  token uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens on delete cascade,
  created_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users on delete set null,
  used_at timestamptz
);

create function public.is_garden_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.garden_members where garden_id = gid and user_id = auth.uid()
  );
$$;

create function public.is_garden_owner(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.garden_members
    where garden_id = gid and user_id = auth.uid() and role = 'owner'
  );
$$;

alter table public.gardens enable row level security;
alter table public.garden_members enable row level security;
alter table public.garden_invites enable row level security;

-- Tuinen: aanmaken gaat via create_garden() (tuin + eigenaar in één keer),
-- daarom geen insert-policy.
create policy "gardens: leden lezen" on public.gardens
  for select to authenticated using (public.is_garden_member(id));
create policy "gardens: leden wijzigen" on public.gardens
  for update to authenticated
  using (public.is_garden_member(id)) with check (public.is_garden_member(id));
create policy "gardens: eigenaar verwijdert" on public.gardens
  for delete to authenticated using (public.is_garden_owner(id));

-- Leden: lid worden gaat via create_garden()/accept_invite(). Een eigenaar
-- kan anderen verwijderen, een lid kan zelf vertrekken; de eigenaarsrij zelf
-- verdwijnt alleen samen met de tuin.
create policy "garden_members: leden lezen" on public.garden_members
  for select to authenticated using (public.is_garden_member(garden_id));
create policy "garden_members: verwijderen" on public.garden_members
  for delete to authenticated
  using (role <> 'owner' and (public.is_garden_owner(garden_id) or user_id = auth.uid()));

create policy "garden_invites: eigenaar leest" on public.garden_invites
  for select to authenticated using (public.is_garden_owner(garden_id));
create policy "garden_invites: eigenaar maakt" on public.garden_invites
  for insert to authenticated
  with check (public.is_garden_owner(garden_id) and created_by = auth.uid());
create policy "garden_invites: eigenaar verwijdert" on public.garden_invites
  for delete to authenticated using (public.is_garden_owner(garden_id));

-- ---------------------------------------------------------------------------
-- RPC's
-- ---------------------------------------------------------------------------

create function public.create_garden(p_name text, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  insert into public.gardens (name, data)
  values (coalesce(nullif(trim(p_name), ''), 'Mijn tuin'), p_data)
  returning id into gid;

  insert into public.garden_members (garden_id, user_id, role, email)
  values (gid, auth.uid(), 'owner', auth.jwt() ->> 'email');

  return gid;
end;
$$;

-- Eenmalig bruikbaar en verloopt; wie al lid is, blijft gewoon lid.
create function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.garden_invites;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  select * into inv from public.garden_invites where token = p_token for update;

  if not found or inv.used_at is not null or inv.expires_at < now() then
    raise exception 'Deze uitnodiging is ongeldig, al gebruikt of verlopen.';
  end if;

  insert into public.garden_members (garden_id, user_id, role, email)
  values (inv.garden_id, auth.uid(), 'editor', auth.jwt() ->> 'email')
  on conflict (garden_id, user_id) do nothing;

  update public.garden_invites
  set used_by = auth.uid(), used_at = now()
  where token = p_token;

  return inv.garden_id;
end;
$$;

revoke execute on function public.create_garden(text, jsonb) from public, anon;
revoke execute on function public.accept_invite(uuid) from public, anon;
grant execute on function public.create_garden(text, jsonb) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: wijzigingen van mede-tuiniers direct zien (respecteert RLS).
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.gardens;
