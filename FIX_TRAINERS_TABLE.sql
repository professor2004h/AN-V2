-- ================================
-- FIX TRAINERS TABLE - ADD BIO COLUMN
-- Execute this in Supabase SQL Editor
-- ================================

-- Add bio column to trainers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trainers' AND column_name = 'bio'
    ) THEN
        ALTER TABLE trainers ADD COLUMN bio TEXT;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainers'
ORDER BY ordinal_position;

SELECT '✅ Trainers table fixed! Bio column added.' as status;

