-- Add sharing columns to existing checklist_categories table
-- Run this if you've already created the checklist_categories table without sharing columns

-- Add is_shared column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_categories' 
    AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE checklist_categories ADD COLUMN is_shared BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- Add share_token column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_categories' 
    AND column_name = 'share_token'
  ) THEN
    ALTER TABLE checklist_categories ADD COLUMN share_token TEXT UNIQUE;
  END IF;
END $$;

-- Create indexes for sharing columns
CREATE INDEX IF NOT EXISTS idx_checklist_categories_share_token ON checklist_categories(share_token);
CREATE INDEX IF NOT EXISTS idx_checklist_categories_is_shared ON checklist_categories(is_shared);

-- Drop existing public policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Public can view shared checklist categories" ON checklist_categories;
DROP POLICY IF EXISTS "Public can view items from shared checklists" ON checklist_items;
DROP POLICY IF EXISTS "Public can update items in shared checklists" ON checklist_items;

-- Allow public to view shared checklists
CREATE POLICY "Public can view shared checklist categories" ON checklist_categories
  FOR SELECT USING (is_shared = true AND share_token IS NOT NULL);

-- Allow public to view items from shared checklists
CREATE POLICY "Public can view items from shared checklists" ON checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM checklist_categories c
      WHERE c.id = checklist_items.category_id
      AND c.is_shared = true
      AND c.share_token IS NOT NULL
    )
  );

-- Allow public to update items in shared checklists (for checking/unchecking)
CREATE POLICY "Public can update items in shared checklists" ON checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM checklist_categories c
      WHERE c.id = checklist_items.category_id
      AND c.is_shared = true
      AND c.share_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checklist_categories c
      WHERE c.id = checklist_items.category_id
      AND c.is_shared = true
      AND c.share_token IS NOT NULL
    )
  );

-- Function to generate a share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to enable sharing for a checklist
CREATE OR REPLACE FUNCTION share_checklist_category(p_category_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_share_token TEXT;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM checklist_categories WHERE id = p_category_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- Generate share token
  v_share_token := generate_share_token();

  -- Update category to be shared
  UPDATE checklist_categories
  SET is_shared = true, share_token = v_share_token
  WHERE id = p_category_id AND user_id = p_user_id;

  RETURN v_share_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable sharing for a checklist
CREATE OR REPLACE FUNCTION unshare_checklist_category(p_category_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM checklist_categories WHERE id = p_category_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- Update category to be unshared
  UPDATE checklist_categories
  SET is_shared = false, share_token = NULL
  WHERE id = p_category_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION share_checklist_category(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION share_checklist_category(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION unshare_checklist_category(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unshare_checklist_category(UUID, UUID) TO anon;

