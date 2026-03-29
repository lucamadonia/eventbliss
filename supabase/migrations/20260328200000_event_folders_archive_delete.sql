-- ============================================
-- Event Folders, Archive & Soft Delete
-- ============================================

-- 1. Event Folders table
CREATE TABLE public.event_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.event_folders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_folders_user_id ON public.event_folders(user_id);

CREATE TRIGGER update_event_folders_updated_at
BEFORE UPDATE ON public.event_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users manage own folders"
ON public.event_folders FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Event Folder Assignments (junction table)
CREATE TABLE public.event_folder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.event_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, folder_id, user_id)
);

ALTER TABLE public.event_folder_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_efa_user_id ON public.event_folder_assignments(user_id);
CREATE INDEX idx_efa_folder_id ON public.event_folder_assignments(folder_id);
CREATE INDEX idx_efa_event_id ON public.event_folder_assignments(event_id);

CREATE POLICY "Users manage own folder assignments"
ON public.event_folder_assignments FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Archive & Soft Delete columns on events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

CREATE INDEX idx_events_archived_at ON public.events(archived_at) WHERE archived_at IS NULL;
CREATE INDEX idx_events_deleted_at ON public.events(deleted_at) WHERE deleted_at IS NULL;

-- 4. Update RLS policies to hide deleted events from participants/public
DROP POLICY IF EXISTS "Participants can view their events" ON public.events;
CREATE POLICY "Participants can view their events"
ON public.events FOR SELECT
USING (
  public.is_event_participant(auth.uid(), id)
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Public events are viewable by anyone" ON public.events;
CREATE POLICY "Public events are viewable by anyone"
ON public.events FOR SELECT
USING (is_public = true AND deleted_at IS NULL);
