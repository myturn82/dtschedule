-- Prevent duplicate assignment of the same volunteer to the same slot.
-- Excludes admin_note entries (which reuse volunteer_name for color hex values).
CREATE UNIQUE INDEX IF NOT EXISTS unique_volunteer_assignment
ON assignments (year, month, day, time_slot, volunteer_name)
WHERE volunteer_type != 'admin_note';
