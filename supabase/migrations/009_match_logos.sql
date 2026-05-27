-- Add team logo URL columns to matches table
alter table public.matches
  add column if not exists home_team_logo text,
  add column if not exists away_team_logo text;
