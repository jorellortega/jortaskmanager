-- Verify that the share_checklist_category function exists and has correct permissions

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'share_checklist_category';

-- 2. Check function parameters
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.parameters p
WHERE p.specific_schema = 'public'
AND p.specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'share_checklist_category'
)
ORDER BY p.ordinal_position;

-- 3. Check permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name = 'share_checklist_category';

-- 4. If function doesn't exist, create it (run this if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'share_checklist_category'
    ) THEN
        RAISE NOTICE 'Function share_checklist_category does not exist. Please run add_checklist_sharing_columns.sql';
    ELSE
        RAISE NOTICE 'Function share_checklist_category exists';
    END IF;
END $$;

