-- =============================================
-- 昌都记忆 Changdu Memory V5.0
-- Phase 4-C: 统一标签系统
-- =============================================

-- 1. 创建 tags 表
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#4F8EF7',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 同一用户标签名称唯一
  UNIQUE (user_id, name)
);

CREATE TRIGGER set_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tags_user_id
  ON public.tags(user_id);

-- 2. 创建 diary_tags 关联表
CREATE TABLE IF NOT EXISTS public.diary_tags (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id  UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (diary_id, tag_id)
);

ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary tags"
  ON public.diary_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.diaries d
    WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own diary tags"
  ON public.diary_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diaries d
    WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own diary tags"
  ON public.diary_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.diaries d
    WHERE d.id = diary_id AND d.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_diary_tags_diary
  ON public.diary_tags(diary_id);

-- 3. 创建 photo_tags 关联表
CREATE TABLE IF NOT EXISTS public.photo_tags (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id  UUID NOT NULL REFERENCES public.photo_records(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (photo_id, tag_id)
);

ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photo tags"
  ON public.photo_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.photo_records pr
    WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own photo tags"
  ON public.photo_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.photo_records pr
    WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own photo tags"
  ON public.photo_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.photo_records pr
    WHERE pr.id = photo_id AND pr.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo
  ON public.photo_tags(photo_id);

-- 4. 创建 location_tags 关联表
CREATE TABLE IF NOT EXISTS public.location_tags (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (location_id, tag_id)
);

ALTER TABLE public.location_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own location tags"
  ON public.location_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_id AND l.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own location tags"
  ON public.location_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_id AND l.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own location tags"
  ON public.location_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = location_id AND l.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_location_tags_location
  ON public.location_tags(location_id);
