-- Add 'r32' (Round of 32) to the stage check constraint — new in WC 2026 (48 teams)
alter table public.matches
  drop constraint if exists matches_stage_check;

alter table public.matches
  add constraint matches_stage_check
  check (stage in ('group', 'r32', 'r16', 'qf', 'sf', 'final', 'third'));
