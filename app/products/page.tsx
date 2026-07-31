import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsExplorer, { Product } from "@/components/ProductsExplorer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const fallbackProducts: Product[] = [
  {
    id: "fallback-1",
    name: "WALI Player Edition T-Shirt",
    slug: "fallback-wali-player",
    price: 199000,
    category: "T-Shirt",
    description: "Official merchandise WALI Player Edition regular fit.",
    product_images: [
      {
        image_url:
          "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop",
      },
    ],
    product_variants: [
      { size: "S", stock: 5 },
      { size: "M", stock: 10 },
      { size: "L", stock: 10 },
      { size: "XL", stock: 5 },
    ],
    soldCount: 142, // Contoh data penjualan
    rating: { avg: 4.7, count: 28 }, // Contoh rating
  },
  {
    id: "fallback-2",
    name: "Regular Logo T-Shirt",
    slug: "fallback-regular-logo",
    price: 159000,
    category: "T-Shirt",
    description: "Clean daily wear merchandise dengan desain minimal premium.",
    product_images: [
      {
        image_url:
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
      },
    ],
    product_variants: [
      { size: "M", stock: 8 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 4 },
    ],
    soldCount: 89,
    rating: { avg: 4.5, count: 15 },
  },
  {
    id: "fallback-3",
    name: "Vintage Stage Series",
    slug: "fallback-vintage-stage",
    price: 0,
    category: "Coming Soon",
    description: "Limited drop dengan vibe vintage stage culture.",
    product_images: [
      {
        image_url:
          "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=1200&auto=format&fit=crop",
      },
    ],
    product_variants: [{ size: "Coming Soon", stock: 0 }],
    soldCount: 0,
    // rating omited for coming soon products (no reviews available)
  },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params?.q || "";
  const initialCategory = params?.category || "All";

  const { data: productsData } = await supabaseAdmin
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fetch order_items to calculate sold quantities
  const { data: orderItems } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity");

  // Compute total sold per product ID
  const soldByProduct: Record<string, number> = {};
  if (orderItems) {
    orderItems.forEach(item => {
      if (item.product_id && item.quantity !== undefined) {
        soldByProduct[item.product_id] = (soldByProduct[item.product_id] || 0) + Number(item.quantity);
      }
    });
  }

  // Enrich products with soldCount
  const products = (productsData ?? []).map((p: any) => ({
    ...p,
    soldCount: soldByProduct[p.id] || 0,
    rating: null, // Placeholder - ratings will be added when reviews table exists
  })) as Product[];

  const categories: string[] = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  return (
    <main className="min-h-screen bg-black text-white dark:bg-black dark:text-white">
      <Navbar />

      <ProductsExplorer
        products={products}
        categories={categories}
        initialCategory={initialCategory}
        initialQuery={initialQuery}
      />

      <Footer />
    </main>
  );
}