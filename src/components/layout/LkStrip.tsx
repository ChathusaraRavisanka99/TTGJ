import { Banknote, Landmark, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { KandyanDivider } from "@/components/decor/Kandyan";

/**
 * Home-page strip that only the Sri Lanka store shows: what's different
 * about buying here (rupee prices, bank-transfer checkout, delivery within
 * Sri Lanka). Every line describes what the checkout actually does today —
 * card and cash on delivery are called out as coming soon, not promised.
 */
export async function LkStrip() {
  const t = await getTranslations("lk.strip");
  const items = [
    { icon: Banknote, title: t("pricesTitle"), body: t("pricesBody") },
    { icon: Landmark, title: t("payTitle"), body: t("payBody") },
    { icon: Truck, title: t("deliveryTitle"), body: t("deliveryBody") },
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-4 sm:px-8 sm:pb-10">
      <KandyanDivider className="mb-8 sm:mb-10" />
      <ul className="grid gap-6 sm:grid-cols-3 sm:gap-8">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4 sm:flex-col sm:items-center sm:text-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-deep">
              <Icon size={20} strokeWidth={1.4} />
            </span>
            <div>
              <p className="font-serif text-xl text-charcoal">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-charcoal/70">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
