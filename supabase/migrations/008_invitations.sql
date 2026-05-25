-- Group invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  UNIQUE (group_id, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_group_invitations_email   ON public.group_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group   ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_inviter ON public.group_invitations(invited_by);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Invited user can see invitations sent to their email
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.group_invitations;
CREATE POLICY "Users can view their own invitations"
  ON public.group_invitations FOR SELECT
  USING (invited_email = auth.email() OR invited_by = auth.uid());

-- Group members can send invitations for their groups
DROP POLICY IF EXISTS "Members can send invitations" ON public.group_invitations;
CREATE POLICY "Members can send invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

-- Invited user can update status (accept/reject)
DROP POLICY IF EXISTS "Users can respond to their invitations" ON public.group_invitations;
CREATE POLICY "Users can respond to their invitations"
  ON public.group_invitations FOR UPDATE
  USING (invited_email = auth.email());

-- Inviter can delete (cancel) their own invitations
DROP POLICY IF EXISTS "Inviters can cancel invitations" ON public.group_invitations;
CREATE POLICY "Inviters can cancel invitations"
  ON public.group_invitations FOR DELETE
  USING (invited_by = auth.uid());
