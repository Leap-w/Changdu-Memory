-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 3-D: 工作安排系统 - work_plans 表
-- =============================================

-- 1. 创建 work_plans 表
CREATE TABLE IF NOT EXISTS public.work_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  title       TEXT NOT NULL,
  period      TEXT NOT NULL DEFAULT 'morning'
              CHECK (period IN ('morning', 'afternoon', 'evening')),
  content     TEXT DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'teaching'
              CHECK (category IN ('teaching', 'meeting', 'training', 'other')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_work_plans_updated_at
  BEFORE UPDATE ON public.work_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.work_plans ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own work plans"
  ON public.work_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work plans"
  ON public.work_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work plans"
  ON public.work_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work plans"
  ON public.work_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_work_plans_user_date
  ON public.work_plans(user_id, work_date DESC);
