-- 0003_reviews_unique.sql
-- Enforces one review per user per bathroom. Existing duplicates (if any) are
-- collapsed to the most recent review before the constraint is added.

-- Remove older duplicate reviews, keeping the newest per (user_id, bathroom_id).
delete from public.reviews r
using public.reviews newer
where r.user_id = newer.user_id
  and r.bathroom_id = newer.bathroom_id
  and (
    newer.created_at > r.created_at
    or (newer.created_at = r.created_at and newer.id > r.id)
  );

alter table public.reviews
  drop constraint if exists reviews_user_bathroom_unique;

alter table public.reviews
  add constraint reviews_user_bathroom_unique unique (user_id, bathroom_id);

-- Recompute aggregates in case any duplicates were removed above.
select public.refresh_bathroom_rating(id) from public.bathrooms;
