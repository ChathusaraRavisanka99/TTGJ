import { prisma } from "@/lib/prisma";
import { AuctionForm } from "@/components/admin/AuctionForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewAuctionPage() {
  const [gemstones, jewelry] = await Promise.all([
    prisma.gemstone.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.jewelryPiece.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/auctions" label="Back to Auctions" />
      <h1 className="font-serif text-3xl text-charcoal">New Auction</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Pick a catalog gemstone or jewelry piece, set the starting and reserve prices, and a bidding window.
      </p>

      <div className="mt-6">
        <AuctionForm gemstones={gemstones} jewelry={jewelry} />
      </div>
    </div>
  );
}
