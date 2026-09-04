import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuctionDisplayState, auctionItemLabel, highestBid } from "@/lib/auctions";
import { AuctionStateBadge } from "@/components/ui/Badge";
import { AuctionForm } from "@/components/admin/AuctionForm";
import { AuctionAdminControls } from "@/components/admin/AuctionAdminControls";
import { MediaGallery } from "@/components/catalog/MediaGallery";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";

export default async function AdminAuctionDetailPage({ params }: PageProps<"/admin/auctions/[id]">) {
  const { id } = await params;
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      gemstone: { include: { media: true } },
      jewelry: { include: { media: true } },
      bids: { include: { user: true }, orderBy: { amount: "desc" } },
    },
  });
  if (!auction) notFound();

  const state = getAuctionDisplayState(auction);
  const label = auctionItemLabel(auction);
  const media = auction.gemstone?.media ?? auction.jewelry?.media ?? [];
  const top = highestBid(auction.bids);

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/auctions" label="Back to Auctions" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">{label}</h1>
        <AuctionStateBadge state={state} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <MediaGallery media={media} fallbackLabel={label} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/45">Starting</p>
                <p className="mt-1 text-charcoal">{formatPrice(auction.startingPrice)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/45">Reserve</p>
                <p className="mt-1 text-charcoal">{formatPrice(auction.reservePrice)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-charcoal/45">High Bid</p>
                <p className="mt-1 text-charcoal">{top != null ? formatPrice(top) : "No bids"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-charcoal/45">
              {auction.startsAt.toLocaleString()} → {auction.endsAt.toLocaleString()}
            </p>
          </div>

          <AuctionAdminControls auctionId={auction.id} state={state} hasBids={auction.bids.length > 0} />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
        <p className="font-serif text-lg text-charcoal">Bid History</p>
        <div className="mt-3 divide-y divide-border-subtle">
          {auction.bids.map((bid, i) => (
            <div key={bid.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className={i === 0 ? "font-medium text-charcoal" : "text-charcoal/70"}>{bid.user.email}</span>
                {i === 0 && <span className="ml-2 text-xs text-gold">Highest</span>}
              </div>
              <div className="flex items-center gap-3 text-charcoal/60">
                <span>{bid.createdAt.toLocaleString()}</span>
                <span className="font-serif text-charcoal">{formatPrice(bid.amount)}</span>
              </div>
            </div>
          ))}
          {auction.bids.length === 0 && <p className="py-2 text-sm text-charcoal/50">No bids yet.</p>}
        </div>
      </div>

      {auction.status !== "WON" && (
        <div className="mt-8 border-t border-border-subtle pt-8">
          <p className="font-serif text-xl text-charcoal">Edit</p>
          <div className="mt-4">
            <AuctionForm
              gemstones={[]}
              jewelry={[]}
              initial={{
                id: auction.id,
                itemLabel: label,
                startingPrice: auction.startingPrice,
                reservePrice: auction.reservePrice,
                bidIncrement: auction.bidIncrement,
                startsAt: auction.startsAt.toISOString(),
                endsAt: auction.endsAt.toISOString(),
                status: auction.status,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
