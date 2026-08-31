import Link from "next/link";
import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-charcoal text-ivory hover:bg-charcoal-soft",
  gold: "bg-gold text-charcoal hover:bg-gold-soft",
  outline: "border border-charcoal/30 text-charcoal hover:border-charcoal bg-transparent",
  "outline-light": "border border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory/10 bg-transparent",
  ghost: "text-charcoal hover:bg-charcoal/5",
};

const SIZES = {
  sm: "text-sm px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return <Link href={href} className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}
