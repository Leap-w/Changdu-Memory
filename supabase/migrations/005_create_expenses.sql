-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 3-C: 花费记录系统 - expenses 表
-- =============================================

-- 1. 创建 expenses 表
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL DEFAULT 'other'
               CHECK (category IN ('food','transport','daily','study','medical','other')),
  description  TEXT DEFAULT '',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. 自动更新 updated_at
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. 开启 RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_expenses_user_date
  ON public.expenses(user_id, expense_date DESC);
