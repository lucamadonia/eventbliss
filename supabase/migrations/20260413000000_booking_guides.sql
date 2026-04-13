-- ============================================================
-- Booking Guides System
-- ============================================================

-- 1. Agency Guides
CREATE TABLE public.agency_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  max_daily_bookings INT DEFAULT 3,
  color TEXT DEFAULT '#8b5cf6',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Booking ↔ Guide assignments
CREATE TABLE public.booking_guide_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES marketplace_bookings(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES agency_guides(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary',
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, guide_id)
);

-- 3. Service ↔ Guide qualifications
CREATE TABLE public.service_guide_qualifications (
  service_id UUID NOT NULL REFERENCES marketplace_services(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES agency_guides(id) ON DELETE CASCADE,
  qualified_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (service_id, guide_id)
);

-- 4. Weekly availability slots
CREATE TABLE public.guide_availability (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES agency_guides(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  CHECK (end_time > start_time)
);

-- 5. Blocked dates
CREATE TABLE public.guide_blocked_dates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES agency_guides(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  UNIQUE(guide_id, blocked_date)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_agency_guides_agency ON agency_guides(agency_id);
CREATE INDEX idx_booking_guide_assignments_booking ON booking_guide_assignments(booking_id);
CREATE INDEX idx_booking_guide_assignments_guide ON booking_guide_assignments(guide_id);
CREATE INDEX idx_guide_availability_guide ON guide_availability(guide_id);
CREATE INDEX idx_guide_blocked_dates_guide ON guide_blocked_dates(guide_id);

-- ============================================================
-- Updated-at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_agency_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agency_guides_updated_at
  BEFORE UPDATE ON agency_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_guides_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE agency_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_guide_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_guide_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Helper: check if user belongs to the agency
CREATE OR REPLACE FUNCTION is_agency_member(p_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- agency_guides policies
CREATE POLICY "Agency members can view their guides"
  ON agency_guides FOR SELECT
  USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can insert guides"
  ON agency_guides FOR INSERT
  WITH CHECK (is_agency_member(agency_id));

CREATE POLICY "Agency members can update their guides"
  ON agency_guides FOR UPDATE
  USING (is_agency_member(agency_id));

CREATE POLICY "Agency members can delete their guides"
  ON agency_guides FOR DELETE
  USING (is_agency_member(agency_id));

-- booking_guide_assignments policies
CREATE POLICY "Agency members can view assignments"
  ON booking_guide_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can insert assignments"
  ON booking_guide_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can update assignments"
  ON booking_guide_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can delete assignments"
  ON booking_guide_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

-- service_guide_qualifications policies
CREATE POLICY "Agency members can view qualifications"
  ON service_guide_qualifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can insert qualifications"
  ON service_guide_qualifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can delete qualifications"
  ON service_guide_qualifications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

-- guide_availability policies
CREATE POLICY "Agency members can view availability"
  ON guide_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can insert availability"
  ON guide_availability FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can update availability"
  ON guide_availability FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can delete availability"
  ON guide_availability FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

-- guide_blocked_dates policies
CREATE POLICY "Agency members can view blocked dates"
  ON guide_blocked_dates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can insert blocked dates"
  ON guide_blocked_dates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

CREATE POLICY "Agency members can delete blocked dates"
  ON guide_blocked_dates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM agency_guides g
    WHERE g.id = guide_id AND is_agency_member(g.agency_id)
  ));

-- Admin full access (service_role bypasses RLS by default)
