-- Drop existing unique index that references old column names
DROP INDEX IF EXISTS unique_volunteer_assignment;

-- Rename columns (idempotent: skip if already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'volunteer_name'
  ) THEN
    ALTER TABLE assignments RENAME COLUMN volunteer_name TO member_name;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'volunteer_type'
  ) THEN
    ALTER TABLE assignments RENAME COLUMN volunteer_type TO member_type;
  END IF;
END $$;

-- Update stored type value: 'volunteer' → 'member'
UPDATE assignments SET member_type = 'member' WHERE member_type = 'volunteer';

-- Recreate unique index with new column names
DROP INDEX IF EXISTS unique_member_assignment;
CREATE UNIQUE INDEX unique_member_assignment
ON assignments (year, month, day, time_slot, member_name)
WHERE member_type != 'admin_note';
