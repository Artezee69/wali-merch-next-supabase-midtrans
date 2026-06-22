"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
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
  GripVertical,
  Copy,
} from "lucide-react";

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

const STATUS_OPTIONS: Array<{ v: ProductFormValues["status"]; l: string; desc: string; color: string }> = [
  { v: "draft", l: "Draft", desc: "Tidak tampil di katalog publik", color: "bg-white/10 text-white/70 border-white/15" },
  { v: "active", l: "Aktif", desc: "Tampil di katalog dan dapat dibeli", color: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30" },
  { v: "inactive", l: "Nonaktif", desc: "Disembunyikan dari katalog publik", color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { v: "archived", l: "Arsip", desc: "Diarsipkan permanen", color: "bg-red-500/15 text-red-300 border-red-500/30" },
];

const CONDITION_OPTIONS = ["Baru", "Bekas - Seperti Baru", "Bekas - Bagus", "Bekas - Wajar"];

const MAX_IMAGES = 9;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
    setValues((v) => ({ ...v, [key]: value }));
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
        if (mode === "edit" && productId) fd.append("productId", productId);
        if (!values.images[i]?.storage_path) {
          const tempId = `temp-${Date.now()}-${i}`;
          fd.append("tempId", tempId);
        }
        setUploadProgress((prev) => prev.map((p) => (p.name === f.name ? { ...p, pct: 30 } : p)));

        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Upload gagal");
        }
        setUploadProgress((prev) => prev.map((p) => (p.name === f.name ? { ...p, pct: 100 } : p)));
        // Replace preview URL with real URL.
        setValues((v) => ({
          ...v,
          images: v.images.map((img) =>
            img.file === f
              ? { ...img, image_url: data.imageUrl, storage_path: data.path, isNew: true }
              : img
          ),
        }));
      }
    } catch (err: any) {
      setGeneralError(`Upload foto gagal: ${err?.message || "Unknown error"}`);
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
        const res = await fetch(`/api/admin/products/image/${img.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json())?.error || "Gagal hapus");
      } catch (err: any) {
        setGeneralError(`Gagal hapus foto: ${err.message}`);
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

  const generateVariants = () => {
    if (!values.option_1_values.length) {
      setErrors((e) => ({ ...e, option_1_values: "Minimal 1 pilihan variasi 1" }));
      return;
    }
    const combos: Array<[string, string | null, string | null]> = [];
    if (values.option_2_values.length) {
      for (const v1 of values.option_1_values) {
        for (const v2 of values.option_2_values) {
          combos.push([v1, values.option_2_name, v2]);
        }
      }
    } else {
      for (const v1 of values.option_1_values) {
        combos.push([v1, null, null]);
      }
    }

    setValues((v) => {
      // Preserve existing values for matching combinations.
      const existing = new Map<string, ProductVariantRow>();
      for (const va of v.variants) {
        const key = `${va.option_1_value}|${va.option_2_value || ""}`;
        existing.set(key, va);
      }
      const newVariants: ProductVariantRow[] = combos.map(([v1, n2, v2], i) => {
        const key = `${v1}|${v2 || ""}`;
        const found = existing.get(key);
        if (found) return found;
        return {
          sku: `${v.sku || "PROD"}-${v1}${v2 ? "-" + v2 : ""}-${i + 1}`.toUpperCase().replace(/\s+/g, ""),
          option_1_name: v.option_1_name,
          option_1_value: v1,
          option_2_name: n2,
          option_2_value: v2,
          price: v.base_price,
          sale_price: v.sale_price,
          stock: 0,
          image_url: null,
          is_active: true,
          weight: null,
          isNew: true,
        };
      });
      return { ...v, variants: newVariants };
    });
  };

  const updateVariant = (idx: number, field: keyof ProductVariantRow, value: any) => {
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
    if (!p || p < 0) {
      setErrors((e) => ({ ...e, bulkPrice: "Harga tidak valid" }));
      return;
    }
    setValues((v) => {
      const targets = selectedVariants.size > 0
        ? v.variants.filter((va) => selectedVariants.has(va.id || `idx-${v.variants.indexOf(va)}`))
        : v.variants;
      const ids = new Set(targets);
      return {
        ...v,
        variants: v.variants.map((va) => (ids.has(va) ? { ...va, price: p } : va)),
      };
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
      const targets = selectedVariants.size > 0
        ? v.variants.filter((va) => selectedVariants.has(va.id || `idx-${v.variants.indexOf(va)}`))
        : v.variants;
      const ids = new Set(targets);
      return {
        ...v,
        variants: v.variants.map((va) => {
          if (!ids.has(va)) return va;
          let stock = va.stock;
          if (bulkAdjust === "set") stock = s;
          else if (bulkAdjust === "add") stock = va.stock + s;
          else stock = Math.max(0, va.stock - s);
          return { ...va, stock };
        }),
      };
    });
    setShowBulkStock(false);
    setBulkStock("");
  };

  const applyBulkStatus = (isActive: boolean) => {
    if (!confirm(`${isActive ? "Aktifkan" : "Nonaktifkan"} variasi yang dipilih?`)) return;
    setValues((v) => {
      const targets = selectedVariants.size > 0
        ? v.variants.filter((va) => selectedVariants.has(va.id || `idx-${v.variants.indexOf(va)}`))
        : v.variants;
      const ids = new Set(targets);
      return {
        ...v,
        variants: v.variants.map((va) => (ids.has(va) ? { ...va, is_active: isActive } : va)),
      };
    });
  };

  const autoGenerateSku = () => {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((va, i) => ({
        ...va,
        sku: `${v.sku || "PROD"}-${va.option_1_value}${va.option_2_value ? "-" + va.option_2_value : ""}-${i + 1}`.toUpperCase().replace(/\s+/g, ""),
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
        if (values.variants.some((v) => !v.sku.trim())) errs.variants = "Semua variasi wajib memiliki SKU";
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
        status: action === "publish" ? "active" : values.status === "active" ? "draft" : values.status,
        _intent: action,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        if (data?.errors) setErrors(data.errors);
        throw new Error(data?.error || "Gagal menyimpan");
      }

      setSuccessMsg(action === "publish" ? "Produk berhasil dipublikasikan!" : "Draft berhasil disimpan");
      setIsDirty(false);

      if (mode === "create" && data.product?.id) {
        startTransition(() => {
          router.push(`/admin/products/${data.product.id}/edit`);
        });
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err: any) {
      setGeneralError(err.message || "Gagal menyimpan produk");
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
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Gagal duplikasi");
      router.push(`/admin/products/${data.product.id}/edit`);
    } catch (err: any) {
      setGeneralError(err.message);
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
      return min === max ? formatRupiah(min) : `${formatRupiah(min)} - ${formatRupiah(max)}`;
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
      { key: "price", label: "Harga", done: values.has_variants ? values.variants.length > 0 : values.base_price > 0 },
      { key: "stock", label: "Stok", done: totalStock > 0 },
      { key: "variants", label: "Variasi lengkap", done: !values.has_variants || values.variants.every((v) => v.sku && v.option_1_value) },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    return { pct: Math.round((doneCount / checks.length) * 100), checks };
  }, [values, totalStock]);

  const sectionToggle = (key: string) => {
    setOpenSection((s) => (s === key ? "" : key));
  };

  /* ============== Render ============== */

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 min-w-0">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 transition hover:text-[#d7ff53]"
          >
            <ArrowLeft size={14} /> Kembali
          </Link>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Belum disimpan
              </span>
            )}
            {mode === "edit" && (
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-black uppercase text-white/70 transition hover:bg-white/5"
              >
                <Copy size={12} /> Duplikasi
              </button>
            )}
            {mode === "edit" && values.slug && (
              <Link
                href={`/products/${values.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-black uppercase text-white/70 transition hover:bg-white/5"
              >
                <Eye size={12} /> Preview
              </Link>
            )}
          </div>
        </div>

        {generalError && (
          <div className="flex items-start justify-between gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            <span>{generalError}</span>
            <button onClick={() => setGeneralError(null)}><X size={14} /></button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start justify-between gap-2 rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/10 p-3 text-sm text-[#d7ff53]">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}><X size={14} /></button>
          </div>
        )}

        {/* === Section: Basic === */}
        <Section
          id="basic"
          title="Informasi Dasar"
          icon={Info}
          open={openSection === "basic"}
          onToggle={() => sectionToggle("basic")}
          errors={["name", "slug", "category", "status", "condition", "brand", "sku"].filter((k) => errors[k])}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Produk" required error={errors.name} hint={`${values.name.length}/200`}>
              <input
                data-field="name"
                value={values.name}
                onChange={(e) => update("name", e.target.value.slice(0, 200))}
                placeholder="WALI Player Edition T-Shirt"
                className="wali-input"
              />
            </Field>

            <Field label="Slug" required error={errors.slug} hint="URL: /products/[slug]">
              <input
                data-field="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", slugify(e.target.value));
                }}
                placeholder="wali-player-edition-t-shirt"
                className="wali-input"
              />
            </Field>

            <Field label="Kategori" error={errors.category}>
              <input
                data-field="category"
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="T-Shirt, Topi, Aksesoris..."
                className="wali-input"
              />
            </Field>

            <Field label="Brand / Merek">
              <input
                value={values.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="WALI Merch"
                className="wali-input"
              />
            </Field>

            <Field label="Kondisi Produk">
              <select
                value={values.condition}
                onChange={(e) => update("condition", e.target.value)}
                className="wali-input"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={values.status}
                onChange={(e) => update("status", e.target.value as ProductFormValues["status"])}
                className="wali-input"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.v} value={s.v}>{s.l} — {s.desc}</option>
                ))}
              </select>
            </Field>

            <Field label="SKU Utama" hint="Otomatis dibuat jika kosong">
              <input
                value={values.sku}
                onChange={(e) => update("sku", e.target.value.toUpperCase())}
                placeholder="WALI-TEE-001"
                className="wali-input"
              />
            </Field>

            <Field label="Deskripsi Singkat" hint={`${values.short_description.length}/300`}>
              <input
                value={values.short_description}
                onChange={(e) => update("short_description", e.target.value.slice(0, 300))}
                placeholder="1 kalimat yang menjual..."
                className="wali-input"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Deskripsi Lengkap" hint={`${values.description.length}/5000`}>
                <textarea
                  value={values.description}
                  onChange={(e) => update("description", e.target.value.slice(0, 5000))}
                  rows={6}
                  placeholder="Bahan, detail sablon, cara perawatan, ukuran, dll..."
                  className="wali-input resize-y"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* === Section: Images === */}
        <Section
          id="images"
          title="Foto Produk"
          icon={ImageIcon}
          open={openSection === "images"}
          onToggle={() => sectionToggle("images")}
          badge={`${values.images.length}/${MAX_IMAGES}`}
          errors={errors.images ? ["images"] : []}
        >
          <div
            data-field="images"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragActive ? "border-[#d7ff53] bg-[#d7ff53]/5" : "border-white/10 bg-white/[0.02]"
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
            <Upload className="mx-auto mb-2 text-white/40" size={28} />
            <p className="text-sm font-bold text-white/80">Drag & drop foto di sini</p>
            <p className="mt-1 text-[11px] text-white/50">atau</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || values.images.length >= MAX_IMAGES}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#d7ff53] px-4 py-1.5 text-[11px] font-black uppercase text-black transition hover:bg-white disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {uploading ? "Mengupload..." : "Pilih File"}
            </button>
            <p className="mt-2 text-[10px] text-white/40">JPG, JPEG, PNG, WebP • Maks 5MB • Maks {MAX_IMAGES} foto</p>
            {errors.images && <p className="mt-2 text-xs font-bold text-red-300">{errors.images}</p>}
          </div>

          {uploadProgress.length > 0 && (
            <div className="mt-3 space-y-1">
              {uploadProgress.map((p) => (
                <div key={p.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="text-white/50">{p.pct}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-[#d7ff53] transition-all" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {failedUploads.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">
              <p className="font-bold">Gagal diupload:</p>
              <ul className="mt-1 list-inside list-disc">
                {failedUploads.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button onClick={() => setFailedUploads([])} className="mt-1 text-[10px] underline">Hapus</button>
            </div>
          )}

          {values.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {values.images.map((img, idx) => (
                <div
                  key={img.id || img.image_url || idx}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={`Foto ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {img.is_primary && (
                    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#d7ff53] px-2 py-0.5 text-[9px] font-black uppercase text-black">
                      <Star size={9} fill="currentColor" /> Utama
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/80 via-black/0 to-black/0 p-1.5 opacity-0 transition group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                        title="Pindah ke kiri"
                      >
                        <ChevronUp size={12} className="-rotate-90" />
                      </button>
                      <button
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === values.images.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                        title="Pindah ke kanan"
                      >
                        <ChevronDown size={12} className="-rotate-90" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {!img.is_primary && (
                        <button
                          onClick={() => setPrimary(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7ff53] text-black"
                          title="Jadikan utama"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
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
        </Section>

        {/* === Section: Sales (no variants) === */}
        {!values.has_variants && (
          <Section
            id="sales"
            title="Informasi Penjualan"
            icon={Package}
            open={openSection === "sales"}
            onToggle={() => sectionToggle("sales")}
            errors={["base_price", "sale_price", "stock", "min_purchase", "max_purchase"].filter((k) => errors[k])}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Harga Normal (IDR)" required error={errors.base_price}>
                <input
                  data-field="base_price"
                  type="number"
                  min={0}
                  value={values.base_price || ""}
                  onChange={(e) => update("base_price", Number(e.target.value) || 0)}
                  placeholder="199000"
                  className="wali-input"
                />
                <p className="mt-1 text-[10px] text-white/40">Preview: {formatRupiah(values.base_price)}</p>
              </Field>

              <Field label="Harga Diskon (opsional)" error={errors.sale_price}>
                <input
                  data-field="sale_price"
                  type="number"
                  min={0}
                  value={values.sale_price ?? ""}
                  onChange={(e) => update("sale_price", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="150000"
                  className="wali-input"
                />
                {values.sale_price !== null && values.sale_price > 0 && values.base_price > 0 && (
                  <p className="mt-1 text-[10px] text-[#d7ff53]">
                    Hemat {Math.round(((values.base_price - values.sale_price) / values.base_price) * 100)}%
                  </p>
                )}
              </Field>

              <Field label="Stok" error={errors.stock}>
                <input
                  data-field="stock"
                  type="number"
                  min={0}
                  value={values.stock || ""}
                  onChange={(e) => update("stock", Number(e.target.value) || 0)}
                  placeholder="0"
                  className="wali-input"
                />
              </Field>

              <Field label="Status Stok" hint="Otomatis dari nilai stok">
                <div className="wali-input flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${
                      totalStock > 10
                        ? "border-[#d7ff53]/30 bg-[#d7ff53]/15 text-[#d7ff53]"
                        : totalStock > 0
                        ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
                        : "border-red-500/30 bg-red-500/15 text-red-300"
                    }`}
                  >
                    {totalStock > 10 ? "Tersedia" : totalStock > 0 ? "Stok Rendah" : "Habis"}
                  </span>
                </div>
              </Field>

              <Field label="Minimal Pembelian" error={errors.min_purchase}>
                <input
                  type="number"
                  min={1}
                  value={values.min_purchase || ""}
                  onChange={(e) => update("min_purchase", Math.max(1, Number(e.target.value) || 1))}
                  className="wali-input"
                />
              </Field>

              <Field label="Maksimal Pembelian" hint="0 = tidak terbatas" error={errors.max_purchase}>
                <input
                  type="number"
                  min={0}
                  value={values.max_purchase || ""}
                  onChange={(e) => update("max_purchase", Number(e.target.value) || 0)}
                  className="wali-input"
                />
              </Field>
            </div>
          </Section>
        )}

        {/* === Section: Variants === */}
        <Section
          id="variants"
          title="Variasi Produk"
          icon={Package}
          open={openSection === "variants"}
          onToggle={() => sectionToggle("variants")}
          badge={values.has_variants ? `${values.variants.length} varian` : "Nonaktif"}
          errors={errors.variants ? ["variants"] : []}
        >
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div>
                <p className="text-sm font-bold">Produk memiliki variasi</p>
                <p className="text-[11px] text-white/50">Aktifkan untuk membuat kombinasi ukuran/warna dll.</p>
              </div>
              <input
                type="checkbox"
                checked={values.has_variants}
                onChange={(e) => update("has_variants", e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-[#d7ff53]"
              />
            </label>

            {values.has_variants && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Variasi 1 (mis. Ukuran)">
                    <input
                      value={values.option_1_name}
                      onChange={(e) => update("option_1_name", e.target.value)}
                      placeholder="Ukuran"
                      className="wali-input"
                    />
                  </Field>
                  <Field label="Pilihan Variasi 1" error={errors.option_1_values} hint="Pisahkan dengan koma atau Enter">
                    <OptionInput
                      values={values.option_1_values}
                      onChange={(v) => update("option_1_values", v)}
                    />
                  </Field>
                  <Field label="Variasi 2 (opsional, mis. Warna)">
                    <input
                      value={values.option_2_name}
                      onChange={(e) => update("option_2_name", e.target.value)}
                      placeholder="Warna"
                      className="wali-input"
                    />
                  </Field>
                  <Field label="Pilihan Variasi 2" hint="Pisahkan dengan koma atau Enter">
                    <OptionInput
                      values={values.option_2_values}
                      onChange={(v) => update("option_2_values", v)}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={generateVariants}
                    className="flex items-center gap-1.5 rounded-full bg-[#d7ff53] px-4 py-1.5 text-[11px] font-black uppercase text-black transition hover:bg-white"
                  >
                    <Plus size={12} /> Generate Kombinasi
                  </button>
                  <button
                    type="button"
                    onClick={autoGenerateSku}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-[11px] font-black uppercase text-white/70 transition hover:bg-white/5"
                  >
                    Auto SKU
                  </button>
                </div>

                {values.variants.length > 0 && (
                  <>
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/[0.04] text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                              <th className="px-2 py-2 w-8"></th>
                              <th className="px-2 py-2">{values.option_1_name || "Varian 1"}</th>
                              {values.option_2_name && <th className="px-2 py-2">{values.option_2_name}</th>}
                              <th className="px-2 py-2">SKU</th>
                              <th className="px-2 py-2 text-right">Harga</th>
                              <th className="px-2 py-2 text-right">Diskon</th>
                              <th className="px-2 py-2 text-right">Stok</th>
                              <th className="px-2 py-2 text-center">Aktif</th>
                              <th className="px-2 py-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.variants.map((va, idx) => {
                              if (va.toDelete) return null;
                              const key = va.id || `idx-${idx}`;
                              return (
                                <tr key={key} className="border-b border-white/5 last:border-0">
                                  <td className="px-2 py-1.5">
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
                                      className="h-3.5 w-3.5 accent-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 font-bold text-white/85">{va.option_1_value}</td>
                                  {values.option_2_name && (
                                    <td className="px-2 py-1.5 text-white/70">{va.option_2_value || "-"}</td>
                                  )}
                                  <td className="px-2 py-1.5">
                                    <input
                                      value={va.sku}
                                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                      className="w-28 rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] font-mono outline-none focus:border-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.price || ""}
                                      onChange={(e) => updateVariant(idx, "price", Number(e.target.value) || 0)}
                                      className="w-20 rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] text-right outline-none focus:border-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.sale_price ?? ""}
                                      onChange={(e) => updateVariant(idx, "sale_price", e.target.value === "" ? null : Number(e.target.value))}
                                      className="w-20 rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] text-right outline-none focus:border-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      value={va.stock || ""}
                                      onChange={(e) => updateVariant(idx, "stock", Number(e.target.value) || 0)}
                                      className="w-16 rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] text-right outline-none focus:border-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={va.is_active}
                                      onChange={(e) => updateVariant(idx, "is_active", e.target.checked)}
                                      className="h-3.5 w-3.5 accent-[#d7ff53]"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(idx)}
                                      className="text-red-300/60 hover:text-red-300"
                                      title="Hapus variasi"
                                    >
                                      <Trash2 size={11} />
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
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                      <p className="px-2 text-[10px] font-black uppercase text-white/40">
                        Bulk: {selectedVariants.size > 0 ? `${selectedVariants.size} dipilih` : "semua"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBulkPrice((s) => !s)}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase text-white/65 hover:bg-white/5"
                      >
                        Set Harga
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBulkStock((s) => !s)}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase text-white/65 hover:bg-white/5"
                      >
                        Set Stok
                      </button>
                      <button
                        type="button"
                        onClick={() => applyBulkStatus(true)}
                        className="rounded-full border border-[#d7ff53]/20 px-2.5 py-1 text-[10px] font-bold uppercase text-[#d7ff53] hover:bg-[#d7ff53]/10"
                      >
                        Aktifkan
                      </button>
                      <button
                        type="button"
                        onClick={() => applyBulkStatus(false)}
                        className="rounded-full border border-orange-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-300 hover:bg-orange-500/10"
                      >
                        Nonaktifkan
                      </button>
                    </div>

                    {showBulkPrice && (
                      <div className="flex items-center gap-2 rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-2">
                        <input
                          type="number"
                          min={0}
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          placeholder="Harga baru"
                          className="w-32 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none focus:border-[#d7ff53]"
                        />
                        <button
                          onClick={applyBulkPrice}
                          className="rounded-full bg-[#d7ff53] px-3 py-1 text-[10px] font-black uppercase text-black"
                        >
                          Terapkan
                        </button>
                        <button onClick={() => setShowBulkPrice(false)} className="text-white/50">
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {showBulkStock && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-2">
                        <select
                          value={bulkAdjust}
                          onChange={(e) => setBulkAdjust(e.target.value)}
                          className="rounded border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none focus:border-[#d7ff53]"
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
                          className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none focus:border-[#d7ff53]"
                        />
                        <button
                          onClick={applyBulkStock}
                          className="rounded-full bg-[#d7ff53] px-3 py-1 text-[10px] font-black uppercase text-black"
                        >
                          Terapkan
                        </button>
                        <button onClick={() => setShowBulkStock(false)} className="text-white/50">
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {errors.variants && (
                      <p className="text-xs font-bold text-red-300">{errors.variants}</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </Section>

        {/* === Section: Shipping === */}
        <Section
          id="shipping"
          title="Pengiriman"
          icon={Package}
          open={openSection === "shipping"}
          onToggle={() => sectionToggle("shipping")}
          errors={errors.weight ? ["weight"] : []}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Berat (gram)" hint="Wajib untuk produk fisik" error={errors.weight}>
              <input
                data-field="weight"
                type="number"
                min={0}
                value={values.weight || ""}
                onChange={(e) => update("weight", Number(e.target.value) || 0)}
                placeholder="300"
                className="wali-input"
              />
            </Field>
            <Field label="Panjang (cm)">
              <input
                type="number"
                min={0}
                value={values.length || ""}
                onChange={(e) => update("length", Number(e.target.value) || 0)}
                className="wali-input"
              />
            </Field>
            <Field label="Lebar (cm)">
              <input
                type="number"
                min={0}
                value={values.width || ""}
                onChange={(e) => update("width", Number(e.target.value) || 0)}
                className="wali-input"
              />
            </Field>
            <Field label="Tinggi (cm)">
              <input
                type="number"
                min={0}
                value={values.height || ""}
                onChange={(e) => update("height", Number(e.target.value) || 0)}
                className="wali-input"
              />
            </Field>
          </div>
        </Section>

        {/* === Section: Additional === */}
        <Section
          id="additional"
          title="Informasi Tambahan"
          icon={Info}
          open={openSection === "additional"}
          onToggle={() => sectionToggle("additional")}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <ToggleCard
                label="Produk Unggulan"
                desc="Tampil di section khusus"
                value={values.is_featured}
                onChange={(v) => update("is_featured", v)}
              />
              <ToggleCard
                label="Produk Baru"
                desc="Tampil di section terbaru"
                value={values.is_new}
                onChange={(v) => update("is_new", v)}
              />
              <ToggleCard
                label="Pre-Order"
                desc={values.is_preorder ? `Waktu proses: ${values.preorder_days} hari` : "Stok langsung dikirim"}
                value={values.is_preorder}
                onChange={(v) => update("is_preorder", v)}
              />
            </div>

            {values.is_preorder && (
              <Field label="Waktu Proses (hari)">
                <input
                  type="number"
                  min={0}
                  value={values.preorder_days || ""}
                  onChange={(e) => update("preorder_days", Number(e.target.value) || 0)}
                  placeholder="7"
                  className="wali-input"
                />
              </Field>
            )}

            <Field label="Catatan Internal (tidak tampil ke customer)">
              <textarea
                value={values.internal_notes}
                onChange={(e) => update("internal_notes", e.target.value)}
                rows={3}
                placeholder="Catatan untuk tim internal..."
                className="wali-input resize-none"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SEO Title" hint={`${values.seo_title.length}/70`}>
                <input
                  value={values.seo_title}
                  onChange={(e) => update("seo_title", e.target.value.slice(0, 70))}
                  placeholder="Otomatis dari nama produk"
                  className="wali-input"
                />
              </Field>
              <Field label="SEO Description" hint={`${values.seo_description.length}/160`}>
                <textarea
                  value={values.seo_description}
                  onChange={(e) => update("seo_description", e.target.value.slice(0, 160))}
                  rows={2}
                  className="wali-input resize-none"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Mobile-only sticky save bar */}
        <MobileSaveBar
          onSaveDraft={() => submit("draft")}
          onPublish={() => submit("publish")}
          savingDraft={savingDraft}
          publishing={publishing}
        />
      </div>

      {/* === Sidebar Summary === */}
      <SidebarSummary
        status={values.status}
        onStatusChange={(s) => update("status", s)}
        completion={completion}
        totalStock={totalStock}
        priceRange={priceRange || "—"}
        variantCount={values.has_variants ? values.variants.filter((v) => !v.toDelete).length : 0}
        hasVariants={values.has_variants}
        onSaveDraft={() => submit("draft")}
        onPublish={() => submit("publish")}
        savingDraft={savingDraft}
        publishing={publishing}
        mode={mode}
      />

      <ProductFormStyles />
    </div>
  );
}

/* ============== Subcomponents ============== */

function Section({
  id,
  title,
  icon: Icon,
  open,
  onToggle,
  children,
  badge,
  errors,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  errors?: string[];
}) {
  return (
    <div data-section={id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[#d7ff53]" />
          <h2 className="text-sm font-black uppercase tracking-wide">{title}</h2>
          {badge && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-white/65">
              {badge}
            </span>
          )}
          {errors && errors.length > 0 && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-red-300">
              {errors.length} error
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
      </button>
      {open && <div className="border-t border-white/5 p-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
        <span>
          {label} {required && <span className="text-red-300">*</span>}
        </span>
        {hint && <span className="text-white/30">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] font-bold text-red-300">{error}</p>}
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
    <div className="wali-input flex flex-wrap items-center gap-1.5 !py-2">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="text-white/50 hover:text-white"
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
        className="flex-1 min-w-[80px] bg-transparent text-xs outline-none"
      />
    </div>
  );
}

function ToggleCard({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`rounded-xl border p-3 text-left transition ${
        value
          ? "border-[#d7ff53]/40 bg-[#d7ff53]/10"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold ${value ? "text-[#d7ff53]" : "text-white/85"}`}>{label}</p>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            value ? "bg-[#d7ff53] text-black" : "bg-white/10 text-transparent"
          }`}
        >
          <Check size={11} strokeWidth={3} />
        </span>
      </div>
      <p className="mt-1 text-[11px] text-white/50">{desc}</p>
    </button>
  );
}

function SidebarSummary({
  status,
  onStatusChange,
  completion,
  totalStock,
  priceRange,
  variantCount,
  hasVariants,
  onSaveDraft,
  onPublish,
  savingDraft,
  publishing,
  mode,
}: {
  status: ProductFormValues["status"];
  onStatusChange: (s: ProductFormValues["status"]) => void;
  completion: { pct: number; checks: Array<{ key: string; label: string; done: boolean }> };
  totalStock: number;
  priceRange: string;
  variantCount: number;
  hasVariants: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  savingDraft: boolean;
  publishing: boolean;
  mode: "create" | "edit";
}) {
  return (
    <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Status Kelengkapan
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#d7ff53"
                strokeWidth="3"
                strokeDasharray={`${(completion.pct / 100) * 94.2} 94.2`}
                strokeLinecap="round"
                className="transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-base font-black">
              {completion.pct}%
            </div>
          </div>
          <ul className="flex-1 space-y-0.5 text-[11px]">
            {completion.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-1.5">
                {c.done ? (
                  <Check size={10} className="text-[#d7ff53]" />
                ) : (
                  <X size={10} className="text-red-300/70" />
                )}
                <span className={c.done ? "text-white/70 line-through" : "text-white/85"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Ringkasan
        </h3>
        <dl className="mt-3 space-y-2 text-xs">
          <Row label="Harga" value={priceRange} />
          <Row label="Total Stok" value={String(totalStock)} accent={totalStock === 0 ? "red" : totalStock < 10 ? "orange" : "green"} />
          {hasVariants && <Row label="Jumlah Variasi" value={String(variantCount)} />}
          <Row label="Status" value={
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_OPTIONS.find((s) => s.v === status)?.color}`}>
              {STATUS_OPTIONS.find((s) => s.v === status)?.l}
            </span>
          } />
        </dl>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Publikasi
        </h3>
        <div className="mt-3 space-y-2">
          <button
            onClick={onPublish}
            disabled={publishing || savingDraft}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#d7ff53] px-4 py-2.5 text-sm font-black uppercase text-black transition hover:bg-white disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {mode === "create" ? "Simpan & Publikasikan" : "Simpan & Publikasikan"}
          </button>
          <button
            onClick={onSaveDraft}
            disabled={savingDraft || publishing}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black uppercase text-white/80 transition hover:bg-white/10 disabled:opacity-50"
          >
            {savingDraft ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Draft
          </button>
          <Link
            href="/admin/products"
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-white/5"
          >
            Batal
          </Link>
        </div>

        <div className="mt-3 border-t border-white/5 pt-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ProductFormValues["status"])}
            className="wali-input mt-1.5"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "green" | "orange" | "red" }) {
  const color = accent === "red" ? "text-red-300" : accent === "orange" ? "text-orange-300" : accent === "green" ? "text-[#d7ff53]" : "text-white/85";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/50">{label}</dt>
      <dd className={`font-bold ${color}`}>{value}</dd>
    </div>
  );
}

function MobileSaveBar({
  onSaveDraft,
  onPublish,
  savingDraft,
  publishing,
}: {
  onSaveDraft: () => void;
  onPublish: () => void;
  savingDraft: boolean;
  publishing: boolean;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 -mx-4 mt-6 flex gap-2 border-t border-white/10 bg-black/95 p-3 backdrop-blur lg:hidden">
      <button
        onClick={onSaveDraft}
        disabled={savingDraft || publishing}
        className="flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-black uppercase text-white/80 disabled:opacity-50"
      >
        {savingDraft ? "..." : "Draft"}
      </button>
      <button
        onClick={onPublish}
        disabled={publishing || savingDraft}
        className="flex-[2] rounded-full bg-[#d7ff53] px-3 py-2.5 text-xs font-black uppercase text-black disabled:opacity-50"
      >
        {publishing ? "Menyimpan..." : "Publikasikan"}
      </button>
    </div>
  );
}

function ProductFormStyles() {
  return (
    <style jsx global>{`
      .wali-input {
        width: 100%;
        border-radius: 0.75rem;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(0,0,0,0.40);
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: white;
        outline: none;
        transition: border-color 0.15s;
      }
      .wali-input::placeholder {
        color: rgba(255,255,255,0.30);
        font-weight: 400;
      }
      .wali-input:focus {
        border-color: #d7ff53;
      }
      .wali-input option {
        background: #000;
        color: white;
      }
    `}</style>
  );
}
