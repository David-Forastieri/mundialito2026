-- Matches / Fixture
CREATE TABLE IF NOT EXISTS public.matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team      TEXT NOT NULL,
  away_team      TEXT NOT NULL,
  home_team_code TEXT NOT NULL DEFAULT '',
  away_team_code TEXT NOT NULL DEFAULT '',
  scheduled_at   TIMESTAMPTZ NOT NULL,
  stage          TEXT NOT NULL DEFAULT 'group'
                   CHECK (stage IN ('group', 'r16', 'qf', 'sf', 'final', 'third')),
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')),
  home_score     INT CHECK (home_score >= 0),
  away_score     INT CHECK (away_score >= 0),
  group_label    TEXT,
  venue          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_scheduled ON public.matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_status    ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_stage     ON public.matches(stage);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Matches are publicly readable by all
DROP POLICY IF EXISTS "Matches are publicly readable" ON public.matches;
CREATE POLICY "Matches are publicly readable"
  ON public.matches FOR SELECT
  USING (true);

-- Only service_role can write (via webhooks / edge functions)
-- No INSERT/UPDATE/DELETE policies for authenticated users
