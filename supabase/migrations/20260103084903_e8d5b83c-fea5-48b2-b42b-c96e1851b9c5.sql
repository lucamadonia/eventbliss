-- Remove outdated CHECK constraints that block dynamic values
-- These constraints only allowed static values but event settings now define options dynamically

-- Drop destination check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_destination_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_destination_check;
  END IF;
END $$;

-- Drop budget check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_budget_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_budget_check;
  END IF;
END $$;

-- Drop duration_pref check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_duration_pref_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_duration_pref_check;
  END IF;
END $$;

-- Also check for any other naming patterns
DO $$ 
BEGIN
  -- Try alternative constraint names
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_destination_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_budget_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_duration_pref_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;