-- Simplified popup ads: image + link only
CREATE TABLE IF NOT EXISTS public.popup_ads (
  id          BIGSERIAL PRIMARY KEY,
  image_url   TEXT NOT NULL,
  link        TEXT NOT NULL,
  status      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popup_ads_status ON public.popup_ads(status);

DROP TRIGGER IF EXISTS trg_popup_ads_touch_updated_at ON public.popup_ads;
CREATE TRIGGER trg_popup_ads_touch_updated_at
  BEFORE UPDATE ON public.popup_ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "popup_ads public read" ON public.popup_ads;
CREATE POLICY "popup_ads public read"
  ON public.popup_ads FOR SELECT
  USING (status = true);

DROP POLICY IF EXISTS "popup_ads admin all" ON public.popup_ads;
CREATE POLICY "popup_ads admin all"
  ON public.popup_ads FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-ads', 'popup-ads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "popup_ads storage public read" ON storage.objects;
CREATE POLICY "popup_ads storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'popup-ads');

DROP POLICY IF EXISTS "popup_ads storage admin write" ON storage.objects;
CREATE POLICY "popup_ads storage admin write"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'popup-ads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
