import Link from "next/link";
import type { Banner } from "@/lib/banner-types";
import { bannerObjectPosition } from "@/lib/banner-types";

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
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl shadow-black/40 ${
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
          className="absolute inset-0 h-full w-full object-cover sm:transition-transform sm:duration-500 sm:group-hover:scale-[1.04]"
          style={{ objectPosition: bannerObjectPosition(banner.focus_point ?? "center") }}
          draggable={false}
        />
        {banner.title && !banner.hide_overlay && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 sm:p-5">
            <p className="text-[0.75rem] font-black uppercase tracking-wider text-white sm:text-sm md:text-base">
              {banner.title}
            </p>
            {banner.button_text && (
              <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-[#d7ff53] sm:mt-1.5 sm:text-[11px]">
                {banner.button_text} →
              </span>
            )}
          </div>
        )}
      </Wrapper>
    </div>
  );
}