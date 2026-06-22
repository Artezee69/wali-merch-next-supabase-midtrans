"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  type LucideIcon,
  MousePointer2,
  MoveDown,
} from "lucide-react";
import type { HomeHero, HomepageStat, TrustBadge } from "@/lib/homeContent";
import { resolveIcon } from "@/lib/settingsIcons";
import { useT } from "@/lib/i18n/useT";

type HeroAuroraProps = {
  content: HomeHero;
  stats?: HomepageStat[];
  trustBadges?: TrustBadge[];
};

type BgType = "gradient" | "solid" | "image";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  hue: number;
};

export default function HeroAurora({
  content,
  stats,
  trustBadges,
}: HeroAuroraProps) {
  const t = useT();
  const bgType: BgType = content.backgroundType ?? "gradient";
  const bgColor = content.backgroundColor || "#0b0b0b";
  const bgImage = content.backgroundImageUrl || "";
  const customGradient = content.backgroundGradient || "";
  const overlayOpacity = (content.backgroundOverlay ?? 50) / 100;
  const baseOpacity = (content.backgroundOpacity ?? overlayOpacity) / 100;

  const hasImage =
    bgType === "image" && bgImage.length > 0 && bgImage !== "/images/";

  const showCustomGradient = bgType === "gradient" && !!customGradient;

  let backdropStyle: React.CSSProperties = {};
  if (bgType === "solid") {
    backdropStyle = { background: bgColor, opacity: baseOpacity };
  } else if (bgType === "gradient" && customGradient) {
    backdropStyle = { background: customGradient, opacity: baseOpacity };
  }

  const statItems: HomepageStat[] =
    stats && stats.length > 0
      ? stats
      : content.stat1Value
      ? [
          { id: "s1", value: content.stat1Value, label: content.stat1Label },
          { id: "s2", value: content.stat2Value, label: content.stat2Label },
          { id: "s3", value: content.stat3Value, label: content.stat3Label },
        ]
      : [];

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

  // ─── mouse parallax ─────────────────────────────────────────────────────
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

  // ─── particle field ─────────────────────────────────────────────────────
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

  // ─── headline letter reveal ──────────────────────────────────────────────
  const headlineTop = content.headlineLine1 || "";
  const headlineHi = content.headlineLine2a || "";
  const headlineBot = content.headlineLine2b || "";

  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(id);
  }, []);

  const char = (c: string, i: number) => (
    <span
      key={i}
      className="inline-block"
      style={{
        animation: revealed
          ? `letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 25}ms both`
          : undefined,
        opacity: revealed ? undefined : 0,
      }}
    >
      {c === " " ? " " : c}
    </span>
  );

  return (
    <section
      ref={sectionRef}
      id="home-hero"
      className="hero-cinematic relative isolate overflow-hidden bg-black"
    >
      {/* Layer 1: solid color or custom gradient (z=-30) */}
      {(bgType === "solid" || showCustomGradient) && (
        <div
          className="pointer-events-none absolute inset-0 -z-30"
          style={backdropStyle}
        />
      )}

      {/* Layer 2: background image (z=-20) */}
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt=""
            className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      ) : null}

      {/* Layer 3: aurora blobs (mouse parallax) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          transform: `translate3d(${parallax.x * -24}px, ${parallax.y * -24}px, 0)`,
          transition: "transform 320ms ease-out",
        }}
      >
        <div
          className="absolute -top-32 -left-20 h-[520px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,255,83,0.30),transparent_60%)] blur-3xl"
          style={{ animation: "aurora-drift-1 14s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 h-[480px] w-[620px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_60%)] blur-3xl"
          style={{ animation: "aurora-drift-2 17s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute -bottom-32 right-[-80px] h-[440px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.18),transparent_60%)] blur-3xl"
          style={{ animation: "aurora-drift-3 19s ease-in-out infinite alternate" }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-[360px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_60%)] blur-3xl"
          style={{ animation: "aurora-drift-1 22s ease-in-out infinite alternate-reverse" }}
        />
      </div>

      {/* Layer 4: particle field (mouse parallax, opposite) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] h-full w-full"
        style={{
          transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0)`,
          transition: "transform 320ms ease-out",
        }}
      />

      {/* Layer 5: scan-line + grain */}
      <div className="pointer-events-none absolute inset-0 -z-[4] animate-scan-slow overflow-hidden" />
      <div className="pointer-events-none absolute inset-0 -z-[3] grain opacity-[0.08]" />

      {/* Top/bottom fade to content */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-[2] h-32 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-[2] h-32 bg-gradient-to-t from-black to-transparent" />

      {/* Layer 6: rotating conic rings (decorative) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-[2] hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="relative h-[820px] w-[820px]">
          <div className="absolute inset-0 rounded-full border border-white/[0.04] animate-spin-slower" />
          <div className="absolute inset-12 rounded-full border border-dashed border-white/[0.05] animate-spin-slow" />
          <div className="absolute inset-32 rounded-full border border-white/[0.03]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora-drift-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(60px, 30px) scale(1.08); opacity: 1; }
          100% { transform: translate(-30px, 60px) scale(0.95); opacity: 0.75; }
        }
        @keyframes aurora-drift-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          50% { transform: translate(-50px, -30px) scale(1.06); opacity: 0.95; }
          100% { transform: translate(40px, 20px) scale(0.97); opacity: 0.65; }
        }
        @keyframes aurora-drift-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate(40px, -20px) scale(1.05); opacity: 0.85; }
          100% { transform: translate(-20px, 40px) scale(0.96); opacity: 0.55; }
        }
        @keyframes letter-rise {
          from { opacity: 0; transform: translateY(28px) rotateX(-40deg); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0) rotateX(0); filter: blur(0); }
        }
        @keyframes scan-slow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hero-cinematic .animate-scan-slow::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(215,255,83,0.06) 50%, transparent 100%);
          animation: scan-slow 6s ease-in-out infinite;
          pointer-events: none;
        }
      ` }} />

      {/* ===== Main Content ===== */}
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-32 md:px-8 md:pt-32 md:pb-44">
        <div className="flex flex-col items-center text-center">
          {/* Badge pill with shimmer */}
          <div
            className="hero-badge group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53]"
            style={{
              animation: revealed
                ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            <span className="absolute inset-0 -z-10 holo-sweep" />
            <Sparkles size={12} strokeWidth={2.5} className="animate-pulse-soft" />
            <span className="relative">{content.badge}</span>
          </div>

          {/* Headline (letter-by-letter reveal) */}
          <h1
            className="mt-7 flex max-w-5xl flex-col items-center text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
            style={{ perspective: "1000px" }}
          >
            <span className="flex">{headlineTop.split("").map(char)}</span>
            <span className="mt-1 flex flex-col items-center gap-1 md:flex-row md:gap-2">
              <span className="holo-text text-[#d7ff53]">
                {headlineHi.split("").map(char)}
              </span>
              {headlineBot ? (
                <span className="text-white/95">{headlineBot.split("").map(char)}</span>
              ) : null}
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="mt-6 max-w-2xl text-balance text-sm text-white/65 md:text-base"
            style={{
              animation: revealed
                ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            {content.subheadline}
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{
              animation: revealed
                ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 850ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            {content.primaryCtaHref ? (
              <Link
                href={content.primaryCtaHref}
                className="magnetic-btn group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-8 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:bg-[#d7ff53]/90"
              >
                <span className="absolute inset-0 -z-10 holo-sweep opacity-60" />
                <span className="absolute inset-0 -z-10 animate-shimmer" />
                <span className="relative">{content.primaryCtaLabel}</span>
                <ArrowRight
                  size={16}
                  strokeWidth={3}
                  className="relative transition group-hover:translate-x-1"
                />
              </Link>
            ) : null}
            {content.secondaryCtaHref ? (
              <Link
                href={content.secondaryCtaHref}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white/80 backdrop-blur-md transition hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53]"
              >
                <span className="relative">{content.secondaryCtaLabel}</span>
              </Link>
            ) : null}
          </div>

          {/* Stats strip with gradient border & counter */}
          {statItems.length > 0 ? (
            <div
              className={`mt-14 grid w-full max-w-3xl gap-3 sm:gap-4 ${
                statItems.length === 1
                  ? "grid-cols-1"
                  : statItems.length === 2
                  ? "grid-cols-2"
                  : statItems.length === 4
                  ? "grid-cols-2 md:grid-cols-4"
                  : "grid-cols-3"
              }`}
              style={{
                animation: revealed
                  ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 1000ms both"
                  : undefined,
                opacity: revealed ? undefined : 0,
              }}
            >
              {statItems.map((s, idx) => (
                <div
                  key={s.id}
                  className="stat-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition hover:border-[#d7ff53]/30 hover:bg-white/[0.05] md:p-5"
                  style={{
                    animation: `letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) ${
                      1100 + idx * 100
                    }ms both`,
                    opacity: revealed ? undefined : 0,
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,83,0.06),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
                  <div className="text-2xl font-black text-white transition group-hover:text-[#d7ff53] md:text-3xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Trust strip */}
          {trustItems.filter((b) => b.enabled !== false).length > 0 ? (
            <div
              className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-white/45"
              style={{
                animation: revealed
                  ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 1300ms both"
                  : undefined,
                opacity: revealed ? undefined : 0,
              }}
            >
              {trustItems
                .filter((b) => b.enabled !== false)
                .map((b, i, arr) => {
                  const Icon: LucideIcon = resolveIcon(b.icon);
                  return (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1.5 transition hover:text-[#d7ff53]"
                    >
                      <Icon
                        size={12}
                        strokeWidth={2.5}
                        className="text-[#d7ff53]"
                      />
                      {b.text}
                      {i < arr.length - 1 ? (
                        <span className="ml-6 text-white/15">·</span>
                      ) : null}
                    </span>
                  );
                })}
            </div>
          ) : null}

          {/* Scroll hint */}
          <div
            className="mt-16 flex flex-col items-center gap-2 text-white/30 md:mt-20"
            style={{
              animation: revealed
                ? "letter-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms both"
                : undefined,
              opacity: revealed ? undefined : 0,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
              {t.home.hero.scroll}
            </span>
            <MoveDown
              size={16}
              className="animate-float-y text-[#d7ff53]/70"
              strokeWidth={2}
            />
          </div>

          {/* Mouse hint */}
          <div className="mt-4 hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/25 md:flex">
            <MousePointer2 size={11} className="text-[#d7ff53]/60" />
            {t.home.hero.move}
          </div>
        </div>
      </div>
    </section>
  );
}