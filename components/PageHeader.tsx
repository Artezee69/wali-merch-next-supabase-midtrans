import { ReactNode } from "react";

type PageHeaderProps = {
  badge: string;
  title: ReactNode;
  highlight?: string;
  description?: string;
};

export default function PageHeader({
  badge,
  title,
  highlight,
  description,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Layered aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.18),_transparent_55%)]" />
        <div
          className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-[#5e8bff]/10 blur-[140px] animate-aurora-2"
          style={{ filter: "blur(140px)" }}
        />
        <div
          className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#ff5edb]/10 blur-[140px] animate-aurora-1"
          style={{ filter: "blur(140px)" }}
        />
        <div className="absolute inset-0 bg-grid-fade [background-size:48px_48px] opacity-[0.25]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,#0b0b0b_95%)]" />
      </div>

      {/* Top metadata strip */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-6 md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/55 backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d7ff53] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d7ff53]" />
          </span>
          {badge}
        </div>
        <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45 backdrop-blur-md sm:flex">
          <span className="text-white/35">SS/26</span>
          <span className="text-[#d7ff53]">Capsule</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-8 md:py-20 lg:py-24">
        <div className="max-w-4xl">
          <h1 className="font-display text-[clamp(2.5rem,9vw,5.5rem)] font-black uppercase leading-[0.88] tracking-[-0.03em]">
            <span className="block overflow-hidden">
              <span className="block bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
                {title}
              </span>
            </span>
            {highlight && (
              <span className="mt-2 block overflow-hidden">
                <span className="block bg-gradient-to-r from-[#d7ff53] via-[#f6ffb8] to-[#d7ff53] bg-clip-text text-transparent [background-size:200%_auto] animate-gradient-x">
                  {highlight}
                </span>
              </span>
            )}
          </h1>

          {description && (
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:mt-7 sm:text-base sm:leading-8 md:text-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom corner accent */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 overflow-hidden opacity-40">
        <div className="absolute top-0 right-0 h-px w-20 bg-gradient-to-l from-[#d7ff53] to-transparent" />
        <div className="absolute top-0 right-0 h-20 w-px bg-gradient-to-b from-[#d7ff53] to-transparent" />
      </div>
    </section>
  );
}