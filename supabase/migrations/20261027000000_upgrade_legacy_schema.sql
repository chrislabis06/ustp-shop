begin;

do $$
begin
  if to_regclass('public.users') is null
     or to_regclass('public.listings') is null
     or to_regclass('public.conversations') is null
     or to_regclass('public.messages') is null then
    raise exception 'Expected legacy users, listings, conversations, and messages tables. Check the target Supabase project before migrating.';
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.admin_emails (
  email text primary key check (email = lower(trim(email))),
  created_at timestamptz not null default now()
);
revoke all on table private.admin_emails from public, anon, authenticated;
insert into private.admin_emails (email)
values ('chrislabis06@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as auth_user
    join private.admin_emails as admin_email
      on admin_email.email = lower(auth_user.email)
    where auth_user.id = (select auth.uid())
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.admin_list_accounts()
returns table (user_id uuid, email text, full_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  return query
  select auth_user.id, auth_user.email::text,
         coalesce(profile.full_name, ''), auth_user.created_at
  from auth.users as auth_user
  left join public.profiles as profile on profile.id = auth_user.id
  order by auth_user.created_at desc;
end;
$$;
revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;

alter table public.users add column if not exists auth_user_id uuid;
update public.users as legacy_user
set auth_user_id = auth_user.id
from auth.users as auth_user
where legacy_user.auth_user_id is null
  and legacy_user.email is not null
  and lower(trim(legacy_user.email)) = lower(trim(auth_user.email));

alter table public.listings add column if not exists owner_id uuid;
alter table public.listings add column if not exists location text;
alter table public.listings add column if not exists image_path text;

do $$
begin
  if exists (
    select 1 from public.users
    where auth_user_id is not null
    group by auth_user_id having count(*) > 1
  ) then
    raise exception 'Duplicate legacy users map to one Auth user; resolve duplicate emails first.';
  end if;
  if exists (
    select 1 from public.listings as listing
    left join public.users as legacy_user on legacy_user.id = listing.seller_id
    where listing.owner_id is null and legacy_user.auth_user_id is null
  ) then
    raise exception 'Some listings cannot be mapped to a Supabase Auth account by email. Resolve users.email mappings first.';
  end if;
  if exists (
    select 1 from public.conversations as conversation
    left join public.users as buyer on buyer.id = conversation.buyer_id
    left join public.users as seller on seller.id = conversation.seller_id
    where buyer.auth_user_id is null or seller.auth_user_id is null
  ) then
    raise exception 'Some conversation participants cannot be mapped to Supabase Auth by email. Resolve users.email mappings first.';
  end if;
  if exists (
    select 1 from public.messages as message
    left join public.users as legacy_user on legacy_user.id = message.sender_id
    where legacy_user.auth_user_id is null
  ) then
    raise exception 'Some message senders cannot be mapped to Supabase Auth by email. Resolve users.email mappings first.';
  end if;
end;
$$;

create unique index if not exists users_auth_user_id_uidx
  on public.users (auth_user_id) where auth_user_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass and conname = 'users_auth_user_id_fkey'
  ) then
    alter table public.users add constraint users_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users (id) on delete set null not valid;
  end if;
end;
$$;

insert into public.profiles (id, full_name)
select auth_user.id,
       coalesce(nullif(auth_user.raw_user_meta_data ->> 'full_name', ''), legacy_user.full_name, '')
from auth.users as auth_user
left join public.users as legacy_user on legacy_user.auth_user_id = auth_user.id
on conflict (id) do update
set full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

update public.listings as listing
set owner_id = legacy_user.auth_user_id
from public.users as legacy_user
where listing.owner_id is null and listing.seller_id = legacy_user.id;
alter table public.listings alter column seller_id drop not null;

alter table public.conversations add column if not exists created_at timestamptz;
update public.conversations set created_at = now() where created_at is null;
alter table public.conversations alter column created_at set default now();
alter table public.conversations alter column created_at set not null;

alter table public.conversations add column if not exists buyer_auth_uuid uuid;
alter table public.conversations add column if not exists seller_auth_uuid uuid;
update public.conversations as conversation
set buyer_auth_uuid = legacy_user.auth_user_id
from public.users as legacy_user
where conversation.buyer_auth_uuid is null and conversation.buyer_id = legacy_user.id;
update public.conversations as conversation
set seller_auth_uuid = legacy_user.auth_user_id
from public.users as legacy_user
where conversation.seller_auth_uuid is null and conversation.seller_id = legacy_user.id;

do $$
begin
  if exists (select 1 from public.conversations where buyer_id is not null and buyer_auth_uuid is null)
     or exists (select 1 from public.conversations where seller_id is not null and seller_auth_uuid is null) then
    raise exception 'Conversation participant mapping is incomplete; no columns were changed.';
  end if;
  if exists (
    select 1 from public.conversations
    group by listing_id, buyer_auth_uuid having count(*) > 1
  ) then
    raise exception 'Duplicate conversations exist for the same listing and buyer; resolve them before migration.';
  end if;
end;
$$;

alter table public.conversations rename column buyer_id to buyer_legacy_id;
alter table public.conversations rename column seller_id to seller_legacy_id;
alter table public.conversations rename column buyer_auth_uuid to buyer_id;
alter table public.conversations rename column seller_auth_uuid to seller_id;
alter table public.conversations alter column buyer_id set not null;
alter table public.conversations alter column seller_id set not null;
alter table public.conversations alter column buyer_legacy_id drop not null;
alter table public.conversations alter column seller_legacy_id drop not null;

alter table public.messages add column if not exists sender_auth_uuid uuid;
update public.messages as message
set sender_auth_uuid = legacy_user.auth_user_id
from public.users as legacy_user
where message.sender_auth_uuid is null and message.sender_id = legacy_user.id;
do $$
begin
  if exists (select 1 from public.messages where sender_id is not null and sender_auth_uuid is null) then
    raise exception 'Message sender mapping is incomplete; no columns were changed.';
  end if;
end;
$$;
alter table public.messages rename column sender_id to sender_legacy_id;
alter table public.messages rename column sender_auth_uuid to sender_id;
alter table public.messages alter column sender_id set not null;
alter table public.messages alter column sender_legacy_id drop not null;

alter table public.messages add column if not exists body text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'message_text'
  ) then
    update public.messages set body = coalesce(body, message_text);
    alter table public.messages rename column message_text to legacy_message_text;
    alter table public.messages alter column legacy_message_text drop not null;
  end if;
  if exists (select 1 from public.messages where body is null or char_length(body) = 0) then
    raise exception 'Some messages have neither body nor message_text; reconcile those rows before migration.';
  end if;
end;
$$;
alter table public.messages alter column body set not null;

alter table public.listings alter column owner_id set not null;

create table if not exists public.favorites (
  user_id uuid not null,
  listing_id integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

do $$
begin
  if exists (
    select 1 from public.conversations
    where buyer_id = seller_id
  ) then
    raise exception 'A conversation has the same buyer and seller; resolve it before migration.';
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.listings'::regclass and conname = 'listings_owner_id_profiles_fkey') then
    alter table public.listings add constraint listings_owner_id_profiles_fkey
      foreign key (owner_id) references public.profiles (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.favorites'::regclass and conname = 'favorites_user_id_profiles_fkey') then
    alter table public.favorites add constraint favorites_user_id_profiles_fkey
      foreign key (user_id) references public.profiles (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.favorites'::regclass and conname = 'favorites_listing_id_listings_fkey') then
    alter table public.favorites add constraint favorites_listing_id_listings_fkey
      foreign key (listing_id) references public.listings (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.conversations'::regclass and conname = 'conversations_listing_id_listings_fkey') then
    alter table public.conversations add constraint conversations_listing_id_listings_fkey
      foreign key (listing_id) references public.listings (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.conversations'::regclass and conname = 'conversations_buyer_id_profiles_fkey') then
    alter table public.conversations add constraint conversations_buyer_id_profiles_fkey
      foreign key (buyer_id) references public.profiles (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.conversations'::regclass and conname = 'conversations_seller_id_profiles_fkey') then
    alter table public.conversations add constraint conversations_seller_id_profiles_fkey
      foreign key (seller_id) references public.profiles (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.messages'::regclass and conname = 'messages_conversation_id_conversations_fkey') then
    alter table public.messages add constraint messages_conversation_id_conversations_fkey
      foreign key (conversation_id) references public.conversations (id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.messages'::regclass and conname = 'messages_sender_id_profiles_fkey') then
    alter table public.messages add constraint messages_sender_id_profiles_fkey
      foreign key (sender_id) references public.profiles (id) on delete cascade not valid;
  end if;
end;
$$;

alter table public.listings validate constraint listings_owner_id_profiles_fkey;
alter table public.favorites validate constraint favorites_user_id_profiles_fkey;
alter table public.favorites validate constraint favorites_listing_id_listings_fkey;
alter table public.conversations validate constraint conversations_listing_id_listings_fkey;
alter table public.conversations validate constraint conversations_buyer_id_profiles_fkey;
alter table public.conversations validate constraint conversations_seller_id_profiles_fkey;
alter table public.messages validate constraint messages_conversation_id_conversations_fkey;
alter table public.messages validate constraint messages_sender_id_profiles_fkey;
alter table public.users validate constraint users_auth_user_id_fkey;

create unique index if not exists conversations_listing_buyer_uidx
  on public.conversations (listing_id, buyer_id);
create index if not exists listings_active_created_idx
  on public.listings (created_at desc) where status = 'active';
create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists favorites_listing_idx on public.favorites (listing_id);
create index if not exists conversations_members_idx on public.conversations (buyer_id, seller_id);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);

do $$
declare
  old_policy record;
begin
  for old_policy in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('users', 'profiles', 'listings', 'favorites', 'conversations', 'messages')
  loop
    execute format('drop policy %I on %I.%I', old_policy.policyname, old_policy.schemaname, old_policy.tablename);
  end loop;
end;
$$;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Users update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Active listings are public" on public.listings
  for select using (status = 'active' or (select auth.uid()) = owner_id or public.is_admin());
create policy "Users create their own listings" on public.listings
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users update their own listings" on public.listings
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Users delete their own listings" on public.listings
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Users read their own favorites" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users save their own favorites" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove their own favorites" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Conversation members can read conversations" on public.conversations
  for select to authenticated using ((select auth.uid()) in (buyer_id, seller_id) or public.is_admin());
create policy "Buyers can start conversations with listing sellers" on public.conversations
  for insert to authenticated with check (
    (select auth.uid()) = buyer_id
    and seller_id <> buyer_id
    and exists (
      select 1 from public.listings
      where listings.id = conversations.listing_id
        and listings.owner_id = conversations.seller_id
        and listings.status = 'active'
    )
  );

create policy "Conversation members can read messages" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and ((select auth.uid()) in (buyer_id, seller_id) or public.is_admin())
    )
  );
create policy "Conversation members can send messages" on public.messages
  for insert to authenticated with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and (select auth.uid()) in (buyer_id, seller_id)
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Listing images are publicly readable" on storage.objects;
create policy "Listing images are publicly readable" on storage.objects
  for select using (bucket_id = 'listing-images');
drop policy if exists "Users upload their own listing images" on storage.objects;
create policy "Users upload their own listing images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Users update their own listing images" on storage.objects;
create policy "Users update their own listing images" on storage.objects
  for update to authenticated using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Users delete their own listing images" on storage.objects;
create policy "Users delete their own listing images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

notify pgrst, 'reload schema';
commit;
