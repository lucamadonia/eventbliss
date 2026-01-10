-- Tabelle für User-Feedback erstellen
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  page_url text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS aktivieren
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Jeder kann Feedback einsenden (auch nicht eingeloggte Nutzer)
CREATE POLICY "Anyone can submit feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (true);

-- Nur Admins können Feedback lesen
CREATE POLICY "Admins can view feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Nur Admins können Feedback aktualisieren
CREATE POLICY "Admins can update feedback"
  ON public.user_feedback FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));