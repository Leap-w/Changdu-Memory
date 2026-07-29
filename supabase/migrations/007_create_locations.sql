-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 4-A: 地点档案系统 - locations 表
-- =============================================

-- 1. 创建 locations 表
CREATE TABLE IF NOT EXISTS public.locations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'life'
                CHECK (location_type IN ('school', 'city', 'travel', 'life', 'other')),
  description   TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  visit_date    DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own locations"
  ON public.locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON public.locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON public.locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON public.locations FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_locations_user_date
  ON public.locations(user_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_locations_user_type
  ON public.locations(user_id, location_type);
