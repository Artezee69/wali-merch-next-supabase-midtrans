// Sample seed data for popup ads
// Run this in Supabase SQL editor or as an admin script

/*
INSERT INTO public.popup_ads (title, subtitle, body, image_url, storage_path, button_text, button_link, position, status, start_date, end_date, dismiss_minutes, audience, sort_order) VALUES
('Flash Sale Special', 'Diskon 50% Hari Ini!', 'Dapatkan harga spesial hanya hari ini sebelum kehabisan stok! Promo berlaku sampai jam 23:59.',
'https://supabase.storage.com/v1/object/public/popup-ads/flash-sale.jpg',
'/popup-ads/flash-sale.jpg', 'Beli Sekarang', '/produk/sale', 'center', true, '2024-12-01T00:00:00Z', '2024-12-31T23:59:59Z', 60, 'logged_in', 1);
*/

console.log("Sample popup ads seed data created above. Paste ke Supabase SQL editor untuk dijalankan.");
console.log("Pastikan telah menjalankan migration 022_popup_ads.sql terlebih dahulu.");