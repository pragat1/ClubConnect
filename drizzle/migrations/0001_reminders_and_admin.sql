create or replace function public.generate_my_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare _n integer;
begin
  with due as (
    update public.event_registrations r set reminder_sent = true
    from public.events e
    where r.event_id = e.id and r.user_id = auth.uid() and r.reminder_sent = false
      and r.status = 'registered'
      and e.event_date between current_date and current_date + 1
    returning r.user_id, e.id, e.title, e.event_date, e.location
  )
  insert into public.notifications (user_id, title, message, type, link)
  select user_id, 'Event reminder: ' || title,
         title || ' is on ' || to_char(event_date,'DD Mon YYYY') || coalesce(' at ' || location, '') || '.',
         'event_reminder', '/events/' || id
  from due;
  get diagnostics _n = row_count;
  return _n;
end; $$;
grant execute on function public.generate_my_reminders() to authenticated;

create policy "College admins manage roles insert" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'college_admin'));
create policy "College admins manage roles delete" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'college_admin'));
grant insert, delete on public.user_roles to authenticated;

create policy "College admins manage interests" on public.interests for all to authenticated
  using (public.has_role(auth.uid(),'college_admin')) with check (public.has_role(auth.uid(),'college_admin'));
grant insert, update, delete on public.interests to authenticated;

create policy "College admins update profiles" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(),'college_admin')) with check (public.has_role(auth.uid(),'college_admin'));

create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'college_admin') then
    new.crn := old.crn; new.email := old.email; new.is_premium := old.is_premium; new.college_id := old.college_id;
  end if;
  return new;
end; $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_fields();