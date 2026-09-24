-- Expliciete rechten per rol. Nieuwere Supabase-projecten geven tabellen die
-- met SQL zijn aangemaakt niet meer automatisch rechten voor de Data API
-- ("permission denied for table …"). Deze GRANTs bepalen welke *soort*
-- actie een rol mag; welke *rijen* regelt RLS (0001_init.sql).
--
-- service_role = de secret key (beheerscripts); die omzeilt RLS.

-- Catalogus: iedereen leest, ingelogden mogen schrijven voor zover RLS
-- (is_admin()) dat toestaat.
grant select on public.species, public.task_types, public.regions to anon, authenticated;
grant insert, update, delete on public.species, public.task_types, public.regions to authenticated;

grant select on public.admins to authenticated;

-- Tuinen: aanmaken gaat via create_garden(), lid worden via accept_invite().
grant select, update, delete on public.gardens to authenticated;
grant select, delete on public.garden_members to authenticated;
grant select, insert, delete on public.garden_invites to authenticated;

grant all on
  public.species, public.task_types, public.regions, public.admins,
  public.gardens, public.garden_members, public.garden_invites
to service_role;

-- Hulpfuncties die in de RLS-regels worden aangeroepen.
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_garden_member(uuid) to authenticated, service_role;
grant execute on function public.is_garden_owner(uuid) to authenticated, service_role;
