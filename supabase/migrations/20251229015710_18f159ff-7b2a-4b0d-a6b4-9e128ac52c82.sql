-- Create schedule_activities table for visual planner
CREATE TABLE public.schedule_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  
  -- Schedule
  day_date date NOT NULL,
  start_time time,
  end_time time,
  
  -- Location details
  location text,
  location_url text,
  
  -- Contact person
  contact_name text,
  contact_phone text,
  contact_email text,
  
  -- Costs
  estimated_cost numeric(10,2),
  currency text DEFAULT 'EUR',
  cost_per_person boolean DEFAULT true,
  
  -- Requirements and notes
  requirements text[],
  notes text,
  
  -- Responsible participant
  responsible_participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  
  -- Sorting
  sort_order integer DEFAULT 0,
  
  -- Meta
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create activity_comments table
CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_activities
CREATE POLICY "Participants can view activities"
  ON public.schedule_activities
  FOR SELECT
  USING (is_event_participant(auth.uid(), event_id));

CREATE POLICY "Organizers can manage activities"
  ON public.schedule_activities
  FOR ALL
  USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Participants can add activities"
  ON public.schedule_activities
  FOR INSERT
  WITH CHECK (is_event_participant(auth.uid(), event_id));

-- RLS Policies for activity_comments
CREATE POLICY "Participants can view comments"
  ON public.activity_comments
  FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM public.schedule_activities
      WHERE is_event_participant(auth.uid(), event_id)
    )
  );

CREATE POLICY "Participants can add comments"
  ON public.activity_comments
  FOR INSERT
  WITH CHECK (
    activity_id IN (
      SELECT id FROM public.schedule_activities
      WHERE is_event_participant(auth.uid(), event_id)
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.activity_comments
  FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM public.participants WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger for schedule_activities
CREATE TRIGGER update_schedule_activities_updated_at
  BEFORE UPDATE ON public.schedule_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_schedule_activities_event_id ON public.schedule_activities(event_id);
CREATE INDEX idx_schedule_activities_day_date ON public.schedule_activities(day_date);
CREATE INDEX idx_activity_comments_activity_id ON public.activity_comments(activity_id);