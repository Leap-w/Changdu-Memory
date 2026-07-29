-- ============================================================
-- 昌都记忆 Changdu Memory V5.0 — 完整数据库Schema
-- ============================================================
-- 执行方式: Supabase Dashboard → SQL Editor → 粘贴全部执行
-- 执行顺序: 严格从上到下（自动处理外键依赖）
-- ============================================================

-- ============================================================
-- 0. 公共函数
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 新用户自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname) VALUES (NEW.id, '新用户');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- 1. profiles（用户信息）
-- ============================================================
-- 依赖: auth.users
-- PK: id = auth.users.id

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT DEFAULT '新用户',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE  USING (auth.uid() = id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. time_profile（时间配置）
-- ============================================================
-- 依赖: auth.users
-- 约束: 每用户仅一条 (UNIQUE user_id)

CREATE TABLE IF NOT EXISTS public.time_profile (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT DEFAULT '昌都记忆',
  location     TEXT DEFAULT '西藏昌都',
  start_date   DATE DEFAULT '2026-07-20',
  end_date     DATE DEFAULT '2027-07-20',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TRIGGER set_time_profile_updated_at
  BEFORE UPDATE ON public.time_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.time_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_profile_select" ON public.time_profile FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "time_profile_insert" ON public.time_profile FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_profile_update" ON public.time_profile FOR UPDATE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_time_profile_user_id ON public.time_profile(user_id);

-- ============================================================
-- 3. diaries（日记）
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.diaries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT '',
  content    TEXT DEFAULT '',
  diary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON public.diaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diaries_select" ON public.diaries FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "diaries_insert" ON public.diaries FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diaries_update" ON public.diaries FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "diaries_delete" ON public.diaries FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_diaries_user_date    ON public.diaries(user_id, diary_date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_user_created ON public.diaries(user_id, created_at DESC);

-- ============================================================
-- 4. todos（待办事项）
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  todo_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category    TEXT DEFAULT 'teaching' CHECK (category IN ('teaching', 'life', 'growth')),
  completed   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select" ON public.todos FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "todos_insert" ON public.todos FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update" ON public.todos FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "todos_delete" ON public.todos FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_todos_user_date      ON public.todos(user_id, todo_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON public.todos(user_id, completed);

-- ============================================================
-- 5. expenses（花费记录）
-- ============================================================
-- 依赖: auth.users
-- 注意: amount 使用 NUMERIC(10,2)，禁止 FLOAT

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

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date DESC);

-- ============================================================
-- 6. work_plans（工作安排）
-- ============================================================
-- 依赖: auth.users

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

CREATE TRIGGER set_work_plans_updated_at
  BEFORE UPDATE ON public.work_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.work_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_plans_select" ON public.work_plans FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "work_plans_insert" ON public.work_plans FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_plans_update" ON public.work_plans FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "work_plans_delete" ON public.work_plans FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_work_plans_user_date ON public.work_plans(user_id, work_date DESC);

-- ============================================================
-- 7. locations（地点档案）
-- ============================================================
-- 依赖: auth.users

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

CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select" ON public.locations FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "locations_insert" ON public.locations FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "locations_update" ON public.locations FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "locations_delete" ON public.locations FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_locations_user_date ON public.locations(user_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_locations_user_type ON public.locations(user_id, location_type);

-- ============================================================
-- 8. photo_records（照片档案）
-- ============================================================
-- 依赖: auth.users, locations(id)
-- FK→locations: ON DELETE SET NULL（删除地点时照片保留）

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

CREATE TRIGGER set_photo_records_updated_at
  BEFORE UPDATE ON public.photo_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.photo_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_records_select" ON public.photo_records FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "photo_records_insert" ON public.photo_records FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photo_records_update" ON public.photo_records FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "photo_records_delete" ON public.photo_records FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photo_records_user_date     ON public.photo_records(user_id, photo_date DESC);
CREATE INDEX IF NOT EXISTS idx_photo_records_user_category ON public.photo_records(user_id, category);

-- ============================================================
-- 9. tags & 关联表（统一标签系统）
-- ============================================================
-- 依赖: auth.users, diaries, photo_records, locations

-- 9a. tags 主表
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#4F8EF7',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TRIGGER set_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- 9b. diary_tags 关联表
CREATE TABLE IF NOT EXISTS public.diary_tags (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id  UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (diary_id, tag_id)
);

ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_tags_select" ON public.diary_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "diary_tags_insert" ON public.diary_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "diary_tags_delete" ON public.diary_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_diary_tags_diary ON public.diary_tags(diary_id);

-- 9c. photo_tags 关联表
CREATE TABLE IF NOT EXISTS public.photo_tags (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id  UUID NOT NULL REFERENCES public.photo_records(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (photo_id, tag_id)
);

ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_tags_select" ON public.photo_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.photo_records pr WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));
CREATE POLICY "photo_tags_insert" ON public.photo_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.photo_records pr WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));
CREATE POLICY "photo_tags_delete" ON public.photo_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.photo_records pr WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON public.photo_tags(photo_id);

-- 9d. location_tags 关联表
CREATE TABLE IF NOT EXISTS public.location_tags (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (location_id, tag_id)
);

ALTER TABLE public.location_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_tags_select" ON public.location_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));
CREATE POLICY "location_tags_insert" ON public.location_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));
CREATE POLICY "location_tags_delete" ON public.location_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_location_tags_location ON public.location_tags(location_id);

-- ============================================================
-- 完成
-- ============================================================
-- 总计: 9 张数据表 + 3 张关联表 = 12 张表
-- 总计: 60+ 条 RLS Policy
-- 总计: 17 个索引
-- ============================================================
