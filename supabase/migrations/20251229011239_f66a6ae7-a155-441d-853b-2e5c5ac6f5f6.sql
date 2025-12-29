-- Add dashboard permission columns to participants table
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS can_access_dashboard boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dashboard_permissions jsonb DEFAULT '{"can_view_responses": false, "can_add_expenses": true, "can_view_all_expenses": false, "can_edit_settings": false}'::jsonb,
ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS invite_claimed_at timestamptz;

-- Create index on invite_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_invite_token ON public.participants(invite_token);

-- Update RLS policies to allow users to view their own participant record
CREATE POLICY "Users can view their own participant record"
ON public.participants
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to update their own participant record (for claiming)
CREATE POLICY "Users can update their own participant"
ON public.participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());