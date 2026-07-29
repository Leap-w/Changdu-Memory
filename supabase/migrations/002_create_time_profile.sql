-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 2-B: 时光中心 - time_profile 表
-- =============================================

-- 1. 创建 time_profile 表
CREATE TABLE IF NOT EXISTS public.time_profile (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT DEFAULT '昌都记忆',
  location     TEXT DEFAULT '西藏昌都',
  start_date   DATE DEFAULT '2026-07-20',
  end_date     DATE DEFAULT '2027-07-20',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),

  -- 每个用户仅一条记录
  UNIQUE (user_id)
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_time_profile_updated_at
  BEFORE UPDATE ON public.time_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.time_profile ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own time profile"
  ON public.time_profile
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time profile"
  ON public.time_profile
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time profile"
  ON public.time_profile
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_time_profile_user_id
  ON public.time_profile(user_id);
