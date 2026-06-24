"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HomeHero, TrustBadge } from "@/lib/homeContent";

// ─── Types ───────────────────────────────────────────────────────────────────

type HeroAuroraProps = {
  content: HomeHero;
  trustBadges?: TrustBadge[];
  stats?: Array<{ value: string; label: string; icon?: string }>;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  hue: number;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HeroAurora({ content, trustBadges, stats }: HeroAuroraProps) {
  // ── Background configuration ──────────────────────────────────────────────
  const HERO_PHOTO = "/cta/wali-singapura.webp";
  const bgType: "gradient" | "solid" | "image" = content.backgroundType ?? "image";
  const bgColor = content.backgroundColor || "#0b0b0b";
  const bgImage = content.backgroundImageUrl?.trim()
    ? content.backgroundImageUrl
    : HERO_PHOTO;
  const customGradient = content.backgroundGradient || "";
  const overlayOpacity = (content.backgroundOverlay ?? 35) / 100;
  const baseOpacity = (content.backgroundOpacity ?? overlayOpacity) / 100;

  const hasImage = bgType !== "solid" && bgImage.length > 0 && bgImage !== "/images/";
  const showCustomGradient = bgType === "gradient" && !!customGradient;

  let backdropStyle: React.CSSProperties = {};
  if (bgType === "solid") {
    backdropStyle = { background: bgColor, opacity: baseOpacity };
  } else if (bgType === "gradient" && customGradient) {
    backdropStyle = { background: customGradient, opacity: baseOpacity };
  }

  // ── Derived trust items ───────────────────────────────────────────────────
  const trustItems: TrustBadge[] =
    trustBadges && trustBadges.length > 0
      ? trustBadges
      : content.trust1
      ? [
          { id: "t1", text: content.trust1, icon: "shield", enabled: true },
          { id: "t2", text: content.trust2, icon: "zap", enabled: true },
          { id: "t3", text: content.trust3, icon: "sparkles", enabled: true },
        ]
      : [];

  // ── Mouse parallax ────────────────────────────────────────────────────────
  const sectionRef = useRef<HTMLElement | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setParallax({ x: dx, y: dy });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Particle field ────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const count = Math.min(40, Math.floor((rect.width * rect.height) / 30000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: 0.6 + Math.random() * 1.6,
        speed: 0.05 + Math.random() * 0.15,
        drift: (Math.random() - 0.5) * 0.3,
        opacity: 0.2 + Math.random() * 0.4,
        hue: 70 + Math.random() * 30,
      }));
    };

    const onResize = () => resize();
    resize();
    window.addEventListener("resize", onResize);

    let t0 = performance.now();
    const draw = (t: number) => {
      const dt = (t - t0) / 16;
      t0 = t;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const p of particles) {
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        if (p.y < -4) {
          p.y = rect.height + 4;
          p.x = Math.random() * rect.width;
        }
        if (p.x < 0) p.x = rect.width;
        if (p.x > rect.width) p.x = 0;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ── Reveal state ──────────────────────────────────────────────────────────
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(id);
  }, []);

  // ── Content values (with fallbacks matching the reference screenshot) ─────
  const badgeText = content.badge || "LIVE DROP 2026 ACTIVE";
  const subtitleText = content.subheadline || "";
  const primaryLabel = content.primaryCtaLabel || "KOLEKSI TOKO";
  const primaryHref = content.primaryCtaHref || "/products";
  const secondaryLabel = content.secondaryCtaLabel || "LACAK PESANAN";
  const secondaryHref = content.secondaryCtaHref || "/track-order";

  // Trust label strings (displayed as small caps at bottom)
  const trustLabels = trustItems
    .filter((b) => b.enabled !== false && b.text)
    .map((b) => b.text);

  return (
    <section
      ref={sectionRef}
      id="home-hero"
      className="relative isolate overflow-hidden bg-[#0b0b0b]"
    >
      {/* ═══════════════════════════════════════════════════════════════
          BACKGROUND LAYERS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Layer 0: solid color or custom gradient (-z-30) */}
      {(bgType === "solid" || showCustomGradient) && (
        <div
          className="pointer-events-none absolute inset-0 -z-30"
          style={backdropStyle}
        />
      )}

      {/* Layer 1: background photo (-z-20) */}
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt=""
            className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
            style={{ filter: "blur(4px)", transform: "scale(1.03)" }}
          />
          {/* Base dark scrim — slightly heavier so logo pops */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-black"
            style={{ opacity: overlayOpacity }}
          />
          {/* Radial vignette — darker in center (where text sits),
              keeping the edges of the photo more visible. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.20) 55%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </>
      ) : null}

      {/* Layer 2: aurora blobs with mouse parallax (-z-10) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          transform: `translate3d(${parallax.x * -24}px, ${parallax.y * -24}px, 0)`,
          transition: "transform 320ms ease-out",
        }}
      >
        <div
          className="absolute -top-32 -left-20 h-[520px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.12),transparent_70%)] blur-3xl"
          style={{ animation: "aurora-drift-1 14s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 h-[480px] w-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(94,139,255,0.08),transparent_70%)] blur-3xl"
          style={{ animation: "aurora-drift-2 17s ease-in-out infinite alternate" }}
        />
      </div>

      {/* Layer 3: particle canvas (-z-5) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] h-full w-full"
        style={{
          transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0)`,
          transition: "transform 320ms ease-out",
        }}
      />

      {/* Top / bottom fade masks (-z-2) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-[2] h-32 bg-gradient-to-b from-[#0b0b0b] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-[2] h-32 bg-gradient-to-t from-[#0b0b0b] to-transparent" />

      {/* ═══════════════════════════════════════════════════════════════
          ANIMATION KEYFRAMES
          ═══════════════════════════════════════════════════════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora-drift-1 {
          0%   { transform: translate(0, 0) scale(1);     opacity: 0.7; }
          50%  { transform: translate(60px, 30px) scale(1.08); opacity: 1; }
          100% { transform: translate(-30px, 60px) scale(0.95); opacity: 0.75; }
        }
        @keyframes aurora-drift-2 {
          0%   { transform: translate(0, 0) scale(1);     opacity: 0.55; }
          50%  { transform: translate(-50px, -30px) scale(1.06); opacity: 0.95; }
          100% { transform: translate(40px, 20px) scale(0.97); opacity: 0.65; }
        }
        @keyframes logo-reveal {
          from { opacity: 0; transform: translateY(32px) scale(0.96); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      ` }} />

      {/* ═══════════════════════════════════════════════════════════════
          BADGE PILLOT — floating near top-center, outside the main content flow
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center md:min-h-[70vh]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 md:gap-6 md:px-6">

          {/* Badge pill */}
          <div
            className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/40"
            style={{
              animation: revealed
                ? "logo-reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            <span className="relative">{badgeText}</span>
          </div>

          {/* ── WALI Logo ── */}
          <div
            className="flex flex-col items-center"
            style={{ perspective: "1000px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cta/LOGO MERCH FIX SIZE.webp"
              alt="OFFICIAL MERCHANDISE"
              width={800}
              height={800}
              decoding="async"
              className="h-auto w-[70vw] max-w-[400px] select-none opacity-0"
              style={{
                filter: "drop-shadow(0 0 60px rgba(215,255,83,0.12))",
                animation: revealed
                  ? "logo-reveal 1200ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both"
                  : undefined,
                opacity: revealed ? 1 : 0,
              }}
            />
          </div>

          {/* ── Subtitle — small, understated ── */}
          {subtitleText && (
            <p
              className="max-w-md text-center text-sm leading-relaxed text-white/60 md:text-base"
              style={{
                animation: revealed
                  ? "logo-reveal 1000ms cubic-bezier(0.16, 1, 0.3, 1) 500ms both"
                  : undefined,
                opacity: revealed ? undefined : 0,
              }}
            >
              {subtitleText}
            </p>
          )}

          {/* ── CTA Buttons ── */}
          <div
            className="mt-3 flex items-center gap-3"
            style={{
              animation: revealed
                ? "logo-reveal 800ms cubic-bezier(0.16, 1, 0.3, 1) 550ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-[#d7ff53] px-7 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all duration-500 hover:bg-[#c7ef33] hover:shadow-[0_0_20px_rgba(215,255,83,0.25)]"
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-7 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 backdrop-blur transition-all duration-500 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </section>
  );
}
