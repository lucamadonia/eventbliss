-- Neue Tabelle für Agentur-Interaktionen (Analytics)
CREATE TABLE public.agency_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  agency_id text NOT NULL,
  agency_name text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('phone', 'email', 'website')),
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.agency_interactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can log interactions"
ON public.agency_interactions FOR INSERT
WITH CHECK (is_event_participant(auth.uid(), event_id));

CREATE POLICY "Organizers can view interactions"
ON public.agency_interactions FOR SELECT
USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Admins can view all interactions"
ON public.agency_interactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy für Aktivitäten-Löschen durch Teilnehmer
CREATE POLICY "Participants can delete activities they created"
ON public.schedule_activities FOR DELETE
USING (
  responsible_participant_id IN (
    SELECT id FROM public.participants WHERE user_id = auth.uid()
  )
  AND is_event_participant(auth.uid(), event_id)
);