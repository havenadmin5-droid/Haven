-- Phase 4: Jobs & Events Migration
-- Create jobs, job_saves, events, event_rsvps tables with RLS

-- ============================================
-- ENUMS
-- ============================================

-- Job type enum
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'freelance', 'internship', 'contract');

-- Event category enum
CREATE TYPE event_category AS ENUM ('art', 'music', 'tech', 'wellness', 'dance', 'books', 'fitness', 'social', 'support', 'workshop');

-- RSVP status enum
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'waitlisted');

-- ============================================
-- JOBS TABLE
-- ============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  company TEXT NOT NULL CHECK (char_length(company) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 3000),
  city TEXT NOT NULL,
  job_type job_type NOT NULL DEFAULT 'full_time',
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  salary_range TEXT,
  tags TEXT[] DEFAULT '{}',
  apply_url TEXT,
  apply_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================
-- JOB_SAVES TABLE
-- ============================================

CREATE TABLE job_saves (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

-- Index for job saves
CREATE INDEX idx_job_saves_user_id ON job_saves(user_id);

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  city TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  end_time TIME,
  category event_category NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  attendee_count INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  emoji TEXT DEFAULT '🎉',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_private ON events(is_private);
CREATE INDEX idx_events_community_id ON events(community_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ============================================
-- EVENT_RSVPS TABLE
-- ============================================

CREATE TABLE event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Indexes for RSVPs
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(status);

-- ============================================
-- TRIGGERS FOR ATTENDEE COUNT
-- ============================================

-- Increment attendee count on RSVP (only for 'going' status)
CREATE OR REPLACE FUNCTION increment_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'going' THEN
    UPDATE events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_attendee_count
AFTER INSERT ON event_rsvps
FOR EACH ROW
EXECUTE FUNCTION increment_attendee_count();

-- Decrement attendee count on RSVP delete (only if was 'going')
CREATE OR REPLACE FUNCTION decrement_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'going' THEN
    UPDATE events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_decrement_attendee_count
AFTER DELETE ON event_rsvps
FOR EACH ROW
EXECUTE FUNCTION decrement_attendee_count();

-- Update attendee count on status change
CREATE OR REPLACE FUNCTION update_attendee_count_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement if old status was 'going'
  IF OLD.status = 'going' AND NEW.status != 'going' THEN
    UPDATE events SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = NEW.event_id;
  -- Increment if new status is 'going'
  ELSIF OLD.status != 'going' AND NEW.status = 'going' THEN
    UPDATE events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_attendee_count
AFTER UPDATE ON event_rsvps
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_attendee_count_on_status_change();

-- ============================================
-- AUTO-EXPIRE JOBS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void AS $$
BEGIN
  UPDATE jobs
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WAITLIST PROMOTION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  v_capacity INTEGER;
  v_attendee_count INTEGER;
  v_waitlist_user UUID;
BEGIN
  -- Get event capacity and current count
  SELECT capacity, attendee_count INTO v_capacity, v_attendee_count
  FROM events WHERE id = OLD.event_id;

  -- If capacity exists and there's room, promote first waitlisted user
  IF v_capacity IS NOT NULL AND v_attendee_count < v_capacity THEN
    SELECT user_id INTO v_waitlist_user
    FROM event_rsvps
    WHERE event_id = OLD.event_id AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_waitlist_user IS NOT NULL THEN
      UPDATE event_rsvps
      SET status = 'going'
      WHERE event_id = OLD.event_id AND user_id = v_waitlist_user;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_promote_from_waitlist
AFTER DELETE ON event_rsvps
FOR EACH ROW
WHEN (OLD.status = 'going')
EXECUTE FUNCTION promote_from_waitlist();

-- ============================================
-- RLS POLICIES - JOBS
-- ============================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active jobs (respecting blocks)
CREATE POLICY "Anyone can view active jobs"
ON jobs FOR SELECT
USING (
  is_active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW())
  AND NOT is_blocked(auth.uid(), posted_by)
);

-- Users can view their own jobs (active or inactive)
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = posted_by);

-- Authenticated users can create jobs
CREATE POLICY "Authenticated users can create jobs"
ON jobs FOR INSERT
WITH CHECK (auth.uid() = posted_by);

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs"
ON jobs FOR UPDATE
USING (auth.uid() = posted_by);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
ON jobs FOR DELETE
USING (auth.uid() = posted_by);

-- ============================================
-- RLS POLICIES - JOB_SAVES
-- ============================================

ALTER TABLE job_saves ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved jobs
CREATE POLICY "Users can view own saved jobs"
ON job_saves FOR SELECT
USING (auth.uid() = user_id);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
ON job_saves FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave jobs
CREATE POLICY "Users can unsave jobs"
ON job_saves FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - EVENTS
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can view public events (basic info, respecting blocks)
CREATE POLICY "Anyone can view public events"
ON events FOR SELECT
USING (
  NOT is_blocked(auth.uid(), host_id)
);

-- Users can view their own events
CREATE POLICY "Users can view own events"
ON events FOR SELECT
USING (auth.uid() = host_id);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
WITH CHECK (auth.uid() = host_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
ON events FOR UPDATE
USING (auth.uid() = host_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
ON events FOR DELETE
USING (auth.uid() = host_id);

-- ============================================
-- RLS POLICIES - EVENT_RSVPS
-- ============================================

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view RSVPs for events they're attending or hosting
CREATE POLICY "Users can view relevant RSVPs"
ON event_rsvps FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND host_id = auth.uid()
  )
);

-- Attendee count is public (via events table)
-- But individual RSVPs are private unless you're the host

-- Users can RSVP to events
CREATE POLICY "Users can RSVP to events"
ON event_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVP
CREATE POLICY "Users can update own RSVP"
ON event_rsvps FOR UPDATE
USING (auth.uid() = user_id);

-- Users can cancel their RSVP
CREATE POLICY "Users can cancel RSVP"
ON event_rsvps FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET FOR EVENT COVERS
-- ============================================

-- Note: Create via Supabase Dashboard or API:
-- Bucket: event-covers
-- Public: true
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- Max file size: 5MB

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON jobs TO authenticated;
GRANT ALL ON job_saves TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_rsvps TO authenticated;
GRANT SELECT ON jobs TO anon;
GRANT SELECT ON events TO anon;
