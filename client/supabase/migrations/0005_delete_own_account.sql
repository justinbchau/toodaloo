-- 0005_delete_own_account.sql
-- Lets a signed-in user permanently delete their own account.
-- Cascades remove profiles, reviews, and saved_bathrooms; bathrooms they
-- created keep their listing with created_by set to null.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
