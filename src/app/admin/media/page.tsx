import Link from "next/link";
import Image from "next/image";
import { Video } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminMediaPage() {
  const media = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: { gemstone: { select: { id: true, name: true } }, jewelry: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Media Library</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        All uploaded product images and videos. Manage uploads, primary image, and ordering from each product&apos;s edit page.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => {
          const product = item.gemstone ?? item.jewelry;
          const href = item.gemstone ? `/admin/gems/${item.gemstone.id}` : item.jewelry ? `/admin/jewelry/${item.jewelry.id}` : "#";
          return (
            <Link key={item.id} href={href} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft">
                {item.type === "VIDEO" ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video size={24} className="text-charcoal/40" />
                  </div>
                ) : (
                  <Image src={item.url} alt={item.altText ?? ""} fill className="object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
              <p className="mt-1.5 truncate text-xs text-charcoal/60">{product?.name ?? "Unlinked"}</p>
            </Link>
          );
        })}
        {media.length === 0 && <p className="col-span-full py-12 text-center text-charcoal/50">No media uploaded yet.</p>}
      </div>
    </div>
  );
}
