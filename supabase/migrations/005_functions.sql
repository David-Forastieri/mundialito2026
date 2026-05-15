-- Function: refresh total_points in group_members after match calculation
CREATE OR REPLACE FUNCTION public.refresh_group_totals(p_match_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.group_members gm
  SET total_points = (
    SELECT COALESCE(SUM(ms.points_earned), 0)
    FROM public.match_scores ms
    WHERE ms.group_id = gm.group_id
      AND ms.user_id = gm.user_id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.match_scores ms2
    WHERE ms2.match_id = p_match_id
      AND ms2.group_id = gm.group_id
      AND ms2.user_id = gm.user_id
  );
END;
$$;

-- Function: get group ranking with rank number
CREATE OR REPLACE FUNCTION public.get_group_ranking(p_group_id UUID)
RETURNS TABLE (
  user_id          UUID,
  display_name     TEXT,
  avatar_url       TEXT,
  total_points     INT,
  rank             BIGINT,
  predictions_made BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    gm.user_id,
    COALESCE(p.display_name, p.username, 'Usuario') AS display_name,
    p.avatar_url,
    gm.total_points,
    ROW_NUMBER() OVER (ORDER BY gm.total_points DESC, gm.joined_at ASC) AS rank,
    COUNT(pr.id) AS predictions_made
  FROM public.group_members gm
  JOIN public.profiles p ON p.id = gm.user_id
  LEFT JOIN public.prediction_templates pt ON pt.id = gm.template_id
  LEFT JOIN public.predictions pr ON pr.template_id = pt.id
  WHERE gm.group_id = p_group_id
  GROUP BY gm.user_id, p.display_name, p.username, p.avatar_url, gm.total_points, gm.joined_at
  ORDER BY gm.total_points DESC, gm.joined_at ASC;
END;
$$;

-- Function: auto-lock predictions when match starts
CREATE OR REPLACE FUNCTION public.lock_predictions_for_match(p_match_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.predictions
  SET locked = true, updated_at = NOW()
  WHERE match_id = p_match_id AND locked = false;
END;
$$;

-- Trigger: update updated_at on predictions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
