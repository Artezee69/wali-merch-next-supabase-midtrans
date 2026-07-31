import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { getHomepageSettings, getStoreSettings } from "@/lib/storeSettings";
import ClientLayout from "./client-layout";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, store] = await Promise.all([
    getHomepageSettings(),
    getStoreSettings(),
  ]);
  const { seo } = settings;
  const fallbackTitle = store.storeName || "WALI Merch — Official Merchandise Store";
  const fallbackDescription =
    "Official merchandise WALI. Koleksi Player Edition, Regular, dan Vintage Stage Series dengan vibe stage culture dan streetwear premium.";
  const title = seo.metaTitle?.trim() || fallbackTitle;
  const description = seo.metaDescription?.trim() || fallbackDescription;
  const ogTitle = seo.ogTitle?.trim() || title;
  const ogDescription = seo.ogDescription?.trim() || description;

  return {
    title,
    description,
    keywords: [
      "WALI merch",
      "official merchandise",
      "t-shirt band",
      "streetwear Indonesia",
    ],
    authors: [{ name: "Official Merchandise WALI" }],
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
