-- Add AllSportsAPI event ID to matches for efficient live-score matching
alter table public.matches
  add column if not exists allsports_event_id integer unique;
