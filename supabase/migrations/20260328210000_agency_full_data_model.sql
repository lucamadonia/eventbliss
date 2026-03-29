-- ============================================
-- Agency Full Data Model
-- Tables: vendors, event_vendors, budget_items,
-- event_tasks, event_notes, event_files,
-- run_sheet_items, contracts
-- ============================================

-- 1. Vendors / Contacts Database
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  type TEXT NOT NULL DEFAULT 'contact' CHECK (type IN ('organizer','service_provider','crew','contact')),
  specialization TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_quality NUMERIC(2,1) DEFAULT 0,
  rating_punctuality NUMERIC(2,1) DEFAULT 0,
  rating_price NUMERIC(2,1) DEFAULT 0,
  rating_communication NUMERIC(2,1) DEFAULT 0,
  rating_flexibility NUMERIC(2,1) DEFAULT 0,
  notes TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_type ON public.vendors(type);

CREATE POLICY "Users manage own vendors"
ON public.vendors FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Event-Vendor Junction
CREATE TABLE public.event_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_description TEXT,
  agreed_price NUMERIC(12,2),
  deposit_amount NUMERIC(12,2),
  deposit_paid BOOLEAN DEFAULT false,
  contract_status TEXT DEFAULT 'pending' CHECK (contract_status IN ('pending','sent','signed','active','completed','cancelled')),
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, vendor_id)
);

ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_vendors_event ON public.event_vendors(event_id);
CREATE INDEX idx_event_vendors_vendor ON public.event_vendors(vendor_id);

CREATE POLICY "Event vendors accessible by participants"
ON public.event_vendors FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid() AND role = 'organizer')
);

CREATE TRIGGER update_event_vendors_updated_at
BEFORE UPDATE ON public.event_vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Budget Items
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('venue','catering','technik','personal','marketing','decoration','transport','accommodation','entertainment','other')),
  subcategory TEXT,
  description TEXT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  quoted_amount NUMERIC(12,2) DEFAULT 0,
  actual_amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_budget_items_event ON public.budget_items(event_id);
CREATE INDEX idx_budget_items_category ON public.budget_items(category);

CREATE POLICY "Budget items accessible by event creators/organizers"
ON public.budget_items FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid() AND role = 'organizer')
);

CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Event Tasks (Kanban)
CREATE TABLE public.event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_name TEXT,
  due_date DATE,
  category TEXT,
  sort_order INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_tasks_event ON public.event_tasks(event_id);
CREATE INDEX idx_event_tasks_status ON public.event_tasks(status);
CREATE INDEX idx_event_tasks_assignee ON public.event_tasks(assignee_id);

CREATE POLICY "Tasks accessible by event creators/organizers"
ON public.event_tasks FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid())
);

CREATE TRIGGER update_event_tasks_updated_at
BEFORE UPDATE ON public.event_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Run Sheet Items (Run of Show)
CREATE TABLE public.run_sheet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','delayed','skipped')),
  responsible_name TEXT,
  responsible_role TEXT,
  stage TEXT DEFAULT 'main',
  cue_notes TEXT,
  delay_minutes INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.run_sheet_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_run_sheet_event ON public.run_sheet_items(event_id);
CREATE INDEX idx_run_sheet_status ON public.run_sheet_items(status);

CREATE POLICY "Run sheet accessible by event creators/organizers"
ON public.run_sheet_items FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid())
);

CREATE TRIGGER update_run_sheet_items_updated_at
BEFORE UPDATE ON public.run_sheet_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Event Notes
CREATE TABLE public.event_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_notes_event ON public.event_notes(event_id);

CREATE POLICY "Notes accessible by event creators/organizers"
ON public.event_notes FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid())
);

CREATE TRIGGER update_event_notes_updated_at
BEFORE UPDATE ON public.event_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Event Files
CREATE TABLE public.event_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('contract','invoice','photo','floor_plan','briefing','other')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_files_event ON public.event_files(event_id);
CREATE INDEX idx_event_files_category ON public.event_files(category);

CREATE POLICY "Files accessible by event creators/organizers"
ON public.event_files FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  OR event_id IN (SELECT event_id FROM public.participants WHERE user_id = auth.uid())
);

-- 8. Event Templates
CREATE TABLE public.event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('corporate','wedding','jga','birthday','conference','festival','other')),
  event_type TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,
  times_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_event_templates_user ON public.event_templates(user_id);

CREATE POLICY "Users manage own templates"
ON public.event_templates FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_event_templates_updated_at
BEFORE UPDATE ON public.event_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Add missing columns to events for agency use
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS expected_guests INT,
ADD COLUMN IF NOT EXISTS planned_budget NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS actual_budget NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS event_phase TEXT DEFAULT 'planning' CHECK (event_phase IN ('inquiry','proposal','planning','pre_production','live','post_event','archived'));
