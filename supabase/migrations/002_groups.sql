-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code   TEXT NOT NULL UNIQUE,
  scoring_mode  TEXT NOT NULL DEFAULT 'exact' CHECK (scoring_mode IN ('winner', 'exact')),
  enable_phases BOOLEAN NOT NULL DEFAULT true,
  max_members   INT NOT NULL DEFAULT 50,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  total_points INT NOT NULL DEFAULT 0,
  template_id  UUID,
  joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user  ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = groups.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their groups" ON public.groups;
CREATE POLICY "Owners can update their groups"
  ON public.groups FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
CREATE POLICY "Owners can delete their groups"
  ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.group_members;
CREATE POLICY "Users can update own membership"
  ON public.group_members FOR UPDATE
  USING (user_id = auth.uid());
