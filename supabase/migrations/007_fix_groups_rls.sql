-- Allow group owners to select their own groups
-- (required so INSERT ... RETURNING works before the member row is created)
DROP POLICY IF EXISTS "Owners can view their own groups" ON public.groups;
CREATE POLICY "Owners can view their own groups"
  ON public.groups FOR SELECT
  USING (owner_id = auth.uid());
