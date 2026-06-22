"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type Variant = "fade" | "blur" | "slide-x" | "scale" | "fade-strong" | "blur-in" | "scale-in" | "sway";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "main" | "aside" | "nav";
  once?: boolean;
  variant?: Variant;
};

export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  once = true,
  variant = "fade",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const Component = Tag as any;

  let baseStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: `opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: "opacity, transform, filter",
  };

  switch (variant) {
    case "blur":
      baseStyle = {
        ...baseStyle,
        filter: visible ? "blur(0)" : "blur(10px)",
        transform: visible ? "translateY(0)" : "translateY(20px)",
      };
      break;
    case "slide-x":
      baseStyle = {
        ...baseStyle,
        transform: visible ? "translateX(0)" : "translateX(-40px)",
      };
      break;
    case "scale":
      baseStyle = {
        ...baseStyle,
        transform: visible ? "scale(1)" : "scale(0.92)",
      };
      break;
    case "fade-strong":
      baseStyle = {
        ...baseStyle,
        transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
      };
      break;
    default:
      baseStyle = {
        ...baseStyle,
        transform: visible ? "translateY(0)" : "translateY(28px)",
      };
  }

  return (
    <Component
      ref={ref as any}
      className={className}
      style={baseStyle}
    >
      {children}
    </Component>
  );
}
