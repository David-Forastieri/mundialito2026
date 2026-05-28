-- Restrict group_invitations INSERT to group owners only.
-- Previously any member could insert; now only the owner (groups.owner_id) can.

DROP POLICY IF EXISTS "Members can send invitations" ON public.group_invitations;
CREATE POLICY "Owner can send invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_invitations.group_id
        AND groups.owner_id = auth.uid()
    )
  );
