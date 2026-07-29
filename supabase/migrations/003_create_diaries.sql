-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 3-A: 日记系统 - diaries 表
-- =============================================

-- 1. 创建 diaries 表
CREATE TABLE IF NOT EXISTS public.diaries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT '',
  content    TEXT DEFAULT '',
  diary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON public.diaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own diaries"
  ON public.diaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diaries"
  ON public.diaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diaries"
  ON public.diaries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diaries"
  ON public.diaries
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_diaries_user_date
  ON public.diaries(user_id, diary_date DESC);

CREATE INDEX IF NOT EXISTS idx_diaries_user_created
  ON public.diaries(user_id, created_at DESC);
