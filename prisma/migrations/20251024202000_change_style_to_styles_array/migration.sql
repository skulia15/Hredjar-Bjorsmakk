-- AlterTable: Change style from String to String[] (styles)
-- Step 1: Add new styles column as array (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Beer' AND column_name = 'styles') THEN
        ALTER TABLE "Beer" ADD COLUMN "styles" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Step 2: Migrate existing style data to styles array (if style column exists and is not null)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'Beer' AND column_name = 'style') THEN
        UPDATE "Beer" SET "styles" = ARRAY[style] WHERE style IS NOT NULL AND (styles IS NULL OR array_length(styles, 1) IS NULL);
    END IF;
END $$;

-- Step 3: Drop old style column (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'Beer' AND column_name = 'style') THEN
        ALTER TABLE "Beer" DROP COLUMN "style";
    END IF;
END $$;
