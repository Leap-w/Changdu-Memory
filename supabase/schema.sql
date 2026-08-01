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
  INSERT INTO public.profiles (id, nickname, bio) VALUES (NEW.id, '新用户', '');
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
  bio         TEXT DEFAULT '',
  school      TEXT,
  subject     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT  USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE  USING (auth.uid() = id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS set_time_profile_updated_at ON public.time_profile;
CREATE TRIGGER set_time_profile_updated_at
  BEFORE UPDATE ON public.time_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.time_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "time_profile_select" ON public.time_profile;
CREATE POLICY "time_profile_select" ON public.time_profile FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "time_profile_insert" ON public.time_profile;
CREATE POLICY "time_profile_insert" ON public.time_profile FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "time_profile_update" ON public.time_profile;
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

DROP TRIGGER IF EXISTS set_diaries_updated_at ON public.diaries;
CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON public.diaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diaries_select" ON public.diaries;
CREATE POLICY "diaries_select" ON public.diaries FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "diaries_insert" ON public.diaries;
CREATE POLICY "diaries_insert" ON public.diaries FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "diaries_update" ON public.diaries;
CREATE POLICY "diaries_update" ON public.diaries FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "diaries_delete" ON public.diaries;
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

DROP TRIGGER IF EXISTS set_todos_updated_at ON public.todos;
CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_select" ON public.todos;
CREATE POLICY "todos_select" ON public.todos FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_insert" ON public.todos;
CREATE POLICY "todos_insert" ON public.todos FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_update" ON public.todos;
CREATE POLICY "todos_update" ON public.todos FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_delete" ON public.todos;
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

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
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

DROP TRIGGER IF EXISTS set_work_plans_updated_at ON public.work_plans;
CREATE TRIGGER set_work_plans_updated_at
  BEFORE UPDATE ON public.work_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.work_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_plans_select" ON public.work_plans;
CREATE POLICY "work_plans_select" ON public.work_plans FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "work_plans_insert" ON public.work_plans;
CREATE POLICY "work_plans_insert" ON public.work_plans FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "work_plans_update" ON public.work_plans;
CREATE POLICY "work_plans_update" ON public.work_plans FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "work_plans_delete" ON public.work_plans;
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

DROP TRIGGER IF EXISTS set_locations_updated_at ON public.locations;
CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_select" ON public.locations;
CREATE POLICY "locations_select" ON public.locations FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "locations_insert" ON public.locations;
CREATE POLICY "locations_insert" ON public.locations FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "locations_update" ON public.locations;
CREATE POLICY "locations_update" ON public.locations FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "locations_delete" ON public.locations;
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

DROP TRIGGER IF EXISTS set_photo_records_updated_at ON public.photo_records;
CREATE TRIGGER set_photo_records_updated_at
  BEFORE UPDATE ON public.photo_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.photo_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photo_records_select" ON public.photo_records;
CREATE POLICY "photo_records_select" ON public.photo_records FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "photo_records_insert" ON public.photo_records;
CREATE POLICY "photo_records_insert" ON public.photo_records FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "photo_records_update" ON public.photo_records;
CREATE POLICY "photo_records_update" ON public.photo_records FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "photo_records_delete" ON public.photo_records;
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

DROP TRIGGER IF EXISTS set_tags_updated_at ON public.tags;
CREATE TRIGGER set_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_select" ON public.tags;
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tags_delete" ON public.tags;
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

DROP POLICY IF EXISTS "diary_tags_select" ON public.diary_tags;
CREATE POLICY "diary_tags_select" ON public.diary_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "diary_tags_insert" ON public.diary_tags;
CREATE POLICY "diary_tags_insert" ON public.diary_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "diary_tags_delete" ON public.diary_tags;
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

DROP POLICY IF EXISTS "photo_tags_select" ON public.photo_tags;
CREATE POLICY "photo_tags_select" ON public.photo_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.photo_records pr WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "photo_tags_insert" ON public.photo_tags;
CREATE POLICY "photo_tags_insert" ON public.photo_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.photo_records pr WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "photo_tags_delete" ON public.photo_tags;
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

DROP POLICY IF EXISTS "location_tags_select" ON public.location_tags;
CREATE POLICY "location_tags_select" ON public.location_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "location_tags_insert" ON public.location_tags;
CREATE POLICY "location_tags_insert" ON public.location_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "location_tags_delete" ON public.location_tags;
CREATE POLICY "location_tags_delete" ON public.location_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_location_tags_location ON public.location_tags(location_id);

-- ============================================================
-- 8b. diary_photos（日记照片）— V5.1 新增
-- ============================================================
-- 依赖: auth.users, diaries

CREATE TABLE IF NOT EXISTS public.diary_photos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id     UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_url    TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.diary_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diary_photos_select" ON public.diary_photos;
CREATE POLICY "diary_photos_select" ON public.diary_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "diary_photos_insert" ON public.diary_photos;
CREATE POLICY "diary_photos_insert" ON public.diary_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "diary_photos_delete" ON public.diary_photos;
CREATE POLICY "diary_photos_delete" ON public.diary_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_diary_photos_diary ON public.diary_photos(diary_id);

-- ============================================================
-- 1b. profiles 添加 bio 字段 — V5.1
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- ============================================================
-- 1c. profiles 添加 school / subject 字段 — V5.5.1
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject TEXT;

-- ============================================================
-- 10. schedules（课程表）— V5.1 新增
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.schedules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  class_name  TEXT NOT NULL DEFAULT '',
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  location    TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_schedules_updated_at ON public.schedules;
CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
CREATE POLICY "schedules_select" ON public.schedules FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_update" ON public.schedules;
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;
CREATE POLICY "schedules_delete" ON public.schedules FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_schedules_user_dow ON public.schedules(user_id, day_of_week);

-- ============================================================
-- 11. students（学生档案）— V5.1 新增
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.students (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  class_name  TEXT NOT NULL DEFAULT '',
  role        TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert" ON public.students;
CREATE POLICY "students_insert" ON public.students FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update" ON public.students;
CREATE POLICY "students_update" ON public.students FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete" ON public.students;
CREATE POLICY "students_delete" ON public.students FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_students_user_class ON public.students(user_id, class_name);

-- ============================================================
-- 12. work_plans 分类升级 — V5.1
-- ============================================================
-- 将 teaching 分类的记录迁移到 other
UPDATE public.work_plans SET category = 'other' WHERE category = 'teaching';

-- 删除旧约束，添加新约束
ALTER TABLE public.work_plans DROP CONSTRAINT IF EXISTS work_plans_category_check;
ALTER TABLE public.work_plans ADD CONSTRAINT work_plans_category_check
  CHECK (category IN ('meeting', 'exam_supervision', 'training', 'activity', 'other'));

-- ============================================================
-- 13. expenses 升级为账本 — V5.1
-- ============================================================
-- 添加 type 字段(income/expense)，更新分类约束
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';

-- 迁移完成后设置 NOT NULL
ALTER TABLE public.expenses ALTER COLUMN type SET NOT NULL;

-- 删除旧约束，添加新约束
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    -- 支出分类
    'food', 'transport', 'shopping', 'accommodation', 'study', 'entertainment', 'medical', 'other',
    -- 收入分类
    'salary', 'subsidy', 'bonus', 'part_time'
  ));

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_type_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_type_check
  CHECK (type IN ('income', 'expense'));

-- ============================================================
-- 14. assets（资产）— V5.1 新增
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select" ON public.assets;
CREATE POLICY "assets_select" ON public.assets FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "assets_insert" ON public.assets;
CREATE POLICY "assets_insert" ON public.assets FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "assets_update" ON public.assets;
CREATE POLICY "assets_update" ON public.assets FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "assets_delete" ON public.assets;
CREATE POLICY "assets_delete" ON public.assets FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assets_user ON public.assets(user_id);

-- ============================================================
-- 15. welfare_items（福利）— V5.1 新增
-- ============================================================
CREATE TABLE IF NOT EXISTS public.welfare_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'material'
                  CHECK (category IN ('school_welfare', 'material', 'coupon', 'gift', 'other')),
  description     TEXT DEFAULT '',
  value_estimate  NUMERIC(10,2) DEFAULT 0,
  received_date   DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_welfare_items_updated_at ON public.welfare_items;
CREATE TRIGGER set_welfare_items_updated_at
  BEFORE UPDATE ON public.welfare_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.welfare_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "welfare_items_select" ON public.welfare_items;
CREATE POLICY "welfare_items_select" ON public.welfare_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "welfare_items_insert" ON public.welfare_items;
CREATE POLICY "welfare_items_insert" ON public.welfare_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "welfare_items_update" ON public.welfare_items;
CREATE POLICY "welfare_items_update" ON public.welfare_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "welfare_items_delete" ON public.welfare_items;
CREATE POLICY "welfare_items_delete" ON public.welfare_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_welfare_items_user ON public.welfare_items(user_id, received_date DESC);

-- ============================================================
-- 16. memories（大事记）— V5.2
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.memories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT DEFAULT '',
  event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL DEFAULT 'life'
              CHECK (category IN ('school', 'activity', 'travel', 'life', 'important')),
  image_urls  TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_memories_updated_at ON public.memories;
CREATE TRIGGER set_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select" ON public.memories;
CREATE POLICY "memories_select" ON public.memories FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_insert" ON public.memories;
CREATE POLICY "memories_insert" ON public.memories FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_update" ON public.memories;
CREATE POLICY "memories_update" ON public.memories FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_delete" ON public.memories;
CREATE POLICY "memories_delete" ON public.memories FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memories_user_date ON public.memories(user_id, event_date DESC);

-- ============================================================
-- 17. memory_photos（大事记照片）— V5.3 新增
-- ============================================================
-- 依赖: public.memories
-- RLS: 通过关联 memories 表的 user_id 验证

CREATE TABLE IF NOT EXISTS public.memory_photos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id    UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url          TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.memory_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_photos_select" ON public.memory_photos;
CREATE POLICY "memory_photos_select" ON public.memory_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.memories m WHERE m.id = memory_id AND m.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "memory_photos_insert" ON public.memory_photos;
CREATE POLICY "memory_photos_insert" ON public.memory_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.memories m WHERE m.id = memory_id AND m.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "memory_photos_delete" ON public.memory_photos;
CREATE POLICY "memory_photos_delete" ON public.memory_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.memories m WHERE m.id = memory_id AND m.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_memory_photos_memory ON public.memory_photos(memory_id);

-- ============================================================
-- 18. countdowns（倒计时）— V5.2
-- ============================================================
-- 依赖: auth.users

CREATE TABLE IF NOT EXISTS public.countdowns (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE NOT NULL,
  pinned      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_countdowns_updated_at ON public.countdowns;
CREATE TRIGGER set_countdowns_updated_at
  BEFORE UPDATE ON public.countdowns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countdowns_select" ON public.countdowns;
CREATE POLICY "countdowns_select" ON public.countdowns FOR SELECT  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "countdowns_insert" ON public.countdowns;
CREATE POLICY "countdowns_insert" ON public.countdowns FOR INSERT  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "countdowns_update" ON public.countdowns;
CREATE POLICY "countdowns_update" ON public.countdowns FOR UPDATE  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "countdowns_delete" ON public.countdowns;
CREATE POLICY "countdowns_delete" ON public.countdowns FOR DELETE  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_countdowns_user_pinned ON public.countdowns(user_id, pinned);

-- ============================================================
-- 19. todos 增加 deadline 字段 — V5.3
-- ============================================================
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS deadline_date DATE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS deadline_time TIME;

-- ============================================================
-- 20. todos / work_plans / expenses / diaries 增加软删除 — V5.2
-- ============================================================
ALTER TABLE public.todos      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.work_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.expenses   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.diaries    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- 21. diaries 增加 weather / mood — V5.2
-- ============================================================
ALTER TABLE public.diaries ADD COLUMN IF NOT EXISTS weather TEXT;
ALTER TABLE public.diaries ADD COLUMN IF NOT EXISTS mood TEXT;

-- ============================================================
-- 22. journey_milestones（一年旅程节点）— V5.5.2
-- ============================================================
-- 依赖: auth.users
-- 说明: 可自定义的旅程节点（label / description / start_date），
--       首次访问时由后端自动写入默认节点（日期按旅程起止比例推算，见 JourneyRepository）
--       start_date 表示各阶段的开始日期

CREATE TABLE IF NOT EXISTS public.journey_milestones (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date  DATE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_journey_milestones_updated_at ON public.journey_milestones;
CREATE TRIGGER set_journey_milestones_updated_at
  BEFORE UPDATE ON public.journey_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journey_milestones_select" ON public.journey_milestones;
CREATE POLICY "journey_milestones_select" ON public.journey_milestones FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "journey_milestones_insert" ON public.journey_milestones;
CREATE POLICY "journey_milestones_insert" ON public.journey_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "journey_milestones_update" ON public.journey_milestones;
CREATE POLICY "journey_milestones_update" ON public.journey_milestones FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "journey_milestones_delete" ON public.journey_milestones;
CREATE POLICY "journey_milestones_delete" ON public.journey_milestones FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journey_milestones_user ON public.journey_milestones(user_id, sort_order);

-- ============================================================
-- 23. memories 增加 location（地点/地址）— V5.5.2
-- ============================================================
-- 大事记不再使用固定分类（保留 category 字段兼容旧数据），
-- 新增自定义地点/地址字段用于展示。

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

-- ============================================================
-- 24. moods（心情记录）— V5.5.2
-- ============================================================
-- 依赖: auth.users
-- 说明: 一天可记录多条心情；mood_date 为日期，created_at 为设置时间点，
--       外部卡片按 created_at 倒序取最新一条展示。
--       每次保存时快照 label/emoji，保证历史记录不被后续编辑影响。

CREATE TABLE IF NOT EXISTS public.moods (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '😊',
  note        TEXT DEFAULT '',
  mood_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_moods_updated_at ON public.moods;
CREATE TRIGGER set_moods_updated_at
  BEFORE UPDATE ON public.moods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moods_select" ON public.moods;
CREATE POLICY "moods_select" ON public.moods FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "moods_insert" ON public.moods;
CREATE POLICY "moods_insert" ON public.moods FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "moods_update" ON public.moods;
CREATE POLICY "moods_update" ON public.moods FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "moods_delete" ON public.moods;
CREATE POLICY "moods_delete" ON public.moods FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_moods_user_date ON public.moods(user_id, mood_date DESC, created_at DESC);

-- ============================================================
-- 25. mood_options（自定义心情选项）— V5.5.2
-- ============================================================
-- 依赖: auth.users
-- 说明: 用户自定义的心情选项（标签 + emoji），按 sort_order 排序显示。

CREATE TABLE IF NOT EXISTS public.mood_options (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '😊',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_mood_options_updated_at ON public.mood_options;
CREATE TRIGGER set_mood_options_updated_at
  BEFORE UPDATE ON public.mood_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.mood_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_options_select" ON public.mood_options;
CREATE POLICY "mood_options_select" ON public.mood_options FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "mood_options_insert" ON public.mood_options;
CREATE POLICY "mood_options_insert" ON public.mood_options FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "mood_options_update" ON public.mood_options;
CREATE POLICY "mood_options_update" ON public.mood_options FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "mood_options_delete" ON public.mood_options;
CREATE POLICY "mood_options_delete" ON public.mood_options FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_options_user ON public.mood_options(user_id, sort_order);

-- ============================================================
-- 26. journey_milestones 迁移：position 百分比 → start_date 日期 — V5.5.2
-- ============================================================
-- 兼容已执行过旧版（position 0-100）的库：
-- 新增 start_date 列，删除 position 列。
-- 旧数据 start_date 为空，前端访问时会自动按旅程起止日期比例补算默认日期。

ALTER TABLE public.journey_milestones ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.journey_milestones DROP COLUMN IF EXISTS position;

-- ============================================================
-- 完成
-- ============================================================
-- 总计: 17 张数据表 + 3 张关联表 = 20 张表
-- 总计: 115+ 条 RLS Policy
-- 总计: 31 个索引
-- ============================================================
