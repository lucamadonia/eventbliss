-- Create user_activity_logs table for comprehensive activity tracking
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}',
  performed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for faster queries
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.user_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can delete activity logs
CREATE POLICY "Admins can delete activity logs"
  ON public.user_activity_logs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));