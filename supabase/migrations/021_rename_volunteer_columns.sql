-- Drop existing unique index that references old column names
DROP INDEX IF EXISTS unique_volunteer_assignment;

-- Rename columns
ALTER TABLE assignments RENAME COLUMN volunteer_name TO member_name;
ALTER TABLE assignments RENAME COLUMN volunteer_type TO member_type;

-- Update stored type value: 'volunteer' → 'member'
UPDATE assignments SET member_type = 'member' WHERE member_type = 'volunteer';

-- Recreate unique index with new column names
CREATE UNIQUE INDEX unique_member_assignment
ON assignments (year, month, day, time_slot, member_name)
WHERE member_type != 'admin_note';
