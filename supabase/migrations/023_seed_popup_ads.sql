-- Seed: Contoh popup ads sederhana
-- Taruh gambar di Supabase Storage bucket: popup-ads
-- Atau pakai URL langsung

INSERT INTO public.popup_ads (image_url, link, status, sort_order) VALUES
  ('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', '/products', true, 1),
  ('https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80', '/products?category=new', true, 2);

SELECT id, image_url, link, status FROM public.popup_ads ORDER BY sort_order;
