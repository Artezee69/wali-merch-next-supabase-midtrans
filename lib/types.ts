// ===== Products =====

export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type ProductCondition = "new" | "used" | "refurbished";

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  option_1_name: string | null;
  option_1_value: string | null;
  option_2_name: string | null;
  option_2_value: string | null;
  // Legacy fields kept for compatibility with AddToCart
  size: string | null;
  color: string | null;
  sku: string | null;
  price: number | null;
  sale_price: number | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  weight: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  condition: ProductCondition;
  status: ProductStatus;
  base_price: number | null;
  sale_price: number | null;
  price: number;
  stock: number;
  sku: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  has_variants: boolean;
  is_featured: boolean;
  is_new: boolean;
  min_purchase: number;
  max_purchase: number;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  is_preorder: boolean;
  preorder_processing_days: number | null;
  admin_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
};

// Input type untuk create/update produk
export type ProductInput = {
  name: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  condition?: ProductCondition;
  status?: ProductStatus;
  base_price?: number | null;
  sale_price?: number | null;
  stock?: number;
  sku?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  has_variants?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  min_purchase?: number;
  max_purchase?: number;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_url?: string | null;
  is_preorder?: boolean;
  preorder_processing_days?: number | null;
  admin_notes?: string | null;
};

export type ProductVariantInput = {
  id?: string; // ada = update, tidak ada = insert baru
  option_1_name?: string | null;
  option_1_value?: string | null;
  option_2_name?: string | null;
  option_2_value?: string | null;
  sku?: string | null;
  price?: number | null;
  sale_price?: number | null;
  stock?: number;
  image_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  weight?: number | null;
};

export type Variant = { id: string; product_id: string; size: string; stock: number };

export type CartItem = {
  id?: string;
  product_id: string;
  variant_id: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  image_url?: string;
  quantity: number;
};

// ===== Auth / Profile types =====
export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  profile_image_url: string | null;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdateInput = Partial<Omit<Profile, "id" | "email" | "created_at" | "updated_at">>;

export type Cart = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CartItemDB = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price_at_add: number;
  created_at: string;
  updated_at: string;
};

// ===== Register form =====
export type RegisterInput = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  birth_date: string;
  gender: "male" | "female" | "other" | "";
  privacy_accepted: boolean;
  profile_image: File | null;
};

export type RegisterValidationErrors = {
  full_name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  address?: string;
  gender?: string;
  privacy_accepted?: string;
  profile_image?: string;
};

// ===== Toast =====
export type ToastType = "success" | "error" | "info" | "warning";

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};
