-- ==========================================
-- SETUP BRAND GUARD (BRAND KITS)
-- ==========================================

-- 1. Create the brand_kits table
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id TEXT,
  name TEXT NOT NULL,
  colors JSONB NOT NULL, -- Format: { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "text": "#..." }
  fonts JSONB NOT NULL,  -- Format: { "heading": "Inter", "body": "Inter" }
  logo_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_overlay JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX brand_kits_org_id_idx ON brand_kits(org_id);

-- 2. Enable Row Level Security (RLS)
-- This is critical so users can only access their own data
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies

-- Policy: Users can view their own brand kits
CREATE POLICY "Users can view their own brand kits" 
ON brand_kits FOR SELECT 
USING (auth.uid() = user_id AND org_id IS NULL);

-- Policy: Users can insert their own brand kits
CREATE POLICY "Users can insert their own brand kits" 
ON brand_kits FOR INSERT 
WITH CHECK (auth.uid() = user_id AND org_id IS NULL);

-- Policy: Users can update their own brand kits
CREATE POLICY "Users can update their own brand kits" 
ON brand_kits FOR UPDATE 
USING (auth.uid() = user_id AND org_id IS NULL);

-- Policy: Users can delete their own brand kits
CREATE POLICY "Users can delete their own brand kits" 
ON brand_kits FOR DELETE 
USING (auth.uid() = user_id AND org_id IS NULL);

-- Team brand kits are accessed through the authenticated backend API, which
-- validates the x-org-id workspace context and organization membership.

-- ==========================================
-- OPTIONAL: Storage for Logos
-- ==========================================
-- If you haven't created a 'public' bucket yet:
-- insert into storage.buckets (id, name, public) values ('public', 'public', true);

-- Policy to allow authenticated users to upload brand logos
-- CREATE POLICY "Users can upload brand logos"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'public' AND auth.role() = 'authenticated' );
