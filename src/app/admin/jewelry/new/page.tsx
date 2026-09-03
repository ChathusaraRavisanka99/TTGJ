import { JewelryForm } from "@/components/admin/JewelryForm";
import { BackLink } from "@/components/admin/BackLink";

export default function NewJewelryPage() {
  return (
    <div>
      <BackLink href="/admin/jewelry" label="Back to Jewelry" />
      <h1 className="font-serif text-3xl text-charcoal">Add Jewelry Piece</h1>
      <div className="mt-6">
        <JewelryForm />
      </div>
    </div>
  );
}
