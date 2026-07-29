-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 4-B: 照片档案系统 - photo_records 表
-- =============================================

-- 1. 创建 photo_records 表
CREATE TABLE IF NOT EXISTS public.photo_records (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  title         TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  photo_date    DATE DEFAULT CURRENT_DATE,
  location_id   UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  category      TEXT NOT NULL DEFAULT 'life'
                CHECK (category IN ('school', 'life', 'travel', 'people', 'other')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_photo_records_updated_at
  BEFORE UPDATE ON public.photo_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.photo_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own photos"
  ON public.photo_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos"
  ON public.photo_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON public.photo_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON public.photo_records FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_photo_records_user_date
  ON public.photo_records(user_id, photo_date DESC);

CREATE INDEX IF NOT EXISTS idx_photo_records_user_category
  ON public.photo_records(user_id, category);
