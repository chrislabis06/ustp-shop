begin;

alter table public.listings add column if not exists size text;
alter table public.listings alter column size drop not null;

notify pgrst, 'reload schema';
commit;