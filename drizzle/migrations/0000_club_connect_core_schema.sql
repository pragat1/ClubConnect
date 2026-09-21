-- ============ ENUMS ============
create type public.app_role as enum ('student','club_admin','college_admin');
create type public.membership_status as enum ('active','left');
create type public.registration_status as enum ('registered','cancelled','attended');

-- ============ COLLEGES ============
create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  domain text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);
grant select on public.colleges to anon, authenticated;
grant all on public.colleges to service_role;
alter table public.colleges enable row level security;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  college_id uuid references public.colleges(id) on delete set null,
  crn text,
  email text,
  branch text,
  academic_year text,
  avatar_url text,
  bio text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ INTERESTS ============
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.interests to anon, authenticated;
grant all on public.interests to service_role;
alter table public.interests enable row level security;

create table public.user_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);
grant select, insert, delete on public.user_interests to authenticated;
grant all on public.user_interests to service_role;
alter table public.user_interests enable row level security;

-- ============ CLUBS ============
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null default '',
  full_description text,
  objectives text,
  activities text,
  logo_url text,
  banner_url text,
  contact_email text,
  member_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.clubs to anon, authenticated;
grant insert, update, delete on public.clubs to authenticated;
grant all on public.clubs to service_role;
alter table public.clubs enable row level security;

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);
grant select on public.club_memberships to anon, authenticated;
grant insert, update, delete on public.club_memberships to authenticated;
grant all on public.club_memberships to service_role;
alter table public.club_memberships enable row level security;

create or replace function public.is_club_admin(_user_id uuid, _club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.club_memberships
    where user_id = _user_id and club_id = _club_id
      and role = 'admin' and status = 'active'
  ) or exists (
    select 1 from public.clubs where id = _club_id and created_by = _user_id
  ) or public.has_role(_user_id, 'college_admin')
$$;

-- ============ EVENTS ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  title text not null,
  description text not null default '',
  event_type text not null default 'General',
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  image_url text,
  capacity integer,
  registration_deadline date,
  registration_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.registration_status not null default 'registered',
  reminder_sent boolean not null default false,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);
grant select, insert, update, delete on public.event_registrations to authenticated;
grant all on public.event_registrations to service_role;
alter table public.event_registrations enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null default '',
  type text not null default 'general',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

-- ============ ANNOUNCEMENTS ============
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;

-- ============ SUBSCRIPTIONS ============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'premium',
  status text not null default 'inactive',
  start_date timestamptz,
  end_date timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;

-- ============ POLICIES ============
create policy "Colleges are viewable by everyone" on public.colleges for select using (true);
create policy "College admins manage colleges" on public.colleges for all to authenticated
  using (public.has_role(auth.uid(),'college_admin')) with check (public.has_role(auth.uid(),'college_admin'));

create policy "Profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'college_admin'));

create policy "Interests viewable by everyone" on public.interests for select using (true);
create policy "Users read interests links" on public.user_interests for select to authenticated using (true);
create policy "Users add own interests" on public.user_interests for insert to authenticated with check (auth.uid() = user_id);
create policy "Users remove own interests" on public.user_interests for delete to authenticated using (auth.uid() = user_id);

create policy "Clubs viewable by everyone" on public.clubs for select using (true);
create policy "Authenticated users create clubs" on public.clubs for insert to authenticated with check (auth.uid() = created_by);
create policy "Club admins update clubs" on public.clubs for update to authenticated
  using (public.is_club_admin(auth.uid(), id)) with check (public.is_club_admin(auth.uid(), id));
create policy "Club admins delete clubs" on public.clubs for delete to authenticated using (public.is_club_admin(auth.uid(), id));

create policy "Memberships viewable by everyone" on public.club_memberships for select using (true);
create policy "Users join clubs" on public.club_memberships for insert to authenticated
  with check (auth.uid() = user_id or public.is_club_admin(auth.uid(), club_id));
create policy "Users update own membership" on public.club_memberships for update to authenticated
  using (auth.uid() = user_id or public.is_club_admin(auth.uid(), club_id))
  with check (auth.uid() = user_id or public.is_club_admin(auth.uid(), club_id));
create policy "Users leave clubs" on public.club_memberships for delete to authenticated
  using (auth.uid() = user_id or public.is_club_admin(auth.uid(), club_id));

create policy "Events viewable by everyone" on public.events for select using (true);
create policy "Club admins create events" on public.events for insert to authenticated
  with check (public.is_club_admin(auth.uid(), club_id));
create policy "Club admins update events" on public.events for update to authenticated
  using (public.is_club_admin(auth.uid(), club_id)) with check (public.is_club_admin(auth.uid(), club_id));
create policy "Club admins delete events" on public.events for delete to authenticated
  using (public.is_club_admin(auth.uid(), club_id));

create policy "Users read own registrations" on public.event_registrations for select to authenticated
  using (auth.uid() = user_id or public.is_club_admin(auth.uid(), (select club_id from public.events where id = event_id)));
create policy "Users register themselves" on public.event_registrations for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own registration" on public.event_registrations for update to authenticated
  using (auth.uid() = user_id or public.is_club_admin(auth.uid(), (select club_id from public.events where id = event_id)))
  with check (auth.uid() = user_id or public.is_club_admin(auth.uid(), (select club_id from public.events where id = event_id)));
create policy "Users cancel own registration" on public.event_registrations for delete to authenticated using (auth.uid() = user_id);

create policy "Users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id);

create policy "Announcements viewable by everyone" on public.announcements for select using (true);
create policy "Club admins create announcements" on public.announcements for insert to authenticated
  with check (public.is_club_admin(auth.uid(), club_id));
create policy "Club admins update announcements" on public.announcements for update to authenticated
  using (public.is_club_admin(auth.uid(), club_id)) with check (public.is_club_admin(auth.uid(), club_id));
create policy "Club admins delete announcements" on public.announcements for delete to authenticated
  using (public.is_club_admin(auth.uid(), club_id));

create policy "Users read own subscription" on public.subscriptions for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'college_admin'));

-- ============ TRIGGERS ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _college uuid;
begin
  select id into _college from public.colleges
  where domain = split_part(new.email, '@', 2) limit 1;

  insert into public.profiles (id, full_name, email, crn, branch, academic_year, college_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'crn',
    new.raw_user_meta_data ->> 'branch',
    new.raw_user_meta_data ->> 'academic_year',
    _college
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- membership counters + notification
create or replace function public.on_membership_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare _name text;
begin
  if tg_op = 'INSERT' then
    update public.clubs set member_count = member_count + 1 where id = new.club_id returning name into _name;
    insert into public.notifications (user_id, title, message, type, link)
    values (new.user_id, 'Club membership confirmed',
            'You are now a member of ' || coalesce(_name,'this club') || '.',
            'club_membership', '/clubs/' || new.club_id);
    return new;
  elsif tg_op = 'DELETE' then
    update public.clubs set member_count = greatest(member_count - 1, 0) where id = old.club_id;
    return old;
  end if;
  return null;
end; $$;

create trigger club_membership_changed
after insert or delete on public.club_memberships
for each row execute function public.on_membership_change();

-- registration counters + notification
create or replace function public.on_registration_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare _title text;
begin
  if tg_op = 'INSERT' then
    update public.events set registration_count = registration_count + 1 where id = new.event_id returning title into _title;
    insert into public.notifications (user_id, title, message, type, link)
    values (new.user_id, 'Event registration confirmed',
            'You are registered for ' || coalesce(_title,'this event') || '.',
            'event_registration', '/events/' || new.event_id);
    return new;
  elsif tg_op = 'DELETE' then
    update public.events set registration_count = greatest(registration_count - 1, 0) where id = old.event_id returning title into _title;
    insert into public.notifications (user_id, title, message, type, link)
    values (old.user_id, 'Registration cancelled',
            'Your registration for ' || coalesce(_title,'this event') || ' was cancelled.',
            'registration_cancelled', '/events/' || old.event_id);
    return old;
  end if;
  return null;
end; $$;

create trigger event_registration_changed
after insert or delete on public.event_registrations
for each row execute function public.on_registration_change();

-- notify club members of a new event
create or replace function public.on_event_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare _club text;
begin
  select name into _club from public.clubs where id = new.club_id;
  insert into public.notifications (user_id, title, message, type, link)
  select m.user_id, 'New event from ' || coalesce(_club,'a club you joined'),
         new.title || ' on ' || to_char(new.event_date,'DD Mon YYYY') || '.',
         'new_event', '/events/' || new.id
  from public.club_memberships m
  where m.club_id = new.club_id and m.status = 'active' and m.user_id <> coalesce(new.created_by,'00000000-0000-0000-0000-000000000000'::uuid);
  return new;
end; $$;

create trigger event_created_notify after insert on public.events
for each row execute function public.on_event_created();

-- announcement notification to club members
create or replace function public.on_announcement_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare _club text;
begin
  select name into _club from public.clubs where id = new.club_id;
  insert into public.notifications (user_id, title, message, type, link)
  select m.user_id, coalesce(_club,'Club') || ' announcement', new.title,
         'announcement', '/clubs/' || new.club_id
  from public.club_memberships m
  where m.club_id = new.club_id and m.status = 'active';
  return new;
end; $$;

create trigger announcement_created_notify after insert on public.announcements
for each row execute function public.on_announcement_created();

-- club creator becomes club admin member
create or replace function public.on_club_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.club_memberships (club_id, user_id, role)
    values (new.id, new.created_by, 'admin') on conflict do nothing;
    insert into public.user_roles (user_id, role) values (new.created_by, 'club_admin')
    on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger club_created_admin after insert on public.clubs
for each row execute function public.on_club_created();

-- ============ REAL INSTITUTION RECORD + INTEREST TAXONOMY ============
insert into public.colleges (name, city, state, domain)
values ('Guru Nanak Dev Engineering College','Ludhiana','Punjab','gndec.ac.in');

insert into public.interests (name) values
  ('Technology'),('Coding & Development'),('Robotics'),('Entrepreneurship'),
  ('Cultural'),('Music'),('Dance'),('Drama & Theatre'),('Literature'),
  ('Photography'),('Design'),('Sports'),('Fitness'),('Social Service'),
  ('Environment'),('Academics & Research'),('Debate & Public Speaking'),('Gaming');

-- indexes
create index idx_events_date on public.events (event_date);
create index idx_events_club on public.events (club_id);
create index idx_memberships_user on public.club_memberships (user_id);
create index idx_registrations_user on public.event_registrations (user_id);
create index idx_notifications_user on public.notifications (user_id, is_read);
