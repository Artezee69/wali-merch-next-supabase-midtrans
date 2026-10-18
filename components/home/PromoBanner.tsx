import Link from "next/link";
import type { Banner } from "@/lib/banners";

type Props = {
  banner: Banner | null;
  /** Layout variant: stacked vertical by default */
  className?: string;
};

/**
 * Promo banner kanan (right_top / right_bottom). Berupa kartu image-only
 * dengan link opsional. Banner null = tidak render apa-apa.
 */
export default function PromoBanner({ banner, className }: Props) {
  if (!banner || !banner.image_url) return null;

  const Wrapper = banner.button_link ? Link : "div";
  const wrapperProps = banner.button_link
    ? { href: banner.button_link }
    : ({} as { href?: string });

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/5 bg-gray-900 dark:bg-gray-950 ${
        className ?? ""
      }`}
    >
      {/* @ts-expect-error - dynamic tag with conditional props */}
      <Wrapper
        {...wrapperProps}
        className="group block h-full w-full overflow-hidden"
        aria-label={banner.title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.image_url}
          alt={banner.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover sm:transition-transform sm:duration-500 sm:group-hover:scale-105"
          draggable={false}
        />
        {banner.title && !banner.hide_overlay && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent dark:from-gray-950/80 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-white dark:text-gray-100 sm:text-base">
              {banner.title}
            </p>
            {banner.button_text && (
              <span className="mt-1 inline-block text-[11px] font-bold uppercase tracking-wider text-[#d7ff53]">
                {banner.button_text} →
              </span>
            )}
          </div>
        )}
      </Wrapper>
    </div>
  );
}