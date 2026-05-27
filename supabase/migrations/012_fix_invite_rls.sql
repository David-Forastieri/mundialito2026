-- Fix: allow invited users to see groups they've been invited to.
-- Without this, the group_invitations → groups JOIN returns NULL for non-members
-- (they don't appear in group_members yet, so the existing SELECT policies block them).

DROP POLICY IF EXISTS "Invited users can view groups" ON public.groups;
CREATE POLICY "Invited users can view groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_invitations
      WHERE group_invitations.group_id = groups.id
        AND group_invitations.invited_email = auth.email()
        AND group_invitations.status = 'pending'
        AND group_invitations.expires_at > NOW()
    )
  );
