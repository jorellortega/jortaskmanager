-- Checklist Tables Migration
-- Creates tables for checklist categories and items

-- Create checklist_categories table
CREATE TABLE IF NOT EXISTS checklist_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_name TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE NOT NULL,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_name)
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES checklist_categories(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_categories_user_id ON checklist_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_categories_name ON checklist_categories(category_name);
CREATE INDEX IF NOT EXISTS idx_checklist_categories_share_token ON checklist_categories(share_token);
CREATE INDEX IF NOT EXISTS idx_checklist_categories_is_shared ON checklist_categories(is_shared);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category_id ON checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON checklist_items(completed);
CREATE INDEX IF NOT EXISTS idx_checklist_items_sort_order ON checklist_items(sort_order);

-- Enable Row Level Security (RLS)
ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_categories
CREATE POLICY "Users can view their own checklist categories" ON checklist_categories
  FOR SELECT USING (auth.uid() = user_id);

-- Allow public to view shared checklists
CREATE POLICY "Public can view shared checklist categories" ON checklist_categories
  FOR SELECT USING (is_shared = true AND share_token IS NOT NULL);

CREATE POLICY "Users can insert their own checklist categories" ON checklist_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist categories" ON checklist_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist categories" ON checklist_categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for checklist_items
CREATE POLICY "Users can view their own checklist items" ON checklist_items
  FOR SELECT USING (auth.uid() = user_id);

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

CREATE POLICY "Users can insert their own checklist items" ON checklist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can update their own checklist items" ON checklist_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items" ON checklist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_checklist_categories_updated_at 
  BEFORE UPDATE ON checklist_categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at 
  BEFORE UPDATE ON checklist_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to get checklist with items
CREATE OR REPLACE FUNCTION get_user_checklists(p_user_id UUID)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  item_id UUID,
  item_text TEXT,
  item_completed BOOLEAN,
  item_sort_order INTEGER,
  item_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS category_id,
    c.category_name,
    i.id AS item_id,
    i.text AS item_text,
    i.completed AS item_completed,
    i.sort_order AS item_sort_order,
    i.created_at AS item_created_at
  FROM checklist_categories c
  LEFT JOIN checklist_items i ON c.id = i.category_id
  WHERE c.user_id = p_user_id
  ORDER BY c.category_name, i.sort_order, i.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_checklists(UUID) TO authenticated;

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

