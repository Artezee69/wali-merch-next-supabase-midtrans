import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProductsExplorer, { Product } from "@/components/ProductsExplorer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const fallbackProducts: Product[] = [
  {
    id: "fallback-1",
    name: "WALI Player Edition T-Shirt",
    slug: "wali-player-edition-tshirt",
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
  },
  {
    id: "fallback-2",
    name: "Regular Logo T-Shirt",
    slug: "regular-logo-tshirt",
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
  },
  {
    id: "fallback-3",
    name: "Vintage Stage Series",
    slug: "vintage-stage-series",
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

  const { data } = await supabaseAdmin
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products: Product[] =
    data && data.length > 0 ? (data as Product[]) : fallbackProducts;

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
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <Navbar />

      <PageHeader
        badge="Official Store"
        title="Shop"
        highlight="Collection"
        description="Pilih merchandise resmi WALI dengan tampilan premium, stok size, detail produk, dan checkout yang simple."
      />

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