// Icon registry used by settings (header/footer/trust badges).
// We use string names (lucide-react) so JSON in DB stays clean & stable.
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Truck,
  RotateCcw,
  Award,
  Lock,
  Headphones,
  CreditCard,
  Star,
  Heart,
  Music,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  zap: Zap,
  sparkles: Sparkles,
  truck: Truck,
  "rotate-ccw": RotateCcw,
  award: Award,
  lock: Lock,
  headphones: Headphones,
  "credit-card": CreditCard,
  star: Star,
  heart: Heart,
  music: Music,
  "check-circle": CheckCircle2,
};

export const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "shield", label: "Shield (Garansi)" },
  { value: "zap", label: "Zap (Cepat)" },
  { value: "sparkles", label: "Sparkles (Limited)" },
  { value: "truck", label: "Truck (Pengiriman)" },
  { value: "rotate-ccw", label: "Rotate CCW (Refund)" },
  { value: "award", label: "Award (Kualitas)" },
  { value: "lock", label: "Lock (Aman)" },
  { value: "headphones", label: "Headphones (Support)" },
  { value: "credit-card", label: "Credit Card (Pembayaran)" },
  { value: "star", label: "Star (Bintang)" },
  { value: "heart", label: "Heart (Favorit)" },
  { value: "music", label: "Music (Musik)" },
  { value: "check-circle", label: "Check Circle" },
];

// Returns a Lucide icon component for the given icon name. Falls back to
// Sparkles if the name is missing/unknown so the UI never breaks.
export function resolveIcon(name: string | undefined | null) {
  if (!name) return Sparkles;
  return ICON_REGISTRY[name] || Sparkles;
}
