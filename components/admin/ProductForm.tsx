"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  Image as ImageIcon,
  Info,
  Loader2,
  Package,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  X,
  Star,
  Copy,
  Boxes,
  Truck,
  Sparkles,
} from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminLink,
  Alert,
  Field,
  Pill,
  Section,
  Toggle,
} from "@/components/admin/ui";

import type { ReactNode } from "react";

/* ============== Types ============== */

export type ProductImageRow = {
  id?: string;
  image_url: string;
  storage_path?: string | null;
  sort_order: number;
  is_primary?: boolean;
  alt_text?: string | null;
  isNew?: boolean;
  file?: File;
};

export type ProductVariantRow = {
  id?: string;
  sku: string;
  option_1_name: string;
  option_1_value: string;
  option_2_name: string | null;
  option_2_value: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  weight: number | null;
  isNew?: boolean;
  toDelete?: boolean;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  brand: string;
  condition: string;
  status: "draft" | "active" | "inactive" | "archived";
  sku: string;
  base_price: number;
  sale_price: number | null;
  stock: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  has_variants: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_preorder: boolean;
  preorder_days: number;
  min_purchase: number;
  max_purchase: number;
  seo_title: string;
  seo_description: string;
  internal_notes: string;
  option_1_name: string;
  option_1_values: string[];
  option_2_name: string;
  option_2_values: string[];
  images: ProductImageRow[];
  variants: ProductVariantRow[];
};

export type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  initialData?: Partial<ProductFormValues>;
};

/* ============== Helpers ============== */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatRupiah(n: number) {
  return "Rp " + Math.max(0, n || 0).toLocaleString("id-ID");
}

const STATUS_OPTIONS: Array<{
  v: ProductFormValues["status"];
  l: string;
  desc: string;
  tone: "neutral" | "green" | "amber" | "red";
}> = [
  { v: "draft", l: "Draft", desc: "Tidak tampil di katalog publik", tone: "neutral" },
  { v: "active", l: "Aktif", desc: "Tampil di katalog dan dapat dibeli", tone: "green" },
  { v: "inactive", l: "Nonaktif", desc: "Disembunyikan dari katalog publik", tone: "amber" },
  { v: "archived", l: "Arsip", desc: "Diarsipkan permanen", tone: "red" },
];

const CONDITION_OPTIONS = ["Baru", "Bekas - Seperti Baru", "Bekas - Bagus", "Bekas - Wajar"];

const MAX_IMAGES = 9;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const inp = "ad-input";
const inpMono = "ad-input font-mono text-[11px]";

/* ============== Component ============== */

export default function ProductForm({ mode, productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    slug: "",
    short_description: "",
    description: "",
    category: "",
    brand: "",
    condition: "Baru",
    status: "draft",
    sku: "",
    base_price: 0,
    sale_price: null,
    stock: 0,
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    has_variants: false,
    is_featured: false,
    is_new: true,
    is_preorder: false,
    preorder_days: 0,
    min_purchase: 1,
    max_purchase: 0,
    seo_title: "",
    seo_description: "",
    internal_notes: "",
    option_1_name: "",
    option_1_values: [],
    option_2_name: "",
    option_2_values: [],
    images: [],
    variants: [],
    ...initialData,
  });

  const [slugTouched, setSlugTouched] = useState(!!initialData?.slug);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; pct: number }[]>([]);
  const [failedUploads, setFailedUploads] = useState<string[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [openSection, setOpenSection] = useState<string>("basic");
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [showBulkStock, setShowBulkStock] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkAdjust, setBulkAdjust] = useState("set"); // set | add | subtract
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  // Sync slug from name until user manually edits it.
  useEffect(() => {
    if (!slugTouched && values.name) {
      setValues((v) => ({ ...v, slug: slugify(v.name) }));
    }
  }, [values.name, slugTouched]);

  // Track dirty state.
  useEffect(() => {
    setIsDirty(true);
  }, [values]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ============== Field updates ============== */

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((v) => {
      let next: ProductFormValues = { ...v, [key]: value };

      // Auto-sync variant rows when option values change
      if (key === "option_1_values" || key === "option_2_values") {
        const nextOpt1 = key === "option_1_values" ? (value as string[]) : v.option_1_values;
        const nextOpt2 = key === "option_2_values" ? (value as string[]) : v.option_2_values;
        const hasOptions = nextOpt1.length > 0;
        next = {
          ...next,
          has_variants: hasOptions,
          variants: hasOptions
            ? syncVariantsFromOptions(
                nextOpt1,
                nextOpt2,
                v.option_1_name,
                v.option_2_name,
                v.variants,
                v.base_price,
                v.sale_price,
                v.sku,
              )
            : next.variants.filter((va) => va.toDelete),
        };
      }

      // Auto-sync option names when option_1_name or option_2_name changes
      if (key === "option_1_name" || key === "option_2_name") {
        const newOpt1Name = key === "option_1_name" ? (value as string) : v.option_1_name;
        const newOpt2Name = key === "option_2_name" ? (value as string) : v.option_2_name;
        next = {
          ...next,
          variants: next.variants.map((va) => ({
            ...va,
            option_1_name: newOpt1Name,
            option_2_name: va.option_2_value ? newOpt2Name : null,
          })),
        };
      }

      return next;
    });
  };

  /* ============== Image upload ============== */

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const remaining = MAX_IMAGES - values.images.length;
    if (remaining <= 0) {
      setGeneralError(`Maksimal ${MAX_IMAGES} foto produk.`);
      return;
    }

    const accepted: File[] = [];
    const failed: string[] = [];

    for (const f of fileArr.slice(0, remaining)) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        failed.push(`${f.name}: format tidak didukung`);
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        failed.push(`${f.name}: ukuran terlalu besar (maks 5MB)`);
        continue;
      }
      accepted.push(f);
    }

    if (failed.length) setFailedUploads((prev) => [...prev, ...failed]);
    if (accepted.length === 0) return;

    setUploading(true);
    setUploadProgress(accepted.map((f) => ({ name: f.name, pct: 0 })));

    // Create preview entries.
    const newEntries: ProductImageRow[] = [];
    for (const f of accepted) {
      const previewUrl = URL.createObjectURL(f);
      newEntries.push({
        image_url: previewUrl,
        sort_order: values.images.length + newEntries.length,
        is_primary: values.images.length + newEntries.length === 0,
        isNew: true,
        file: f,
      });
    }
    setValues((v) => ({ ...v, images: [...v.images, ...newEntries] }));

    try {
      // Upload to Supabase Storage via API.
      for (let i = 0; i < accepted.length; i++) {
        const f = accepted[i];
        const fd = new FormData();
        fd.append("file", f);
        if (productId) fd.append("productId", productId);
        const tempId = `temp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        fd.append("tempId", tempId);
        setUploadProgress((prev) => prev.map((p) => (p.name === f.name ? { ...p, pct: 30 } : p)));

        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Upload gagal");
        }
        // API response: { success, image: { id, image_url, storage_path, sort_order } }
        const uploaded = data?.image || {};
        setUploadProgress((prev) => prev.map((p) => (p.name === f.name ? { ...p, pct: 100 } : p)));
        // Replace preview URL with real URL.
        setValues((v) => ({
          ...v,
          images: v.images.map((img) =>
            img.file === f
              ? {
                  ...img,
                  id: uploaded.id ?? img.id,
                  image_url: uploaded.image_url ?? img.image_url,
                  storage_path: uploaded.storage_path ?? img.storage_path,
                  sort_order:
                    typeof uploaded.sort_order === "number"
                      ? uploaded.sort_order
                      : img.sort_order,
                  isNew: true,
                }
              : img
          ),
        }));
      }
    } catch (err: unknown) {
      setGeneralError(`Upload foto gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
      setFailedUploads((prev) => [...prev, ...accepted.map((f) => f.name)]);
    } finally {
      setUploading(false);
      setUploadProgress([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = async (idx: number) => {
    const img = values.images[idx];
    if (!img) return;

    if (img.id && !img.isNew) {
      // Existing image: delete via API.
      if (!confirm("Hapus foto ini?")) return;
      try {
        const res = await fetch(`/api/admin/products/images/${img.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json())?.error || "Gagal hapus");
      } catch (err: unknown) {
        setGeneralError(`Gagal hapus foto: ${err instanceof Error ? err.message : "error"}`);
        return;
      }
    }
    setValues((v) => {
      const next = v.images.filter((_, i) => i !== idx).map((im, i) => ({ ...im, sort_order: i }));
      if (next.length > 0 && !next.some((im) => im.is_primary)) {
        next[0].is_primary = true;
      }
      return { ...v, images: next };
    });
  };

  const setPrimary = (idx: number) => {
    setValues((v) => ({
      ...v,
      images: v.images.map((im, i) => ({ ...im, is_primary: i === idx })),
    }));
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    setValues((v) => {
      const next = [...v.images];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return v;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...v, images: next.map((im, i) => ({ ...im, sort_order: i })) };
    });
  };

  /* ============== Variants ============== */

  // Auto-sync variant rows to match current option_1_values × option_2_values.
  // Preserves existing price/stock/is_active/sku for matching combinations.
  const syncVariantsFromOptions = (
    opt1Values: string[],
    opt2Values: string[],
    opt1Name: string,
    opt2Name: string,
    currentVariants: ProductVariantRow[],
    basePrice: number,
    salePrice: number | null,
    sku: string,
  ): ProductVariantRow[] => {
    const combos: Array<[string, string | null, string | null]> = [];
    if (opt2Values.length) {
      for (const v1 of opt1Values) {
        for (const v2 of opt2Values) {
          combos.push([v1, opt2Name, v2]);
        }
      }
    } else {
      for (const v1 of opt1Values) {
        combos.push([v1, null, null]);
      }
    }

    const existing = new Map<string, ProductVariantRow>();
    for (const va of currentVariants) {
      if (va.toDelete) continue; // keep toDelete rows untouched
      const key = `${va.option_1_value}|${va.option_2_value || ""}`;
      if (!existing.has(key)) existing.set(key, va);
    }

    const newVariants: ProductVariantRow[] = combos.map(([v1, n2, v2], i) => {
      const key = `${v1}|${v2 || ""}`;
      const found = existing.get(key);
      if (found) return found;
      return {
        sku: `${sku || "PROD"}-${v1}${v2 ? "-" + v2 : ""}-${i + 1}`
          .toUpperCase()
          .replace(/\s+/g, ""),
        option_1_name: opt1Name || "Option 1",
        option_1_value: v1,
        option_2_name: n2,
        option_2_value: v2,
        price: basePrice,
        sale_price: salePrice,
        stock: 0,
        image_url: null,
        is_active: true,
        weight: null,
        isNew: true,
      };
    });

    // Keep any toDelete rows (they will be soft-deleted by the API)
    const toDeleteRows = currentVariants.filter((va) => va.toDelete);
    return [...newVariants, ...toDeleteRows];
  };

  const generateVariants = () => {
    if (!values.option_1_values.length) {
      setErrors((e) => ({ ...e, option_1_values: "Minimal 1 pilihan variasi 1" }));
      return;
    }
    setValues((v) => ({
      ...v,
      has_variants: true,
      variants: syncVariantsFromOptions(
        v.option_1_values,
        v.option_2_values,
        v.option_1_name,
        v.option_2_name,
        v.variants,
        v.base_price,
        v.sale_price,
        v.sku,
      ),
    }));
  };

  const updateVariant = (idx: number, field: keyof ProductVariantRow, value: unknown) => {
    setValues((v) => {
      const variants = [...v.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...v, variants };
    });
  };

  const removeVariant = (idx: number) => {
    setValues((v) => {
      const variant = v.variants[idx];
      if (variant.id) {
        // Soft-set toDelete (will be cleaned by backend on save).
        const variants = [...v.variants];
        variants[idx] = { ...variant, toDelete: true, is_active: false };
        return { ...v, variants };
      }
      return { ...v, variants: v.variants.filter((_, i) => i !== idx) };
    });
  };

  const applyBulkPrice = () => {
    const p = Number(bulkPrice);
    if (Number.isNaN(p) || p < 0) {
      setErrors((e) => ({ ...e, bulkPrice: "Harga tidak valid" }));
      return;
    }
    setValues((v) => {
      const targetIndices = new Set<number>();
      if (selectedVariants.size > 0) {
        v.variants.forEach((va, i) => {
          const key = va.id || `idx-${i}`;
          if (selectedVariants.has(key)) targetIndices.add(i);
        });
      } else {
        v.variants.forEach((_va, i) => {
          if (!v.variants[i].toDelete) targetIndices.add(i);
        });
      }
      return {
        ...v,
        variants: v.variants.map((va, i) =>
          targetIndices.has(i) ? { ...va, price: p } : va
        ),
      };
    });
    setErrors((e) => {
      const { bulkPrice: _bp, ...rest } = e;
      return rest;
    });
    setShowBulkPrice(false);
    setBulkPrice("");
  };

  const applyBulkStock = () => {
    const s = Number(bulkStock);
    if (Number.isNaN(s) || s < 0) {
      setErrors((e) => ({ ...e, bulkStock: "Stok tidak valid" }));
      return;
    }
    setValues((v) => {
      const targetIndices = new Set<number>();
      if (selectedVariants.size > 0) {
        v.variants.forEach((va, i) => {
          const key = va.id || `idx-${i}`;
          if (selectedVariants.has(key)) targetIndices.add(i);
        });
      } else {
        v.variants.forEach((_va, i) => {
          if (!v.variants[i].toDelete) targetIndices.add(i);
        });
      }
      return {
        ...v,
        variants: v.variants.map((va, i) => {
          if (!targetIndices.has(i)) return va;
          let stock = Number(va.stock) || 0;
          if (bulkAdjust === "set") stock = s;
          else if (bulkAdjust === "add") stock = Math.max(0, stock + s);
          else stock = Math.max(0, stock - s);
          return { ...va, stock };
        }),
      };
    });
    setErrors((e) => {
      const { bulkStock: _bs, ...rest } = e;
      return rest;
    });
    setShowBulkStock(false);
    setBulkStock("");
  };

  const applyBulkStatus = (isActive: boolean) => {
    if (!confirm(`${isActive ? "Aktifkan" : "Nonaktifkan"} variasi yang dipilih?`)) return;
    setValues((v) => {
      const targetIndices = new Set<number>();
      if (selectedVariants.size > 0) {
        v.variants.forEach((va, i) => {
          const key = va.id || `idx-${i}`;
          if (selectedVariants.has(key)) targetIndices.add(i);
        });
      } else {
        v.variants.forEach((_va, i) => {
          if (!v.variants[i].toDelete) targetIndices.add(i);
        });
      }
      return {
        ...v,
        variants: v.variants.map((va, i) =>
          targetIndices.has(i) ? { ...va, is_active: isActive } : va
        ),
      };
    });
  };

  const autoGenerateSku = () => {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((va, i) => ({
        ...va,
        sku: `${v.sku || "PROD"}-${va.option_1_value}${
          va.option_2_value ? "-" + va.option_2_value : ""
        }-${i + 1}`
          .toUpperCase()
          .replace(/\s+/g, ""),
      })),
    }));
  };

  /* ============== Validation ============== */

  const validate = (requireFull: boolean): boolean => {
    const errs: Record<string, string> = {};
    if (!values.name.trim()) errs.name = "Nama produk wajib diisi";

    if (requireFull) {
      if (!values.slug.trim()) errs.slug = "Slug wajib diisi";
      if (values.images.length === 0) errs.images = "Minimal 1 foto produk";
      if (values.has_variants) {
        if (values.variants.length === 0) errs.variants = "Minimal 1 variasi";
        if (values.variants.some((v) => !v.sku.trim()))
          errs.variants = "Semua variasi wajib memiliki SKU";
        const skus = values.variants.map((v) => v.sku.trim());
        if (new Set(skus).size !== skus.length) errs.variants = "SKU variasi harus unik";
      } else {
        if (values.base_price <= 0) errs.base_price = "Harga wajib diisi";
        if (values.stock < 0) errs.stock = "Stok tidak boleh negatif";
      }
      if (values.sale_price !== null && values.sale_price >= values.base_price) {
        errs.sale_price = "Harga diskon harus lebih kecil dari harga normal";
      }
      if (values.max_purchase > 0 && values.max_purchase < values.min_purchase) {
        errs.max_purchase = "Maks pembelian harus >= min pembelian";
      }
      if (values.weight < 0 || values.length < 0 || values.width < 0 || values.height < 0) {
        errs.weight = "Dimensi tidak boleh negatif";
      }
    } else {
      // Draft validation: only critical things.
      if (values.base_price < 0) errs.base_price = "Harga tidak valid";
      if (values.stock < 0) errs.stock = "Stok tidak boleh negatif";
    }
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Scroll to first error.
      setTimeout(() => {
        const firstKey = Object.keys(errs)[0];
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }

    return Object.keys(errs).length === 0;
  };

  /* ============== Submit ============== */

  const submit = async (action: "draft" | "publish") => {
    setGeneralError(null);
    setSuccessMsg(null);
    if (!validate(action === "publish")) return;

    if (action === "draft") setSavingDraft(true);
    else setPublishing(true);

    try {
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body = {
        ...values,
        status:
          action === "publish" ? "active" : values.status === "active" ? "draft" : values.status,
        _intent: action,
      };
      // Untuk produk dengan varian, stok di-handle per-variant.
      if (values.has_variants) {
        delete (body as Record<string, unknown>).stock;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log("[FormSubmit] status:", res.status, "text:", text.slice(0, 500));

      let data: { success?: boolean; error?: string; errors?: Record<string, string>; product?: { id: string }; details?: string; fatal?: boolean };
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Invalid JSON response" };
      }

      if (!res.ok || !data?.success) {
        if (data?.errors) setErrors(data.errors);
        // Collect variant-specific error messages for display
        const variantMsgs: string[] = [];
        if (data?.errors) {
          for (const [key, val] of Object.entries(data.errors)) {
            if (key.startsWith("variants.") && typeof val === "string") {
              variantMsgs.push(val);
            }
          }
        }
        const variantDetail = variantMsgs.length ? ` [${[...new Set(variantMsgs)].join("; ")}]` : "";
        const detail = data?.details ? ` — ${data.details}` : "";
        throw new Error(`(HTTP ${res.status}) ${data?.error || "Gagal menyimpan"}${variantDetail}${detail}`);
      }

      setSuccessMsg(
        action === "publish" ? "Produk berhasil dipublikasikan!" : "Draft berhasil disimpan"
      );
      setIsDirty(false);

      if (mode === "create" && data.product?.id) {
        const orphanImageIds = values.images
          .filter((img) => img.id && img.isNew)
          .map((img) => img.id!);
        if (orphanImageIds.length > 0) {
          await fetch("/api/admin/products/attach-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: data.product.id,
              image_ids: orphanImageIds,
            }),
          }).catch((err) => {
            console.error("[AttachImages] failed:", err);
            throw err;
          });
        }

        startTransition(() => {
          router.push(`/admin/products/${data.product!.id}/edit`);
        });
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err: unknown) {
      setGeneralError(
        err instanceof Error ? err.message : "Gagal menyimpan produk"
      );
    } finally {
      setSavingDraft(false);
      setPublishing(false);
    }
  };

  const handleDuplicate = async () => {
    if (!productId) return;
    if (!confirm("Duplikasi produk ini menjadi draft baru?")) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Gagal duplikasi");
      router.push(`/admin/products/${data.product.id}/edit`);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : "Gagal duplikasi");
    }
  };

  /* ============== Derived state for sidebar ============== */

  const totalStock = useMemo(() => {
    if (values.has_variants) {
      return values.variants
        .filter((v) => v.is_active && !v.toDelete)
        .reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0);
    }
    return Math.max(0, Number(values.stock) || 0);
  }, [values.has_variants, values.variants, values.stock]);

  const priceRange = useMemo(() => {
    if (values.has_variants && values.variants.length) {
      const active = values.variants.filter((v) => v.is_active && !v.toDelete);
      const prices = active.map((v) => v.sale_price ?? v.price);
      if (prices.length === 0) return null;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max
        ? formatRupiah(min)
        : `${formatRupiah(min)} – ${formatRupiah(max)}`;
    }
    if (values.sale_price) return `${formatRupiah(values.sale_price)} (diskon)`;
    return formatRupiah(values.base_price);
  }, [values.has_variants, values.variants, values.base_price, values.sale_price]);

  const completion = useMemo(() => {
    const checks = [
      { key: "name", label: "Nama produk", done: !!values.name.trim() },
      { key: "slug", label: "Slug", done: !!values.slug.trim() },
      { key: "category", label: "Kategori", done: !!values.category.trim() },
      { key: "images", label: "Minimal 1 foto", done: values.images.length > 0 },
      {
        key: "price",
        label: "Harga",
        done: values.has_variants ? values.variants.length > 0 : values.base_price > 0,
      },
      { key: "stock", label: "Stok", done: totalStock > 0 },
      {
        key: "variants",
        label: "Variasi lengkap",
        done:
          !values.has_variants ||
          values.variants.every((v) => v.sku && v.option_1_value),
      },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    return { pct: Math.round((doneCount / checks.length) * 100), checks };
  }, [values, totalStock]);

  const sectionToggle = (key: string) => {
    setOpenSection((s) => (s === key ? "" : key));
  };

  /* ============== Render ============== */

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {/* Top bar */}
        <div className="ad-card flex flex-wrap items-center justify-between gap-2 px-4 py-3 !shadow-none">
          <AdminLink
            href="/admin/products"
            variant="secondary"
            size="sm"
            className="!border-transparent !bg-transparent text-[var(--ad-text-2)] hover:bg-[var(--ad-surface-2)]"
          >
            <ArrowLeft size={13} /> Kembali
          </AdminLink>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Pill tone="amber">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ad-amber)]" />
                Belum disimpan
              </Pill>
            )}
            {mode === "edit" && (
              <AdminButton variant="secondary" size="sm" onClick={handleDuplicate}>
                <Copy size={12} /> Duplikasi
              </AdminButton>
            )}
            {mode === "edit" && values.slug && (
              <AdminLink
                href={`/products/${values.slug}`}
                target="_blank"
                variant="secondary"
                size="sm"
              >
                <Eye size={12} /> Preview
              </AdminLink>
            )}
          </div>
        </div>

        {generalError && (
          <Alert tone="error" onClose={() => setGeneralError(null)}>
            {generalError}
          </Alert>
        )}
        {successMsg && (
          <Alert tone="success" onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* === Section: Basic === */}
        <Section
          title="Informasi Dasar"
          icon={<Info size={14} />}
          accent="#2563eb"
          open={openSection === "basic"}
          onToggle={() => sectionToggle("basic")}
          errorCount={["name", "slug", "category", "status", "condition", "brand", "sku"].filter((k) => errors[k]).length}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AccentRow label="Nama Produk" color="#2563eb" error={errors.name}>
              <input
                data-field="name"
                value={values.name}
                onChange={(e) => update("name", e.target.value.slice(0, 200))}
                placeholder="WALI Player Edition T-Shirt"
                className={inp}
              />
            </AccentRow>

            <AccentRow label="Slug" color="#2563eb" error={errors.slug}>
              <input
                data-field="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", slugify(e.target.value));
                }}
                placeholder="wali-player-edition-t-shirt"
                className={inp}
              />
            </AccentRow>

            <AccentRow label="Kategori" color="#2563eb" error={errors.category}>
              <input
                data-field="category"
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="T-Shirt, Topi, Aksesoris…"
                className={inp}
              />
            </AccentRow>

            <AccentRow label="Brand / Merek" color="#2563eb">
              <input
                value={values.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="WALI Merch"
                className={inp}
              />
            </AccentRow>

            <AccentRow label="Kondisi Produk" color="#2563eb">
              <select
                value={values.condition}
                onChange={(e) => update("condition", e.target.value)}
                className={inp}
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </AccentRow>

            <AccentRow label="Status" color="#2563eb">
              <select
                value={values.status}
                onChange={(e) => update("status", e.target.value as ProductFormValues["status"])}
                className={inp}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l} — {s.desc}
                  </option>
                ))}
              </select>
            </AccentRow>

            <AccentRow label="SKU Utama" color="#2563eb" hint="Otomatis dibuat jika kosong">
              <input
                value={values.sku}
                onChange={(e) => update("sku", e.target.value.toUpperCase())}
                placeholder="WALI-TEE-001"
                className={inp}
              />
            </AccentRow>

            <AccentRow label="Deskripsi Singkat" color="#2563eb">
              <input
                value={values.short_description}
                onChange={(e) => update("short_description", e.target.value.slice(0, 300))}
                placeholder="1 kalimat yang menjual…"
                className={inp}
              />
            </AccentRow>

            <div className="md:col-span-2">
              <AccentRow label="Deskripsi" color="#2563eb" full>
                <textarea
                  value={values.description}
                  onChange={(e) => update("description", e.target.value.slice(0, 5000))}
                  rows={6}
                  placeholder="Bahan, detail sablon, cara perawatan, ukuran, dll…"
                  className={`${inp} resize-y`}
                />
              </AccentRow>
            </div>
          </div>
        </Section>

        {/* === Section: Images === */}
        <Section
          title="Foto Produk"
          icon={<ImageIcon size={14} />}
          accent="#7c3aed"
          open={openSection === "images"}
          onToggle={() => sectionToggle("images")}
          badge={`${values.images.length}/${MAX_IMAGES}`}
          errorCount={errors.images ? 1 : 0}
        >
          <div className="space-y-4">
            <div
              data-field="images"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragActive
                  ? "border-[var(--ad-accent)] bg-[var(--ad-accent-soft)]"
                  : "border-[var(--ad-border)] bg-[var(--ad-surface-2)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                <Upload size={20} />
              </div>
              <p className="text-[13px] font-semibold text-[var(--ad-text)]">
                Drag & drop foto di sini
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ad-text-3)]">atau</p>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || values.images.length >= MAX_IMAGES}
                className="mt-2.5"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                {uploading ? "Mengupload…" : "Pilih File"}
              </AdminButton>
              <p className="mt-2.5 text-[10.5px] text-[var(--ad-text-3)]">
                JPG, JPEG, PNG, WebP • Maks 5MB • Maks {MAX_IMAGES} foto
              </p>
              {errors.images && <p className="ad-error-text mt-2">{errors.images}</p>}
            </div>

            {uploadProgress.length > 0 && (
              <div className="space-y-1.5">
                {uploadProgress.map((p) => (
                  <div key={p.name} className="ad-inset p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold text-[var(--ad-text-2)]">{p.name}</span>
                      <span className="text-[var(--ad-text-3)]">{p.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--ad-border-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--ad-accent)] transition-all"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {failedUploads.length > 0 && (
              <div className="ad-alert ad-alert-error !items-start">
                <div className="flex-1 text-xs">
                  <p className="font-semibold">Gagal diupload:</p>
                  <ul className="mt-1 list-inside list-disc text-[11px]">
                    {failedUploads.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setFailedUploads([])}
                  className="text-[10px] font-semibold underline"
                >
                  Hapus
                </button>
              </div>
            )}

            {values.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {values.images.map((img, idx) => (
                  <div
                    key={img.id || img.image_url || idx}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--ad-border)] bg-[var(--ad-surface-2)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={`Foto ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 bottom-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white backdrop-blur-sm">
                      {idx + 1}
                    </span>
                    {idx === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--ad-accent)] px-2 py-0.5 text-[9.5px] font-bold text-white shadow-sm">
                        <Star size={9} fill="currentColor" /> Utama
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/75 via-black/0 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow disabled:opacity-40"
                          title="Pindah ke kiri"
                        >
                          <X size={12} className="rotate-45" />
                        </button>
                        <button
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === values.images.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow disabled:opacity-40"
                          title="Pindah ke kanan"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => removeImage(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ad-red)] text-white shadow"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* === Section: Sales (no variants) === */}
        {!values.has_variants && (
          <Section
            title="Informasi Penjualan"
            icon={<Truck size={14} />}
            accent="#16a34a"
            open={openSection === "sales"}
            onToggle={() => sectionToggle("sales")}
            errorCount={["base_price", "sale_price", "stock", "min_purchase", "max_purchase"].filter(
              (k) => errors[k]
            ).length}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AccentRow label="Harga" color="#16a34a" required error={errors.base_price}>
                <input
                  data-field="base_price"
                  type="number"
                  min={0}
                  value={values.base_price || ""}
                  onChange={(e) => update("base_price", Number(e.target.value) || 0)}
                  placeholder="199000"
                  className={inp}
                />
                <p className="mt-1 text-[10.5px] text-[var(--ad-text-3)]">
                  Preview: {formatRupiah(values.base_price)}
                </p>
              </AccentRow>

              <AccentRow label="Harga Diskon" color="#16a34a" error={errors.sale_price}>
                <input
                  data-field="sale_price"
                  type="number"
                  min={0}
                  value={values.sale_price ?? ""}
                  onChange={(e) =>
                    update("sale_price", e.target.value === "" ? null : Number(e.target.value))
                  }
                  placeholder="150000"
                  className={inp}
                />
                {values.sale_price !== null &&
                  values.sale_price > 0 &&
                  values.base_price > 0 && (
                    <p className="mt-1 text-[10.5px] font-semibold text-[var(--ad-green)]">
                      Hemat {Math.round(((values.base_price - values.sale_price) / values.base_price) * 100)}%
                    </p>
                  )}
              </AccentRow>

              <AccentRow label="Stok" color="#16a34a" error={errors.stock}>
                <input
                  data-field="stock"
                  type="number"
                  min={0}
                  value={values.stock || ""}
                  onChange={(e) => update("stock", Number(e.target.value) || 0)}
                  placeholder="0"
                  className={inp}
                />
              </AccentRow>

              <AccentRow label="Status Stok" color="#16a34a" hint="Otomatis dari nilai stok">
                <div className="flex items-center py-1.5">
                  {totalStock > 10 ? (
                    <Pill tone="green">Tersedia</Pill>
                  ) : totalStock > 0 ? (
                    <Pill tone="amber">Stok Rendah</Pill>
                  ) : (
                    <Pill tone="red">Habis</Pill>
                  )}
                </div>
              </AccentRow>

              <AccentRow label="Min Pembelian" color="#16a34a" error={errors.min_purchase}>
                <input
                  type="number"
                  min={1}
                  value={values.min_purchase || ""}
                  onChange={(e) => update("min_purchase", Math.max(1, Number(e.target.value) || 1))}
                  className={inp}
                />
              </AccentRow>

              <AccentRow label="Maks Pembelian" color="#16a34a" hint="0 = tidak terbatas" error={errors.max_purchase}>
                <input
                  type="number"
                  min={0}
                  value={values.max_purchase || ""}
                  onChange={(e) => update("max_purchase", Number(e.target.value) || 0)}
                  className={inp}
                />
              </AccentRow>
            </div>
          </Section>
        )}

        {/* === Section: Variants === */}
        <Section
          title="Variasi Produk"
          icon={<Boxes size={14} />}
          accent="#d97706"
          open={openSection === "variants"}
          onToggle={() => sectionToggle("variants")}
          badge={values.has_variants ? `${values.variants.length} varian` : "Nonaktif"}
          errorCount={errors.variants ? 1 : 0}
        >
          <div className="space-y-4">
            <div className="ad-inset flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="text-[13px] font-semibold text-[var(--ad-text)]">
                  Produk memiliki variasi
                </p>
                <p className="mt-0.5 text-[11.5px] text-[var(--ad-text-3)]">
                  Aktifkan untuk membuat kombinasi ukuran / warna dll.
                </p>
              </div>
              <input
                type="checkbox"
                checked={values.has_variants}
                onChange={(e) => update("has_variants", e.target.checked)}
                className="ad-checkbox h-4.5 w-4.5 !h-[18px] !w-[18px]"
              />
            </div>

            {values.has_variants && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <AccentRow label="Variasi 1 (mis. Ukuran)" color="#d97706">
                    <input
                      value={values.option_1_name}
                      onChange={(e) => update("option_1_name", e.target.value)}
                      placeholder="Ukuran"
                      className={inp}
                    />
                  </AccentRow>
                  <AccentRow label="Pilihan Variasi 1" color="#d97706" error={errors.option_1_values} hint="Koma atau Enter">
                    <OptionInput
                      values={values.option_1_values}
                      onChange={(v) => update("option_1_values", v)}
                    />
                  </AccentRow>
                  <AccentRow label="Variasi 2 (opsional, mis. Warna)" color="#d97706">
                    <input
                      value={values.option_2_name}
                      onChange={(e) => update("option_2_name", e.target.value)}
                      placeholder="Warna"
                      className={inp}
                    />
                  </AccentRow>
                  <AccentRow label="Pilihan Variasi 2" color="#d97706" hint="Koma atau Enter">
                    <OptionInput
                      values={values.option_2_values}
                      onChange={(v) => update("option_2_values", v)}
                    />
                  </AccentRow>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AdminButton variant="primary" size="sm" onClick={generateVariants}>
                    <Plus size={12} /> Generate Kombinasi
                  </AdminButton>
                  <AdminButton variant="secondary" size="sm" onClick={autoGenerateSku}>
                    Auto SKU
                  </AdminButton>
                </div>

                {values.variants.length > 0 && (
                  <>
                    <div
                      className="overflow-hidden rounded-xl border border-[var(--ad-border)]"
                      style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.06)" }}
                    >
                      <div className="overflow-x-auto">
                        <table className="ad-table w-full">
                          <thead>
                            <tr className="bg-[var(--ad-surface-2)]">
                              <th className="w-8 px-2 py-2.5"></th>
                              <th className="px-2 py-2.5">{values.option_1_name || "Varian 1"}</th>
                              {values.option_2_name && (
                                <th className="px-2 py-2.5">{values.option_2_name}</th>
                              )}
                              <th className="px-2 py-2.5">SKU</th>
                              <th className="px-2 py-2.5 text-right">Harga</th>
                              <th className="px-2 py-2.5 text-right">Diskon</th>
                              <th className="px-2 py-2.5 text-right">Stok</th>
                              <th className="px-2 py-2.5 text-center">Aktif</th>
                              <th className="w-8 px-2 py-2.5"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.variants.map((va, idx) => {
                              if (va.toDelete) return null;
                              const key = va.id || `idx-${idx}`;
                              return (
                                <tr
                                  key={key}
                                  style={{ borderLeft: "2px solid transparent" }}
                                  className="ad-variant-row"
                                >
                                  <td className="px-2 py-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedVariants.has(key)}
                                      onChange={(e) => {
                                        setSelectedVariants((prev) => {
                                          const next = new Set(prev);
                                          if (e.target.checked) next.add(key);
                                          else next.delete(key);
                                          return next;
                                        });
                                      }}
                                      className="ad-checkbox"
                                    />
                                  </td>
                                  <td className="px-2 py-2 font-semibold text-[var(--ad-text)]">
                                    {va.option_1_value}
                                  </td>
                                  {values.option_2_name && (
                                    <td className="px-2 py-2">{va.option_2_value || "—"}</td>
                                  )}
                                  <td className="px-2 py-2">
                                    <input
                                      value={va.sku}
                                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                      className={`${inpMono} w-28 !px-2 !py-1.5 rounded-md`}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.price || ""}
                                      onChange={(e) =>
                                        updateVariant(idx, "price", Number(e.target.value) || 0)
                                      }
                                      className={`${inpMono} w-20 !px-2 !py-1.5 rounded-md text-right`}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.sale_price ?? ""}
                                      onChange={(e) =>
                                        updateVariant(
                                          idx,
                                          "sale_price",
                                          e.target.value === "" ? null : Number(e.target.value)
                                        )
                                      }
                                      className={`${inpMono} w-20 !px-2 !py-1.5 rounded-md text-right`}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.stock || ""}
                                      onChange={(e) =>
                                        updateVariant(idx, "stock", Number(e.target.value) || 0)
                                      }
                                      className={`${inpMono} w-16 !px-2 !py-1.5 rounded-md text-right`}
                                    />
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={va.is_active}
                                      onChange={(e) => updateVariant(idx, "is_active", e.target.checked)}
                                      className="ad-checkbox"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(idx)}
                                      className="text-[var(--ad-text-3)] transition hover:text-[var(--ad-red)]"
                                      title="Hapus variasi"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bulk actions */}
                    <div className="ad-inset flex flex-wrap items-center gap-2 p-2.5">
                      <span className="px-1.5 text-[11px] font-semibold text-[var(--ad-text-2)]">
                        Bulk:{" "}
                        {selectedVariants.size > 0
                          ? `${selectedVariants.size} dipilih`
                          : "semua"}
                      </span>
                      <span className="h-4 w-px bg-[var(--ad-border)]" />
                      <AdminButton variant="secondary" size="sm" onClick={() => setShowBulkPrice((s) => !s)}>
                        Set Harga
                      </AdminButton>
                      <AdminButton variant="secondary" size="sm" onClick={() => setShowBulkStock((s) => !s)}>
                        Set Stok
                      </AdminButton>
                      <AdminButton variant="secondary" size="sm" onClick={() => applyBulkStatus(true)}>
                        Aktifkan
                      </AdminButton>
                      <AdminButton variant="secondary" size="sm" onClick={() => applyBulkStatus(false)}>
                        Nonaktifkan
                      </AdminButton>
                    </div>

                    {showBulkPrice && (
                      <div className="ad-alert ad-alert-info flex-wrap !gap-2">
                        <input
                          type="number"
                          min={0}
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          placeholder="Harga baru"
                          className={`${inp} w-32 !py-1.5 text-xs`}
                        />
                        <AdminButton variant="primary" size="sm" onClick={applyBulkPrice}>
                          Terapkan
                        </AdminButton>
                        <button
                          onClick={() => setShowBulkPrice(false)}
                          className="text-[var(--ad-text-3)]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    {showBulkStock && (
                      <div className="ad-alert ad-alert-info flex-wrap !gap-2">
                        <select
                          value={bulkAdjust}
                          onChange={(e) => setBulkAdjust(e.target.value)}
                          className={`${inp} w-auto !py-1.5 text-xs`}
                        >
                          <option value="set">Set</option>
                          <option value="add">Tambah</option>
                          <option value="subtract">Kurangi</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value)}
                          placeholder="Jumlah"
                          className={`${inp} w-24 !py-1.5 text-xs`}
                        />
                        <AdminButton variant="primary" size="sm" onClick={applyBulkStock}>
                          Terapkan
                        </AdminButton>
                        <button
                          onClick={() => setShowBulkStock(false)}
                          className="text-[var(--ad-text-3)]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    {errors.variants && (
                      <p className="text-xs font-medium text-[var(--ad-red)]">{errors.variants}</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </Section>

        {/* === Section: Shipping === */}
        <Section
          title="Pengiriman"
          icon={<Package size={14} />}
          accent="#0891b2"
          open={openSection === "shipping"}
          onToggle={() => sectionToggle("shipping")}
          errorCount={errors.weight ? 1 : 0}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AccentRow label="Berat (gram)" color="#0891b2" hint="Wajib untuk produk fisik" error={errors.weight}>
              <input
                data-field="weight"
                type="number"
                min={0}
                value={values.weight || ""}
                onChange={(e) => update("weight", Number(e.target.value) || 0)}
                placeholder="300"
                className={inp}
              />
            </AccentRow>
            <AccentRow label="Panjang (cm)" color="#0891b2">
              <input
                type="number"
                min={0}
                value={values.length || ""}
                onChange={(e) => update("length", Number(e.target.value) || 0)}
                className={inp}
              />
            </AccentRow>
            <AccentRow label="Lebar (cm)" color="#0891b2">
              <input
                type="number"
                min={0}
                value={values.width || ""}
                onChange={(e) => update("width", Number(e.target.value) || 0)}
                className={inp}
              />
            </AccentRow>
            <AccentRow label="Tinggi (cm)" color="#0891b2">
              <input
                type="number"
                min={0}
                value={values.height || ""}
                onChange={(e) => update("height", Number(e.target.value) || 0)}
                className={inp}
              />
            </AccentRow>
          </div>
        </Section>

        {/* === Section: Additional === */}
        <Section
          title="Informasi Tambahan"
          icon={<Sparkles size={14} />}
          accent="#64748b"
          open={openSection === "additional"}
          onToggle={() => sectionToggle("additional")}
        >
          <div className="space-y-4">
            {values.is_preorder && (
              <AccentRow label="Waktu Proses (hari)" color="#64748b">
                <input
                  type="number"
                  min={0}
                  value={values.preorder_days || ""}
                  onChange={(e) => update("preorder_days", Number(e.target.value) || 0)}
                  placeholder="7"
                  className={inp}
                />
              </AccentRow>
            )}

            <AccentRow label="Catatan Internal" color="#64748b" hint="Tidak tampil ke customer" full>
              <textarea
                value={values.internal_notes}
                onChange={(e) => update("internal_notes", e.target.value)}
                rows={3}
                placeholder="Catatan untuk tim internal…"
                className={`${inp} resize-none`}
              />
            </AccentRow>

            <div className="grid gap-4 md:grid-cols-2">
              <AccentRow label="SEO Title" color="#64748b" hint={`${values.seo_title.length}/70`}>
                <input
                  value={values.seo_title}
                  onChange={(e) => update("seo_title", e.target.value.slice(0, 70))}
                  placeholder="Otomatis dari nama produk"
                  className={inp}
                />
              </AccentRow>
              <AccentRow label="SEO Description" color="#64748b" hint={`${values.seo_description.length}/160`}>
                <textarea
                  value={values.seo_description}
                  onChange={(e) => update("seo_description", e.target.value.slice(0, 160))}
                  rows={2}
                  className={`${inp} resize-none`}
                />
              </AccentRow>
            </div>
          </div>
        </Section>

      </div>

      {/* === Sidebar === */}
      <SidebarSummary
        name={values.name}
        status={values.status}
        onStatusChange={(s) => update("status", s)}
        completion={completion}
        totalStock={totalStock}
        priceRange={priceRange || "—"}
        variantCount={values.has_variants ? values.variants.filter((v) => !v.toDelete).length : 0}
        hasVariants={values.has_variants}
        isFeatured={values.is_featured}
        isNew={values.is_new}
        isPreorder={values.is_preorder}
        onToggleFeatured={(v) => update("is_featured", v)}
        onToggleNew={(v) => update("is_new", v)}
        onTogglePreorder={(v) => update("is_preorder", v)}
        onSaveDraft={() => submit("draft")}
        onPublish={() => submit("publish")}
        savingDraft={savingDraft}
        publishing={publishing}
        isDirty={isDirty}
        mode={mode}
      />
    </div>
  );
}

/* ============== Subcomponents ============== */

/**
 * A form field row that tints its label & focus state with the owning
 * section's accent color (mirrors the 4px left bar of the section card).
 */
function AccentRow({
  label,
  color,
  hint,
  required,
  error,
  full,
  children,
}: {
  label: string;
  color: string;
  hint?: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <label className="ad-label">
        <span>
          <span style={{ color }}>{label}</span>
          {required && <span className="ml-0.5 text-[var(--ad-red)]">*</span>}
        </span>
        {hint && <span className="ad-hint">{hint}</span>}
      </label>
      {children}
      {error && <p className="ad-error-text">{error}</p>}
    </div>
  );
}

function OptionInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  };
  return (
    <div className="ad-input flex flex-wrap items-center gap-1.5 !py-2">
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--ad-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ad-accent)]"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="text-[var(--ad-accent)]/60 transition hover:text-[var(--ad-accent)]"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          } else if (e.key === "Backspace" && !input && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => add(input)}
        placeholder={values.length ? "" : "S, M, L, XL"}
        className="min-w-[80px] flex-1 bg-transparent text-xs outline-none"
      />
    </div>
  );
}

function SidebarSummary({
  name,
  status,
  onStatusChange,
  completion,
  totalStock,
  priceRange,
  variantCount,
  hasVariants,
  isFeatured,
  isNew,
  isPreorder,
  onToggleFeatured,
  onToggleNew,
  onTogglePreorder,
  onSaveDraft,
  onPublish,
  savingDraft,
  publishing,
  isDirty,
  mode,
}: {
  name: string;
  status: ProductFormValues["status"];
  onStatusChange: (s: ProductFormValues["status"]) => void;
  completion: { pct: number; checks: Array<{ key: string; label: string; done: boolean }> };
  totalStock: number;
  priceRange: string;
  variantCount: number;
  hasVariants: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPreorder: boolean;
  onToggleFeatured: (v: boolean) => void;
  onToggleNew: (v: boolean) => void;
  onTogglePreorder: (v: boolean) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  savingDraft: boolean;
  publishing: boolean;
  isDirty: boolean;
  mode: "create" | "edit";
}) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="space-y-4">
        {/* === Card 1: Ringkasan Produk === */}
        <AdminCard>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--ad-text-3)]">
              Ringkasan Produk
            </h3>
            <Pill tone={STATUS_OPTIONS.find((s) => s.v === status)?.tone ?? "neutral"}>
              {STATUS_OPTIONS.find((s) => s.v === status)?.l}
            </Pill>
          </div>

          <p
            className="mt-2.5 truncate text-[15px] font-semibold text-[var(--ad-text)]"
            title={name}
          >
            {name || "Tanpa nama"}
          </p>

          {/* Completion ring */}
          <div className="mt-4 flex items-center gap-3.5">
            <div className="relative h-14 w-14 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--ad-border-soft)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--ad-accent)"
                  strokeWidth="3"
                  strokeDasharray={`${(completion.pct / 100) * 94.2} 94.2`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[var(--ad-text)]">
                {completion.pct}%
              </div>
            </div>
            <ul className="flex-1 space-y-1 text-[11.5px]">
              {completion.checks.map((c) => (
                <li key={c.key} className="flex items-center gap-1.5">
                  {c.done ? (
                    <Check size={11} className="text-[var(--ad-green)]" />
                  ) : (
                    <X size={11} className="text-[var(--ad-text-3)]" />
                  )}
                  <span className={c.done ? "text-[var(--ad-text-3)] line-through" : "text-[var(--ad-text-2)]"}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key stats */}
          <dl className="mt-4 space-y-2.5 border-t border-[var(--ad-border-soft)] pt-3.5 text-[13px]">
            <Row label="Harga" value={priceRange} />
            <Row
              label="Total Stok"
              value={
                <span
                  className={
                    totalStock === 0
                      ? "text-[var(--ad-red)]"
                      : totalStock < 10
                        ? "text-[var(--ad-amber)]"
                        : "text-[var(--ad-green)]"
                  }
                >
                  {totalStock}
                </span>
              }
            />
            {hasVariants && <Row label="Jumlah Variasi" value={String(variantCount)} />}
          </dl>
        </AdminCard>

        {/* === Card 2: Status & Visibilitas === */}
        <AdminCard>
          <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--ad-text-3)]">
            Status & Visibilitas
          </h3>
          <div className="mt-3 space-y-1.5">
            <Toggle
              label="Unggulan"
              hint="Tampil di section unggulan"
              value={isFeatured}
              onChange={onToggleFeatured}
            />
            <Toggle
              label="Produk Baru"
              hint="Tampil di section terbaru"
              value={isNew}
              onChange={onToggleNew}
            />
            <Toggle
              label="Pre-Order"
              hint="Dipesan, dikirim kemudian"
              value={isPreorder}
              onChange={onTogglePreorder}
            />
            <div className="border-t border-[var(--ad-border-soft)] pt-2.5">
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value as ProductFormValues["status"])}
                  className={inp}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </AdminCard>

        {/* === Card 3: Aksi === */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--ad-text-3)]">
              Aksi
            </h3>
            {isDirty && (
              <Pill tone="amber">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ad-amber)]" />
                Belum disimpan
              </Pill>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <AdminButton
              variant="secondary"
              size="sm"
              className="w-full !py-2.5"
              onClick={onSaveDraft}
              disabled={savingDraft || publishing}
            >
              {savingDraft ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Simpan Draft
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              className="w-full !py-2.5"
              onClick={onPublish}
              disabled={publishing || savingDraft}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {publishing || savingDraft ? "Menyimpan…" : "Simpan & Publikasikan"}
            </AdminButton>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[var(--ad-text-3)]">
            {mode === "create"
              ? "Produk baru dibuat sebagai draft sampai kamu klik “Simpan & Publikasikan”."
              : "Perubahan disimpan per produk. Gunakan tombol di atas untuk menyimpan."}
          </p>
        </AdminCard>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--ad-text-3)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--ad-text)]">{value}</dd>
    </div>
  );
}

