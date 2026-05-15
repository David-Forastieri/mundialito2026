-- Prediction templates
CREATE TABLE IF NOT EXISTS public.prediction_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  cloned_from UUID REFERENCES public.prediction_templates(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Predictions per template+match
CREATE TABLE IF NOT EXISTS public.predictions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prediction_templates(id) ON DELETE CASCADE,
  match_id    UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_pred   INT CHECK (home_pred >= 0 AND home_pred <= 20),
  away_pred   INT CHECK (away_pred >= 0 AND away_pred <= 20),
  locked      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (template_id, match_id)
);

-- Advance predictions (team classification)
CREATE TABLE IF NOT EXISTS public.advance_predictions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID NOT NULL REFERENCES public.prediction_templates(id) ON DELETE CASCADE,
  team           TEXT NOT NULL,
  stage_target   TEXT NOT NULL CHECK (stage_target IN ('r16', 'qf', 'sf', 'final', 'champion')),
  position_pred  INT,
  points_earned  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (template_id, team, stage_target)
);

-- Add FK from group_members to prediction_templates
ALTER TABLE public.group_members
  ADD CONSTRAINT fk_group_member_template
  FOREIGN KEY (template_id)
  REFERENCES public.prediction_templates(id)
  ON DELETE SET NULL;

-- Match scores (computed after final whistle)
CREATE TABLE IF NOT EXISTS public.match_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id      UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  points_earned INT NOT NULL DEFAULT 0,
  breakdown     JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (prediction_id, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictions_template ON public.predictions(template_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match    ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_group   ON public.match_scores(group_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_user    ON public.match_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user       ON public.prediction_templates(user_id);

-- RLS
ALTER TABLE public.prediction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_predictions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates"
  ON public.prediction_templates FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert predictions before kickoff"
  ON public.predictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prediction_templates pt
      JOIN public.matches m ON m.id = predictions.match_id
      WHERE pt.id = predictions.template_id
        AND pt.user_id = auth.uid()
        AND m.scheduled_at > NOW()
        AND m.status = 'scheduled'
    )
  );

CREATE POLICY "Users can update own unlocked predictions before kickoff"
  ON public.predictions FOR UPDATE
  USING (
    locked = false AND
    EXISTS (
      SELECT 1 FROM public.prediction_templates pt
      JOIN public.matches m ON m.id = predictions.match_id
      WHERE pt.id = predictions.template_id
        AND pt.user_id = auth.uid()
        AND m.scheduled_at > NOW()
    )
  );

CREATE POLICY "Users can view own predictions"
  ON public.predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prediction_templates pt
      WHERE pt.id = predictions.template_id AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view scores in their groups"
  ON public.match_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = match_scores.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own advance predictions"
  ON public.advance_predictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.prediction_templates pt
      WHERE pt.id = advance_predictions.template_id AND pt.user_id = auth.uid()
    )
  );
