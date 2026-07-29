-- ============================================================
-- 昌都记忆 Changdu Memory V5.0 — Phase 6-F: 软删除 + 备份记录
-- ============================================================
-- 执行方式: Supabase Dashboard → SQL Editor → 全部执行
-- 依赖: 所有业务表已存在（diaries/todos/expenses/work_plans/locations/photo_records）
-- ============================================================

-- 1. 为所有业务表增加 deleted_at 字段（软删除支持）
ALTER TABLE public.diaries       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.todos         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.expenses      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.work_plans    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.locations     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.photo_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. 为 deleted_at 创建索引（回收站查询用）
CREATE INDEX IF NOT EXISTS idx_diaries_deleted       ON public.diaries(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_deleted         ON public.todos(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_deleted      ON public.expenses(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_plans_deleted    ON public.work_plans(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_deleted     ON public.locations(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photo_records_deleted ON public.photo_records(user_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. 更新已有 fetch 查询：部分索引提升性能（已通过上面的 WHERE deleted_at IS NOT NULL 实现）

-- 4. 创建 backup_records 表（备份追踪）
CREATE TABLE IF NOT EXISTS public.backup_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'json',
  item_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_records_select" ON public.backup_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "backup_records_insert" ON public.backup_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backup_records_user ON public.backup_records(user_id, created_at DESC);
