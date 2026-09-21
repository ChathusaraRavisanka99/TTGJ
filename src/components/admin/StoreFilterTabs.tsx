import Link from "next/link";
import { cn } from "@/lib/utils";

export type StoreFilter = "all" | "intl" | "lk";

export function parseStoreFilter(value: string | string[] | undefined): StoreFilter {
  return value === "lk" ? "lk" : value === "intl" ? "intl" : "all";
}

// All | International | Sri Lanka filter for the admin catalog lists. Plain
// links with a `?market=` query param, so it survives a refresh and the
// lists stay Server Components.
export function StoreFilterTabs({ basePath, current }: { basePath: string; current: StoreFilter }) {
  const tabs: { key: StoreFilter; label: string; href: string }[] = [
    { key: "all", label: "All stores", href: basePath },
    { key: "intl", label: "International", href: `${basePath}?market=intl` },
    { key: "lk", label: "Sri Lanka", href: `${basePath}?market=lk` },
  ];
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            current === tab.key ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
