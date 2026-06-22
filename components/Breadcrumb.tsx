import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: Crumb[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-wider text-white/45">
      <Link
        href="/"
        className="flex items-center gap-1.5 transition hover:text-[#d7ff53]"
      >
        <Home size={12} strokeWidth={2.5} />
        Home
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight size={12} strokeWidth={2.5} className="text-white/25" />
            {item.href && !isLast ? (
              <Link href={item.href} className="transition hover:text-[#d7ff53]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[#d7ff53]" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
