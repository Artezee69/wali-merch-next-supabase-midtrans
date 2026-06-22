/**
 * Static list of Lucide icon names used by the homepage settings
 * (Trust Badges). We intentionally avoid a dynamic `import("lucide-react")`
 * bundle-inspection approach — that would inflate the admin bundle and
 * break server components. Instead we curate a small, common set.
 *
 * If you need a new icon, add the PascalCase name here and reference it
 * from a default in DEFAULT_HOMEPAGE_SETTINGS.trustBadges.
 */
export const lucideIconNames: string[] = [
  "ShieldCheck",
  "Shield",
  "BadgeCheck",
  "Award",
  "CheckCircle2",
  "CheckCircle",
  "Star",
  "Sparkles",
  "Truck",
  "Package",
  "Package2",
  "PackageCheck",
  "Lock",
  "CreditCard",
  "Wallet",
  "Tag",
  "Tags",
  "Headphones",
  "MessageCircle",
  "Mail",
  "Phone",
  "PhoneCall",
  "MapPin",
  "Clock",
  "Zap",
  "Flame",
  "Rocket",
  "Trophy",
  "Heart",
  "ThumbsUp",
  "Gift",
  "Crown",
  "Verified",
  "Percent",
  "CircleDot",
  "Infinity",
  "Globe",
  "Gem",
  "TruckIcon",
  "RotateCcw",
  "RefreshCw",
  "Box",
  "ShoppingBag",
  "ShoppingCart",
  "Store",
  "Users",
  "User",
  "UserCheck",
];
