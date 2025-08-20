-- Create subscriptions table for tracking recurring bills and subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_billing_date DATE NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON subscriptions(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add some sample categories if you want to extend the existing ones
-- You can modify the categories array in your frontend code to match
-- INSERT INTO subscription_categories (name) VALUES 
--   ('Streaming Services'),
--   ('Gym & Fitness'),
--   ('Software & Apps'),
--   ('Memberships'),
--   ('Insurance'),
--   ('Utilities'),
--   ('Rent & Mortgage'),
--   ('Phone & Internet'),
--   ('Transportation'),
--   ('Other');
