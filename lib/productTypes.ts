// Re-export dari lib/types.ts untuk menjaga kompatibilitas import path.
// Sebaiknya import langsung dari "@/lib/types" di kode baru.
export type {
  Product,
  ProductInput,
  ProductVariant,
  ProductVariantInput,
  ProductImage,
  ProductStatus,
  ProductCondition,
} from "./types";
