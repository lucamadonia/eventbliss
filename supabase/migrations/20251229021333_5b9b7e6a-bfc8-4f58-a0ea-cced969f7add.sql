-- Add category column to schedule_activities table
ALTER TABLE public.schedule_activities 
ADD COLUMN category text DEFAULT 'activity';

-- Add a check constraint for valid categories
ALTER TABLE public.schedule_activities
ADD CONSTRAINT valid_category CHECK (category IN ('activity', 'food', 'transport', 'accommodation', 'party', 'sightseeing', 'relaxation', 'other'));