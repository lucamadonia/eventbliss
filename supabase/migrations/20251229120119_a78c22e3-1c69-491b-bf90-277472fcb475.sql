-- Add soft-delete columns to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

-- Add index for efficient querying of non-deleted expenses
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at) WHERE deleted_at IS NULL;

-- Allow organizers to see deleted expenses for audit trail
COMMENT ON COLUMN public.expenses.deleted_at IS 'Soft-delete timestamp - NULL means not deleted';
COMMENT ON COLUMN public.expenses.deleted_by IS 'User ID who deleted the expense';
COMMENT ON COLUMN public.expenses.deletion_reason IS 'Optional reason for deletion';