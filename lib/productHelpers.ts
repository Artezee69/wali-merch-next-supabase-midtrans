import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";
import type { ProductInput, ProductVariantInput, ProductStatus } from "./types";

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function generateUniqueSlug(base: string): string {
  const clean = slugify(base) || "product";
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${clean}-${suffix}`;
}

export async function isSlugAvailable(
  slug: string,
  excludeProductId?: string
): Promise<boolean> {
  let query = supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }
  const { count } = await query;
  return (count ?? 0) === 0;
}

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

const KNOWN_STATUSES: ProductStatus[] = ["draft", "active", "inactive", "archived"];
const KNOWN_CONDITIONS = ["new", "used", "refurbished"] as const;

export function validateProductInput(input: ProductInput): ValidationResult {
  const errors: Record<string, string> = {};

  const name = (input.name ?? "").trim();
  if (!name) errors.name = "Nama produk wajib diisi.";
  else if (name.length > 200) errors.name = "Nama produk maksimal 200 karakter.";

  if (input.slug !== undefined && input.slug !== null && input.slug !== "") {
    const slug = String(input.slug).trim();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.slug = "Slug hanya boleh berisi huruf kecil, angka, dan tanda strip.";
    } else if (slug.length > 100) {
      errors.slug = "Slug maksimal 100 karakter.";
    }
  }

  if (input.base_price !== undefined && input.base_price !== null) {
    if (typeof input.base_price !== "number" || Number.isNaN(input.base_price)) {
      errors.base_price = "Harga harus angka.";
    } else if (input.base_price < 0) {
      errors.base_price = "Harga tidak boleh negatif.";
    }
  }

  if (input.sale_price !== undefined && input.sale_price !== null) {
    if (typeof input.sale_price !== "number" || Number.isNaN(input.sale_price)) {
      errors.sale_price = "Harga diskon harus angka.";
    } else if (input.sale_price < 0) {
      errors.sale_price = "Harga diskon tidak boleh negatif.";
    } else if (
      input.base_price !== undefined &&
      input.base_price !== null &&
      input.sale_price >= input.base_price
    ) {
      errors.sale_price = "Harga diskon harus lebih kecil dari harga normal.";
    }
  }

  if (input.stock !== undefined && input.stock !== null) {
    if (typeof input.stock !== "number" || Number.isNaN(input.stock)) {
      errors.stock = "Stok harus angka.";
    } else if (input.stock < 0) {
      errors.stock = "Stok tidak boleh negatif.";
    }
  }

  if (input.weight !== undefined && input.weight !== null) {
    if (typeof input.weight !== "number" || input.weight < 0) {
      errors.weight = "Berat tidak boleh negatif.";
    }
  }
  for (const dim of ["length", "width", "height"] as const) {
    const val = input[dim];
    if (val !== undefined && val !== null) {
      if (typeof val !== "number" || val < 0) {
        errors[dim] = `${dim} tidak boleh negatif.`;
      }
    }
  }

  if (input.min_purchase !== undefined) {
    if (typeof input.min_purchase !== "number" || input.min_purchase < 1) {
      errors.min_purchase = "Minimal pembelian minimal 1.";
    }
  }
  if (input.max_purchase !== undefined) {
    if (typeof input.max_purchase !== "number" || input.max_purchase < 1) {
      errors.max_purchase = "Maksimal pembelian minimal 1.";
    }
    if (
      input.min_purchase !== undefined &&
      typeof input.min_purchase === "number" &&
      input.max_purchase < input.min_purchase
    ) {
      errors.max_purchase = "Maksimal pembelian tidak boleh lebih kecil dari minimal.";
    }
  }

  if (input.status !== undefined && !KNOWN_STATUSES.includes(input.status)) {
    errors.status = "Status tidak valid.";
  }
  if (input.condition !== undefined && !KNOWN_CONDITIONS.includes(input.condition)) {
    errors.condition = "Kondisi tidak valid.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateVariants(variants: ProductVariantInput[]): ValidationResult {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();

  variants.forEach((v, idx) => {
    const o1 = (v.option_1_value ?? "").trim();
    const o2 = (v.option_2_value ?? "").trim();
    if (!o1 && !o2) {
      errors[`variants.${idx}`] = "Varian harus memiliki minimal satu opsi nilai.";
    }
    if (v.sku && v.sku.trim()) {
      const key = `sku:${v.sku.trim().toLowerCase()}`;
      if (seen.has(key)) {
        errors[`variants.${idx}.sku`] = "SKU variasi duplikat.";
      } else {
        seen.add(key);
      }
    }
    if (v.price !== undefined && v.price !== null) {
      if (typeof v.price !== "number" || v.price < 0) {
        errors[`variants.${idx}.price`] = "Harga variasi tidak valid.";
      }
    }
    if (v.sale_price !== undefined && v.sale_price !== null) {
      if (typeof v.sale_price !== "number" || v.sale_price < 0) {
        errors[`variants.${idx}.sale_price`] = "Harga diskon variasi tidak valid.";
      } else if (
        v.price !== undefined &&
        v.price !== null &&
        v.sale_price >= v.price
      ) {
        errors[`variants.${idx}.sale_price`] =
          "Harga diskon harus lebih kecil dari harga variasi.";
      }
    }
    if (typeof v.stock !== "number" || v.stock < 0) {
      errors[`variants.${idx}.stock`] = "Stok variasi tidak valid.";
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

export function syncVariantLegacyFields(v: ProductVariantInput) {
  return {
    ...v,
    // Peta ke kolom legacy untuk kompatibilitas dengan AddToCart
    color: v.option_1_value ?? null,
    size: v.option_2_value ?? null,
  };
}

export function pickEffectivePrice(input: {
  base_price: number | null;
  sale_price: number | null;
  price?: number | null;
}): number {
  if (input.sale_price !== null && input.sale_price !== undefined && input.sale_price > 0) {
    return input.sale_price;
  }
  if (input.base_price !== null && input.base_price !== undefined && input.base_price > 0) {
    return input.base_price;
  }
  return Number(input.price ?? 0);
}
