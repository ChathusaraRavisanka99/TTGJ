import Link from "next/link";
import { GemVisualizer } from "@/components/gem-visualizer/GemVisualizer";
import { StockBadge } from "@/components/ui/Badge";

interface GemCardProps {
  slug: string;
  name: string;
  mineralName: string;
  cutSlug: string;
  cutName: string;
  caratWeight: number;
  colorHue: number;
  colorLightness: number;
  claritySlug: string;
  clarityName: string;
  treatmentName: string;
  isCeylon: boolean;
  stockStatus: string;
}

export function GemCard(props: GemCardProps) {
  return (
    <Link
      href={`/gems/${props.slug}`}
      className="group block overflow-hidden rounded-xl border border-border-subtle bg-surface transition-shadow hover:shadow-lg hover:shadow-charcoal/5"
    >
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-b from-ivory-soft to-ivory p-6">
        <GemVisualizer
          cutSlug={props.cutSlug}
          hue={props.colorHue}
          darkness={props.colorLightness}
          claritySlug={props.claritySlug}
          caratWeight={props.caratWeight}
          seedKey={props.slug}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <StockBadge status={props.stockStatus} />
        </div>
        {props.isCeylon && (
          <div className="absolute left-3 top-3 rounded-full bg-charcoal/85 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-ivory">
            Ceylon
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-serif text-lg leading-snug text-charcoal">{props.name}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/50">
          {props.mineralName} · {props.cutName}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal/60">
          <span>{props.caratWeight} ct</span>
          <span>{props.clarityName}</span>
          <span>{props.treatmentName}</span>
        </div>
      </div>
    </Link>
  );
}
