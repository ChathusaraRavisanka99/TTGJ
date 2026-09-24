import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOriginContent } from "@/lib/origin-content";
import { OriginContentForm } from "@/components/admin/OriginContentForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminOriginContentPage({ params }: PageProps<"/admin/master-data/origins/[id]">) {
  const { id } = await params;
  const [origin, content] = await Promise.all([
    prisma.origin.findUnique({ where: { id } }),
    getOriginContent(id),
  ]);
  if (!origin) notFound();

  return (
    <div>
      <BackLink href="/admin/master-data/origins" label="Back to Origins" />
      <h1 className="font-serif text-3xl text-charcoal">{origin.name}</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Optional editorial copy shown as an &ldquo;About this origin&rdquo; block on this origin&apos;s gemstone product pages.
      </p>

      <div className="mt-6">
        <OriginContentForm originId={origin.id} content={content} />
      </div>
    </div>
  );
}
